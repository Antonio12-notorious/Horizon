import { z } from "zod";

export const createAppointmentSchema = z.object({
    clientId: z.string().min(1, "Cliente obrigatório"),
    serviceId: z.string().min(1, "Serviço obrigatório"),
    date: z.string().min(1, "Data obrigatória"),
    time: z.string().min(1, "Hora obrigatória"),
    status: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
    clientId: z.string().optional(),
    serviceId: z.string().optional(),
    date: z.string().optional(),
    time: z.string().optional(),
    status: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido",
});