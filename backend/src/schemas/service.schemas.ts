import { z } from "zod";

export const createServiceSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    description: z.string().optional(),
    price: z.number().positive("Preço deve ser positivo"),
    status: z.string().optional(),
});

export const updateServiceSchema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    status: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Pelo menos um campo deve ser fornecido",
});