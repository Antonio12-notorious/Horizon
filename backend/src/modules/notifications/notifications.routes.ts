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

        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
            overdueInvoices,
            appointmentsToday,
            appointmentsTomorrow,
            recentInvoicesPaid,
            recentClients,
            pendingInvoicesCount,
        ] = await Promise.all([
            // Faturas vencidas (dueDate < hoje e status Pendente)
            prisma.invoice.findMany({
                take: 5,
                where: {
                    status: "Pendente",
                    dueDate: { lt: today },
                },
                include: { client: true },
                orderBy: { dueDate: "asc" },
            }),

            // Agendamentos hoje
            prisma.appointment.findMany({
                take: 5,
                where: { date: { gte: today, lt: tomorrow } },
                include: { client: true, service: true },
                orderBy: { time: "asc" },
            }),

            // Agendamentos amanhã
            prisma.appointment.findMany({
                take: 3,
                where: { date: { gte: tomorrow, lt: threeDaysFromNow } },
                include: { client: true, service: true },
                orderBy: { date: "asc" },
            }),

            // Faturas pagas recentemente (últimos 7 dias)
            prisma.invoice.findMany({
                take: 5,
                where: {
                    status: "Pago",
                    updatedAt: { gte: sevenDaysAgo },
                },
                include: { client: true },
                orderBy: { updatedAt: "desc" },
            }),

            // Novos clientes (últimos 7 dias)
            prisma.client.findMany({
                take: 3,
                where: { createdAt: { gte: sevenDaysAgo } },
                orderBy: { createdAt: "desc" },
            }),

            // Total faturas pendentes
            prisma.invoice.count({ where: { status: "Pendente" } }),
        ]);

        const notifications: any[] = [];

        // 🔴 Faturas vencidas — URGENTE
        overdueInvoices.forEach((inv) => {
            const daysOverdue = Math.floor(
                (today.getTime() - new Date(inv.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
            );
            notifications.push({
                id: `overdue-${inv.id}`,
                title: "Fatura Vencida",
                description: `Fatura de ${inv.client?.name || "cliente"} está vencida há ${daysOverdue} dia${daysOverdue !== 1 ? "s" : ""}.`,
                time: relativeTime(inv.dueDate!),
                type: "warning",
                category: "Faturas",
                read: false,
                priority: 1,
            });
        });

        // 🟠 Alerta se muitas faturas pendentes
        if (pendingInvoicesCount > 5) {
            notifications.push({
                id: "pending-bulk",
                title: "Faturas Pendentes",
                description: `Tens ${pendingInvoicesCount} faturas pendentes de pagamento.`,
                time: "agora",
                type: "warning",
                category: "Faturas",
                read: false,
                priority: 2,
            });
        }

        // 🟡 Agendamentos hoje
        appointmentsToday.forEach((app) => {
            notifications.push({
                id: `appt-today-${app.id}`,
                title: "Agendamento Hoje",
                description: `${app.client?.name || "Cliente"} — ${app.service?.name || "Serviço"} às ${app.time}.`,
                time: `hoje às ${app.time}`,
                type: "info",
                category: "Agenda",
                read: false,
                priority: 3,
            });
        });

        // 🔵 Agendamentos próximos
        appointmentsTomorrow.forEach((app) => {
            const dateStr = new Date(app.date).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "short" });
            notifications.push({
                id: `appt-soon-${app.id}`,
                title: "Agendamento Próximo",
                description: `${app.client?.name || "Cliente"} — ${app.service?.name || "Serviço"} em ${dateStr}.`,
                time: dateStr,
                type: "info",
                category: "Agenda",
                read: true,
                priority: 4,
            });
        });

        // 🟢 Faturas pagas recentemente
        recentInvoicesPaid.forEach((inv) => {
            notifications.push({
                id: `paid-${inv.id}`,
                title: "Pagamento Recebido",
                description: `${inv.client?.name || "Cliente"} pagou a fatura #${inv.id.slice(-6).toUpperCase()}.`,
                time: relativeTime(inv.updatedAt),
                type: "success",
                category: "Faturas",
                read: true,
                priority: 5,
            });
        });

        // 🟢 Novos clientes
        recentClients.forEach((client) => {
            notifications.push({
                id: `client-${client.id}`,
                title: "Novo Cliente",
                description: `${client.name} foi adicionado ao sistema.`,
                time: relativeTime(client.createdAt),
                type: "success",
                category: "Clientes",
                read: true,
                priority: 6,
            });
        });

        // Ordena por prioridade
        notifications.sort((a, b) => a.priority - b.priority);

        res.json(notifications);
    } catch (error) {
        console.error("Erro ao carregar notificações:", error);
        res.status(500).json({ message: "Erro ao carregar notificações" });
    }
});

function relativeTime(date: Date | string): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "agora mesmo";
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays === 1) return "ontem";
    if (diffDays < 7) return `há ${diffDays} dias`;
    return d.toLocaleDateString("pt-PT");
}

export default router;