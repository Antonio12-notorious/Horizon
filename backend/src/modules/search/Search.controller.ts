import { Request, Response, NextFunction } from "express";
import { search, ResultType } from "./Search.service";

const VALID_TYPES: ResultType[] = ["client", "service", "invoice", "appointment"];

export async function searchHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {

        res.set("cache-control", "no-store");
        const q = String(req.query.q ?? "").trim();
        const limit = Math.min(Number(req.query.limit ?? 10), 30);
        const typesParam = req.query.types ? String(req.query.types).split(",") : undefined;

        // Validação mínima
        if (q.length < 2) {
            res.status(400).json({
                error: "Bad Request",
                message: "O parâmetro 'q' deve ter pelo menos 2 caracteres.",
            });
            return;
        }

        // Filtrar tipos inválidos
        const types = typesParam
            ? (typesParam.filter((t) => VALID_TYPES.includes(t as ResultType)) as ResultType[])
            : undefined;

        const results = await search({ q, limit, types });

        res.json({ results, total: results.length, query: q });
    } catch (err) {
        next(err);
    }
}