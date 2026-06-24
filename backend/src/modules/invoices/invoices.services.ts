import { prisma } from "../../lib/prisma.js";

type InvoiceItemInput = {
    serviceId: string;
    quantity: number;
};

type CreateInvoiceInput = {
    clientId: string;
    issueDate?: string;
    dueDate?: string;
    notes?: string;
    items: InvoiceItemInput[];
};

export async function getAllInvoices() {
    return prisma.invoice.findMany({
        include: {
            client: true,
            items: {
                include: {
                    service: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
}

export async function getInvoiceById(id: string) {
    return prisma.invoice.findUnique({
        where: { id },
        include: {
            client: true,
            items: {
                include: {
                    service: true,
                },
            },
        },
    });
}

export async function createInvoice(data: CreateInvoiceInput) {
    if (!data.clientId) {
        throw new Error("Cliente é obrigatório");
    }

    if (!data.items || data.items.length === 0) {
        throw new Error("Adicione pelo menos um item à fatura");
    }

    const serviceIds = data.items.map((item) => item.serviceId);

    const services = await prisma.service.findMany({
        where: {
            id: {
                in: serviceIds,
            },
            status: "Ativo",
        },
    });

    const invoiceItems = data.items.map((item) => {
        const service = services.find((s) => s.id === item.serviceId);

        if (!service) {
            throw new Error("Serviço não encontrado ou inativo");
        }

        const quantity = Number(item.quantity) || 1;
        const unitPrice = service.price;
        const subtotal = quantity * unitPrice;

        return {
            serviceId: item.serviceId,
            quantity,
            unitPrice,
            subtotal,
        };
    });

    const total = invoiceItems.reduce((acc, item) => acc + item.subtotal, 0);

    return prisma.invoice.create({
        data: {
            clientId: data.clientId,
            issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
            dueDate: data.dueDate ? new Date(data.dueDate) : null,
            notes: data.notes || null,
            total,
            status: "Pendente",
            items: {
                create: invoiceItems,
            },
        },
        include: {
            client: true,
            items: {
                include: {
                    service: true,
                },
            },
        },
    });
}

export async function updateInvoice(id: string, data: any) {
    return prisma.invoice.update({
        where: { id },
        data: {
            status: data.status,
            dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
            notes: data.notes,
        },
        include: {
            client: true,
            items: {
                include: {
                    service: true,
                },
            },
        },
    });
}

export async function deleteInvoice(id: string) {
    return prisma.invoice.delete({
        where: { id },
    });
}