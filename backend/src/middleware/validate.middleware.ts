import { Request, Response, NextFunction } from "express";
import { z } from "zod";

export interface ValidationRequest extends Request {
    validatedData?: any;
}

export const validateSchema = (schema: z.ZodType) => {
    return (req: ValidationRequest, res: Response, next: NextFunction) => {
        
        const result = schema.safeParse(req.body);

        if (result.success) {
            req.validatedData = result.data;
            return next();
        }

        console.log("VALIDATION ERROR:", result.error.issues);

        return res.status(400).json({
            error: "Validation error",
            details: result.error.issues.map((issue: any) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    };
};

export const validateQuery = (schema: z.ZodType) => {
    return (req: ValidationRequest, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.query);

        if (result.success) {
            req.validatedData = result.data;
            return next();
        }

        return res.status(400).json({
            error: "Validation error",
            details: result.error.issues.map((issue: any) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    };
};