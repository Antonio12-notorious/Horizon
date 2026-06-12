import { z } from "zod";

export const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Senha obrigatória"),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Senha actual obrigatória"),
    newPassword: z
        .string()
        .min(8, "Mínimo 8 caracteres")
        .regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula")
        .regex(/[0-9]/, "Deve conter pelo menos um número"),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Token obrigatório"),
    newPassword: z
        .string()
        .min(8, "Mínimo 8 caracteres")
        .regex(/[A-Z]/, "Deve conter pelo menos uma maiúscula")
        .regex(/[0-9]/, "Deve conter pelo menos um número"),
});