import { prisma } from "../../lib/prisma.js";

export async function getAllClients() {
    return await prisma.client.findMany({
        orderBy: { createdAt: "desc" }
    });
}

export async function getClientById(id: string) {
    return await prisma.client.findUnique({
        where: { id }
    });
}

export async function createClient(data: {
    name: string;
    email: string;
    phone?: string;
    service?: string;
}) {
    return await prisma.client.create({
        data
    });
}

export async function updateClient(id: string, data: any) {
    return await prisma.client.update({
        where: { id },
        data
    });
}

export async function deleteClient(id: string) {
    return await prisma.client.delete({
        where: { id }
    });
}