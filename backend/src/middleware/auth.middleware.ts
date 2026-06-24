import { verifyToken } from "../utils/jwt.js";
import { Request, Response, NextFunction } from "express";

// 🔐 extender Request para incluir user
export interface AuthRequest extends Request {
    user?: any;
}

export function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ error: "No token" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = verifyToken(token);
        req.user = decoded; // agora funciona
        next();
    } catch (err) {
        return res.status(401).json({ error: "Token inválido" });
    }
    console.log("USER:", req.user);
}
