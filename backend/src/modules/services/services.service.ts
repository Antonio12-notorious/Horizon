import { prisma } from "../../lib/prisma.js";

export async function getAllServices() {
    return await prisma.service.findMany({
        orderBy: { createdAt: "desc" }
    });
}

export async function getServiceById(id: string) {
    return await prisma.service.findUnique({
        where: { id }
    });
}

export async function createService(data: {
    name: string;
    price: number;
    description?: string;
}) {
    return await prisma.service.create({
        data
    });
}

export async function updateService(id: string, data: any) {
    return await prisma.service.update({
        where: { id },
        data
    });
}

export async function deleteService(id: string) {
    return await prisma.service.delete({
        where: { id }
    });
}