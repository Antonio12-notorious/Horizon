import jwt, { SignOptions } from "jsonwebtoken";
import { config } from "../config";

// ─── Access Token (curta duração) ─────────────────────────────────────────────

export function generateToken(payload: object): string {
    const secret = config.jwt.secret as string;
    const options: SignOptions = {
        expiresIn: (config.jwt.expiresIn as SignOptions["expiresIn"]) ?? "15m",
    };
    return jwt.sign(payload, secret, options);
}

export function verifyToken(token: string): any {
    return jwt.verify(token, config.jwt.secret as string);
}

// ─── Refresh Token (longa duração) ───────────────────────────────────────────

export function generateRefreshToken(payload: object): string {
    const secret = (config.jwt.refreshSecret ?? config.jwt.secret) as string;
    const options: SignOptions = {
        expiresIn: (config.jwt.refreshExpiresIn as SignOptions["expiresIn"]) ?? "7d",
    };
    return jwt.sign(payload, secret, options);
}

export function verifyRefreshToken(token: string): any {
    const secret = (config.jwt.refreshSecret ?? config.jwt.secret) as string;
    return jwt.verify(token, secret);
}

// ─── Alias (compatibilidade com código antigo) ────────────────────────────────

export const signToken = generateToken;