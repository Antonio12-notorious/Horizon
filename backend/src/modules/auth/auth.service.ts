import { prisma } from "../../lib/prisma";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { AppError } from "../../middleware/error.middleware";
import bcrypt from "bcrypt";
import crypto from "crypto";

const BCRYPT_ROUNDS = 12;

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(
    data: { email: string; password: string },
    ip?: string,
    userAgent?: string
) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
        throw new AppError(401, "Credenciais inválidas");
    }

    if (user.status === "BLOQUEADO") {
        throw new AppError(403, "Conta bloqueada. Contacte o administrador.");
    }

    if (user.status === "INATIVO") {
        throw new AppError(403, "Conta desactivada. Contacte o administrador.");
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
        throw new AppError(401, "Credenciais inválidas");
    }

    // gerar tokens
    const accessToken = generateToken({ id: user.id, role: user.role });
    const refreshTokenValue = generateRefreshToken({ id: user.id });

    // persistir refresh token (7 dias)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
        data: { token: refreshTokenValue, userId: user.id, expiresAt },
    });

    // actualizar último login + status
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            status: user.status === "PENDENTE" ? "ATIVO" : user.status,
        },
    });

    // log de acesso
    await prisma.accessLog.create({
        data: {
            userId: user.id,
            action: "LOGIN",
            ip: ip ?? null,
            userAgent: userAgent ?? null,
        },
    });

    return {
        token: accessToken,
        refreshToken: refreshTokenValue,
        mustChangePassword: user.mustChangePassword,
        user: sanitizeUser(user),
    };
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refreshSession(refreshToken: string) {
    let payload: any;

    try {
        payload = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError(401, "Refresh token inválido ou expirado");
    }

    const stored = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
        throw new AppError(401, "Sessão expirada. Faça login novamente.");
    }

    if (stored.user.status === "BLOQUEADO" || stored.user.status === "INATIVO") {
        throw new AppError(403, "Conta sem acesso.");
    }

    // revogar token antigo
    await prisma.refreshToken.delete({ where: { token: refreshToken } });

    // emitir novo par
    const newAccessToken = generateToken({ id: stored.user.id, role: stored.user.role });
    const newRefreshToken = generateRefreshToken({ id: stored.user.id });

    await prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: stored.user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        user: sanitizeUser(stored.user),
    };
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
        await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    } else {
        // revogar todas as sessões
        await prisma.refreshToken.deleteMany({ where: { userId } });
    }

    await prisma.accessLog.create({
        data: { userId, action: "LOGOUT" },
    });
}

// ─── Alterar senha (primeiro login ou voluntário) ─────────────────────────────

export async function changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string }
) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "Utilizador não encontrado");

    const match = await bcrypt.compare(data.currentPassword, user.password);
    if (!match) throw new AppError(400, "Senha actual incorrecta");

    if (data.currentPassword === data.newPassword) {
        throw new AppError(400, "A nova senha não pode ser igual à actual");
    }

    const hashed = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashed, mustChangePassword: false },
    });

    await prisma.accessLog.create({
        data: { userId, action: "PASSWORD_CHANGED" },
    });

    return { message: "Senha alterada com sucesso" };
}

// ─── Solicitar reset de senha ─────────────────────────────────────────────────

export async function requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    // não revelar se email existe ou não
    if (!user) return { message: "Se o email existir, receberá instruções." };

    // invalidar tokens anteriores
    await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
    });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 horas

    await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
    });

    await prisma.accessLog.create({
        data: { userId: user.id, action: "PASSWORD_RESET_REQUESTED" },
    });

    // TODO: enviar email com token
    // await emailService.sendPasswordReset(user.email, token);

    return {
        message: "Se o email existir, receberá instruções.",
        // apenas em DEV — remover em produção
        ...(process.env.NODE_ENV !== "production" && { debugToken: token }),
    };
}

// ─── Confirmar reset de senha ─────────────────────────────────────────────────

export async function resetPassword(token: string, newPassword: string) {
    const record = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
    });

    if (!record || record.used || record.expiresAt < new Date()) {
        throw new AppError(400, "Token inválido ou expirado");
    }

    const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed, mustChangePassword: false },
    });

    await prisma.passwordResetToken.update({
        where: { token },
        data: { used: true },
    });

    await prisma.accessLog.create({
        data: { userId: record.userId, action: "PASSWORD_RESET_COMPLETED" },
    });

    return { message: "Senha redefinida com sucesso" };
}

// ─── Sessão actual ────────────────────────────────────────────────────────────

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "Utilizador não encontrado");
    return sanitizeUser(user);
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function sanitizeUser(user: any) {
    const { password, ...safe } = user;
    return safe;
}