import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(2, "Nome obrigatório"),
    email: z.string().email("Email inválido"),
    role: z.enum(["ADMIN", "GERENTE", "OPERADOR"] as const, {
        error: () => ({ message: "Role inválido" }),
    }),
    department: z.string().optional(),
    contact: z.string().optional(),
});

export const updateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email("Email inválido").optional(),
    role: z.enum(["ADMIN", "GERENTE", "OPERADOR"] as const).optional(),
    department: z.string().optional(),
    contact: z.string().optional(),
});

export const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    avatar: z.string().optional(),
});