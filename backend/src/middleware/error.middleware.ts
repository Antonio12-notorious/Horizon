import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
    }
}

export interface ErrorResponse {
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
    path?: string;
}

/**
 * Global error handler middleware
 * Deve ser o último middleware registrado
 */
export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error("[ERROR]", {
        timestamp: new Date().toISOString(),
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
    });

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.name,
            message: err.message,
            statusCode: err.statusCode,
            timestamp: new Date().toISOString(),
            path: req.path,
        } as ErrorResponse);
    }

    // Erro Prisma - unique constraint
    if (err.message.includes("Unique constraint failed")) {
        return res.status(409).json({
            error: "Conflict",
            message: "Registro já existe",
            statusCode: 409,
            timestamp: new Date().toISOString(),
            path: req.path,
        } as ErrorResponse);
    }

    // Erro Prisma - not found
    if (err.message.includes("not found")) {
        return res.status(404).json({
            error: "Not Found",
            message: "Registro não encontrado",
            statusCode: 404,
            timestamp: new Date().toISOString(),
            path: req.path,
        } as ErrorResponse);
    }

    // Erro genérico
    return res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === "production" 
            ? "Erro interno do servidor" 
            : err.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        path: req.path,
    } as ErrorResponse);
};
