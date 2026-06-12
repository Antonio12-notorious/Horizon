import { prisma } from "../../lib/prisma";

export async function getAppointments() {
    return prisma.appointment.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            client: true,
            service: true,
        },
    });
}

export async function createAppointment(data: {
    clientId: string;
    serviceId: string;
    date: string;
    time: string;
    status?: string;
}) {
    return prisma.appointment.create({
        data: {
            clientId: data.clientId,
            serviceId: data.serviceId,
            date: new Date(data.date),
            time: data.time,
            status: data.status || "Pendente",
        },
        include: {
            client: true,
            service: true,
        },
    });
}

export async function updateAppointment(id: string, data: any) {
    return prisma.appointment.update({
        where: { id },
        data: {
            ...data,
            ...(data.date && { date: new Date(data.date) }),
        },
        include: {
            client: true,
            service: true,
        },
    });
}

export async function deleteAppointment(id: string) {
    return prisma.appointment.delete({
        where: { id },
    });
}