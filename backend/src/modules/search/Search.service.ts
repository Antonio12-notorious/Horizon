import { prisma } from "../../lib/prisma";

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ResultType = "client" | "service" | "invoice" | "appointment";

export interface SearchResult {
    id: string;
    type: ResultType;
    title: string;
    subtitle: string;
    meta?: string;
    path: string;
}

export interface SearchOptions {
    q: string;
    limit?: number;
    types?: ResultType[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("pt-MZ", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatCurrency(value: number): string {
    return `${value.toFixed(2)} MT`;
}

// ─── Pesquisa por entidade ────────────────────────────────────────────────────

async function searchClients(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await prisma.client.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
                { service: { contains: q, mode: "insensitive" } },
            ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, email: true, phone: true, status: true },
    });

    return rows.map((c) => ({
        id: c.id,
        type: "client",
        title: c.name,
        subtitle: c.email,
        meta: c.status !== "Ativo" ? c.status : undefined,
        path: `/clients/${c.id}`,
    }));
}

async function searchServices(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await prisma.service.findMany({
        where: {
            OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
            ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, category: true, price: true, status: true },
    });

    return rows.map((s) => ({
        id: s.id,
        type: "service",
        title: s.name,
        subtitle: s.category ?? "Sem categoria",
        meta: formatCurrency(s.price),
        path: `/services/${s.id}`,
    }));
}

async function searchInvoices(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await prisma.invoice.findMany({
        where: {
            OR: [
                { id: { contains: q, mode: "insensitive" } },
                { status: { contains: q, mode: "insensitive" } },
                { notes: { contains: q, mode: "insensitive" } },
                { client: { name: { contains: q, mode: "insensitive" } } },
                { client: { email: { contains: q, mode: "insensitive" } } },
            ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            total: true,
            status: true,
            issueDate: true,
            client: { select: { name: true } },
        },
    });

    return rows.map((i) => ({
        id: i.id,
        type: "invoice",
        title: `Fatura · ${i.client.name}`,
        subtitle: formatDate(i.issueDate),
        meta: `${formatCurrency(i.total)} · ${i.status}`,
        path: `/invoices/${i.id}`,
    }));
}

async function searchAppointments(q: string, limit: number): Promise<SearchResult[]> {
    const rows = await prisma.appointment.findMany({
        where: {
            OR: [
                { status: { contains: q, mode: "insensitive" } },
                { time: { contains: q, mode: "insensitive" } },
                { client: { name: { contains: q, mode: "insensitive" } } },
                { client: { email: { contains: q, mode: "insensitive" } } },
                { service: { name: { contains: q, mode: "insensitive" } } },
            ],
        },
        take: limit,
        orderBy: { date: "desc" },
        select: {
            id: true,
            date: true,
            time: true,
            status: true,
            client: { select: { name: true } },
            service: { select: { name: true } },
        },
    });

    return rows.map((a) => ({
        id: a.id,
        type: "appointment",
        title: a.client.name,
        subtitle: a.service.name,
        meta: `${formatDate(a.date)} ${a.time}`,
        path: `/appointments/${a.id}`,
    }));
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function search(options: SearchOptions): Promise<SearchResult[]> {
    const { q, limit = 10, types } = options;

    const perType = Math.ceil(limit / (types?.length ?? 4));

    const active = types ?? ["client", "service", "invoice", "appointment"];

    const queries = await Promise.all([
        active.includes("client") ? searchClients(q, perType) : [],
        active.includes("service") ? searchServices(q, perType) : [],
        active.includes("invoice") ? searchInvoices(q, perType) : [],
        active.includes("appointment") ? searchAppointments(q, perType) : [],
    ]);

    // Intercalar resultados por tipo (em vez de todos os clientes primeiro)
    const interleaved: SearchResult[] = [];
    const max = Math.max(...queries.map((q) => q.length));
    for (let i = 0; i < max; i++) {
        for (const bucket of queries) {
            if (bucket[i]) interleaved.push(bucket[i]);
        }
    }

    return interleaved.slice(0, limit);
}