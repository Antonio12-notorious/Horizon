import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

export function roleMiddleware(allowedRoles: string[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(401).json({ error: "Sem utilizador autenticado" });
        }

        const normalizedUserRole = userRole.toLowerCase();
        const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

        if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        next();
    };
}