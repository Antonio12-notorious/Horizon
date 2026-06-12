import { Request, Response } from "express";
import * as authService from "./auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../middleware/error.middleware";

export interface ValidatedRequest extends Request {
    validatedData?: any;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(req: ValidatedRequest, res: Response) {
    const ip = req.ip ?? req.socket.remoteAddress;
    const userAgent = req.headers["user-agent"];

    const result = await authService.login(req.validatedData, ip, userAgent);

    res.json({
        message: "Login realizado com sucesso",
        ...result,
    });
}

// ─── Refresh Token ────────────────────────────────────────────────────────────

export async function refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) throw new AppError(400, "Refresh token obrigatório");

    const result = await authService.refreshSession(refreshToken);
    res.json(result);
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(req: AuthRequest, res: Response) {
    const { refreshToken } = req.body;
    await authService.logout(req.user.id, refreshToken);
    res.json({ message: "Sessão terminada com sucesso" });
}

// ─── Alterar senha ────────────────────────────────────────────────────────────

export async function changePassword(req: AuthRequest & ValidatedRequest, res: Response) {
    const result = await authService.changePassword(req.user.id, req.validatedData);
    res.json(result);
}

// ─── Solicitar reset ──────────────────────────────────────────────────────────

export async function forgotPassword(req: ValidatedRequest, res: Response) {
    const result = await authService.requestPasswordReset(req.validatedData.email);
    res.json(result);
}

// ─── Confirmar reset ──────────────────────────────────────────────────────────

export async function resetPassword(req: ValidatedRequest, res: Response) {
    const { token, newPassword } = req.validatedData;
    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
}

// ─── Sessão actual (/api/me) ──────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response) {
    const user = await authService.getMe(req.user.id);
    res.json({ user });
}