import { z } from "zod";

export const createClientSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    phone: z.string().optional(),
    service: z.string().optional(),
    status: z.string().optional(),
});

export const updateClientSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    service: z.string().optional(),
    status: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido",
});