import { Response } from "express";
import * as userService from "./user.service";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { ValidatedRequest } from "../auth.controller";

// ─── Listar ───────────────────────────────────────────────────────────────────

export async function listUsers(req: AuthRequest, res: Response) {
    const { role, status, department, search } = req.query as Record<string, string>;
    const users = await userService.listUsers({ role, status, department, search });
    res.json({ users });
}

// ─── Detalhe ──────────────────────────────────────────────────────────────────

export async function getUser(req: AuthRequest, res: Response) {
    const user = await userService.getUserById(req.params.id);
    res.json({ user });
}

// ─── Criar ────────────────────────────────────────────────────────────────────

export async function createUser(req: AuthRequest & ValidatedRequest, res: Response) {
    console.log("validatedData:", req.validatedData); // ← adiciona esta linha
    console.log("body:", req.body);
   
    const result = await userService.createUser(req.validatedData, req.user.id);
    res.status(201).json({
        message: "Utilizador criado com sucesso",
        ...result,
    });
}

// ─── Actualizar ───────────────────────────────────────────────────────────────

export async function updateUser(req: AuthRequest & ValidatedRequest, res: Response) {
    const user = await userService.updateUser(req.params.id, req.validatedData, req.user.id);
    res.json({ message: "Utilizador actualizado", user });
}

// ─── Activar ──────────────────────────────────────────────────────────────────

export async function activateUser(req: AuthRequest, res: Response) {
    const user = await userService.setUserStatus(req.params.id, "ATIVO", req.user.id);
    res.json({ message: "Conta activada", user });
}

// ─── Desactivar ───────────────────────────────────────────────────────────────

export async function deactivateUser(req: AuthRequest, res: Response) {
    const user = await userService.setUserStatus(req.params.id, "INATIVO", req.user.id);
    res.json({ message: "Conta desactivada", user });
}

// ─── Bloquear ─────────────────────────────────────────────────────────────────

export async function blockUser(req: AuthRequest, res: Response) {
    const user = await userService.setUserStatus(req.params.id, "BLOQUEADO", req.user.id);
    res.json({ message: "Conta bloqueada", user });
}

// ─── Reset de senha ───────────────────────────────────────────────────────────

export async function resetUserPassword(req: AuthRequest, res: Response) {
    const result = await userService.adminResetPassword(req.params.id, req.user.id);
    res.json(result);
}

// ─── Logs do utilizador ───────────────────────────────────────────────────────

export async function getUserLogs(req: AuthRequest, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const logs = await userService.getUserLogs(req.params.id, limit);
    res.json({ logs });
}

// ─── Logs globais de segurança ────────────────────────────────────────────────

export async function getSecurityLogs(req: AuthRequest, res: Response) {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const logs = await userService.getSecurityLogs(limit);
    res.json({ logs });
}

// ─── Perfil do Utilizador (atualizar próprio perfil) ────────────────────────

export async function updateProfile(req: AuthRequest & ValidatedRequest, res: Response) {
    const user = await userService.updateProfile(req.user.id, req.validatedData);
    res.json({ message: "Perfil actualizado com sucesso", user });
}

// ─── Obter Perfil do Utilizador ──────────────────────────────────────────────

export async function getProfile(req: AuthRequest, res: Response) {
    const user = await userService.getProfile(req.user.id);
    res.json({ user });
}