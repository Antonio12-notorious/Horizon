import {prisma} from "../../../lib/prisma";
import { AppError } from "../../../middleware/error.middleware";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 12;

// ─── Listar utilizadores ──────────────────────────────────────────────────────

export async function listUsers(filters?: {
    role?: string;
    status?: string;
    department?: string;
    search?: string;
}) {
    const where: any = {};

    if (filters?.role) where.role = filters.role;
    if (filters?.status) where.status = filters.status;
    if (filters?.department) where.department = filters.department;

    if (filters?.search) {
        where.OR = [
            { name: { contains: filters.search, mode: "insensitive" } },
            { email: { contains: filters.search, mode: "insensitive" } },
        ];
    }

    const users = await prisma.user.findMany({
        where,
        select: {
            id: true, name: true, email: true, role: true,
            status: true, department: true, contact: true,
            mustChangePassword: true, lastLoginAt: true,
            createdAt: true, updatedAt: true,
            createdBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
    });

    return users;
}

// ─── Criar utilizador (apenas admin) ─────────────────────────────────────────

export async function createUser(
    data: {
        name: string;
        email: string;
        contact?: string;
        department?: string;
        role: string;
    },
    createdById: string
) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, "Email já registado");

    // gerar senha temporária
    const tempPassword = generateTempPassword(); 
    const hashed = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashed,
            role: data.role as any,
            status: "PENDENTE",
            department: data.department,
            contact: data.contact,
            mustChangePassword: true,
            createdById,
        },
        select: {
            id: true, name: true, email: true, role: true,
            status: true, department: true, contact: true,
            mustChangePassword: true, createdAt: true,
        },
    });

    await prisma.accessLog.create({
        data: {
            userId: createdById,
            action: "USER_CREATED",
            meta: { targetUserId: user.id, targetEmail: user.email },
        },
    });

    return {
        user,
        // credenciais para distribuir ao funcionário
        credentials: {
            email: user.email,
            tempPassword,
            mustChangePassword: true,
        },
    };
}

// ─── Actualizar utilizador ────────────────────────────────────────────────────

export async function updateUser(
    targetId: string,
    data: {
        name?: string;
        email?: string;
        contact?: string;
        department?: string;
        role?: string;
    },
    updatedById: string
) {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new AppError(404, "Utilizador não encontrado");

    if (data.email && data.email !== user.email) {
        const conflict = await prisma.user.findUnique({ where: { email: data.email } });
        if (conflict) throw new AppError(409, "Email já em uso");
    }

    const updated = await prisma.user.update({
        where: { id: targetId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.email && { email: data.email }),
            ...(data.contact && { contact: data.contact }),
            ...(data.department && { department: data.department }),
            ...(data.role && { role: data.role as any }),
        },
        select: {
            id: true, name: true, email: true, role: true,
            status: true, department: true, contact: true, updatedAt: true,
        },
    });

    await prisma.accessLog.create({
        data: {
            userId: updatedById,
            action: "USER_UPDATED",
            meta: { targetUserId: targetId },
        },
    });

    return updated;
}

// ─── Activar / Desactivar / Bloquear ─────────────────────────────────────────

export async function setUserStatus(
    targetId: string,
    status: "ATIVO" | "INATIVO" | "BLOQUEADO",
    adminId: string
) {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new AppError(404, "Utilizador não encontrado");

    // impedir que admin se bloqueie a si próprio
    if (targetId === adminId && status !== "ATIVO") {
        throw new AppError(400, "Não pode desactivar a sua própria conta");
    }

    const updated = await prisma.user.update({
        where: { id: targetId },
        data: { status: status as any },
        select: { id: true, name: true, status: true },
    });

    // revogar sessões activas se desactivar/bloquear
    if (status !== "ATIVO") {
        await prisma.refreshToken.deleteMany({ where: { userId: targetId } });
    }

    await prisma.accessLog.create({
        data: {
            userId: adminId,
            action: `USER_STATUS_${status}`,
            meta: { targetUserId: targetId },
        },
    });

    return updated;
}

// ─── Reset de senha pelo admin ────────────────────────────────────────────────

export async function adminResetPassword(targetId: string, adminId: string) {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new AppError(404, "Utilizador não encontrado");

    const tempPassword = generateTempPassword();
    console.log("TEMP PASSWORD:", tempPassword); // debug
    const hashed = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
        where: { id: targetId },
        data: { password: hashed, mustChangePassword: true },
    });

    // revogar sessões activas
    await prisma.refreshToken.deleteMany({ where: { userId: targetId } });

    await prisma.accessLog.create({
        data: {
            userId: adminId,
            action: "ADMIN_RESET_PASSWORD",
            meta: { targetUserId: targetId },
        },
    });

    return {
        message: "Senha redefinida com sucesso",
        credentials: {
            email: user.email,
            tempPassword,
            mustChangePassword: true,
        },
    };
}

// ─── Histórico de acessos ─────────────────────────────────────────────────────

export async function getUserLogs(userId: string, limit = 50) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, "Utilizador não encontrado");

    const logs = await prisma.accessLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
    });

    return logs;
}

// ─── Logs globais de segurança (admin) ───────────────────────────────────────

export async function getSecurityLogs(limit = 100) {
    return prisma.accessLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: limit,
    });
}

// ─── Detalhe de um utilizador ─────────────────────────────────────────────────

export async function getUserById(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        select: {
            id: true, name: true, email: true, role: true,
            status: true, department: true, contact: true,
            mustChangePassword: true, lastLoginAt: true,
            createdAt: true, updatedAt: true,
            createdBy: { select: { id: true, name: true } },
            accessLogs: {
                orderBy: { createdAt: "desc" },
                take: 20,
            },
        },
    });

    if (!user) throw new AppError(404, "Utilizador não encontrado");
    return user;
}

// ─── Perfil do Utilizador (atualizar próprio perfil) ────────────────────────

export async function updateProfile(
    userId: string,
    data: {
        name?: string;
        phone?: string;
        location?: string;
        avatar?: string;
    }
) {
    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.name && { name: data.name }),
            ...(data.phone && { contact: data.phone }),
            ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            contact: true,
            avatar: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    return updated;
}

// ─── Obter Perfil do Utilizador ──────────────────────────────────────────────

export async function getProfile(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            contact: true,
            avatar: true,
            verified: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) throw new AppError(404, "Utilizador não encontrado");
    return user;
}

// ─── Helper: gerar senha temporária ──────────────────────────────────────────

function generateTempPassword(): string {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const spec = "@#$!";
    const all = upper + lower + digits + spec;

    let password =
        upper[Math.floor(Math.random() * upper.length)] +
        lower[Math.floor(Math.random() * lower.length)] +
        digits[Math.floor(Math.random() * digits.length)] +
        spec[Math.floor(Math.random() * spec.length)];

    for (let i = 4; i < 12; i++) {
        password += all[Math.floor(Math.random() * all.length)];
    }

    return password.split("").sort(() => 0.5 - Math.random()).join("");
}