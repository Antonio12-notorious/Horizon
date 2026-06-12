import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        lastDayOfMonth.setHours(23, 59, 59, 999);

        // mês anterior
        const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        lastDayLastMonth.setHours(23, 59, 59, 999);

        // ontem
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const [
            clientsCount,
            clientsLastMonth,
            appointmentsToday,
            appointmentsYesterday,
            billingMonth,
            billingLastMonth,
            pendingInvoices,
            pendingInvoicesLastMonth,
            paidInvoices,
            recentAppointments,
            recentInvoicesList,
        ] = await Promise.all([
            prisma.client.count(),

            prisma.client.count({
                where: { createdAt: { lte: lastDayLastMonth } },
            }),

            prisma.appointment.count({
                where: { date: { gte: today, lt: tomorrow } },
            }),

            prisma.appointment.count({
                where: { date: { gte: yesterday, lt: today } },
            }),

            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    status: "Pago",
                    createdAt: { gte: firstDayOfMonth, lte: lastDayOfMonth },
                },
            }),

            prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    status: "Pago",
                    createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth },
                },
            }),

            prisma.invoice.count({ where: { status: "Pendente" } }),

            prisma.invoice.count({
                where: {
                    status: "Pendente",
                    createdAt: { gte: firstDayLastMonth, lte: lastDayLastMonth },
                },
            }),

            prisma.invoice.count({ where: { status: "Pago" } }),

            prisma.appointment.findMany({
                take: 5,
                orderBy: { date: "asc" },
                where: { date: { gte: today } },
                include: { client: true, service: true },
            }),

            prisma.invoice.findMany({
                take: 5,
                where: { status: "Pendente" },
                orderBy: { createdAt: "desc" },
                include: { client: true, items: { include: { service: true } } },
            }),
        ]);

        // ─── Últimos 6 meses de faturação ─────────────────────────────────────
        const billingChart = [];
        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            end.setHours(23, 59, 59, 999);

            const result = await prisma.invoice.aggregate({
                _sum: { total: true },
                where: {
                    status: "Pago",
                    createdAt: { gte: start, lte: end },
                },
            });

            billingChart.push({
                name: monthNames[d.getMonth()],
                val: result._sum.total || 0,
            });
        }

        // ─── Calcular trends ──────────────────────────────────────────────────
        const calcTrend = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? "+100%" : "0%";
            const diff = ((current - previous) / previous) * 100;
            return (diff >= 0 ? "+" : "") + diff.toFixed(0) + "%";
        };

        const calcTrendCount = (current: number, previous: number) => {
            const diff = current - previous;
            return (diff >= 0 ? "+" : "") + diff;
        };

        const billingMonthVal = billingMonth._sum.total || 0;
        const billingLastMonthVal = billingLastMonth._sum.total || 0;

        res.json({
            metrics: {
                clientsCount,
                appointmentsToday,
                billingMonth: billingMonthVal,
                pendingInvoices,
                trends: {
                    clients: calcTrend(clientsCount, clientsLastMonth),
                    appointments: calcTrendCount(appointmentsToday, appointmentsYesterday),
                    billing: calcTrend(billingMonthVal, billingLastMonthVal),
                    pendingInvoices: calcTrendCount(pendingInvoices, pendingInvoicesLastMonth),
                },
            },

            billingChart,

            invoiceStats: [
                { name: "Pagas", total: paidInvoices, color: "#22c55e" },
                { name: "Pendentes", total: pendingInvoices, color: "#f97316" },
            ],

            appointments: recentAppointments.map((a) => ({
                id: a.id,
                client: a.client,
                type: a.service?.name || "—",
                time: a.time,
                date: new Date(a.date).toLocaleDateString("pt-PT"),
                status: a.status,
            })),

            recentInvoices: recentInvoicesList.map((inv) => ({
                id: inv.id.slice(-6).toUpperCase(),
                clientName: inv.client?.name || "—",
                amount: inv.total,
                total: inv.total,
                date: new Date(inv.createdAt).toLocaleDateString("pt-PT"),
                items: inv.items,
            })),
        });
    } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        res.status(500).json({ message: "Erro ao carregar dashboard" });
    }
});

export default router;