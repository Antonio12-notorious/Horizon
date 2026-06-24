import { Request, Response } from "express";
import * as invoiceService from "./invoices.services.js";
import { AppError } from "../../middleware/error.middleware.js";

export async function getInvoices(req: Request, res: Response) {
    const invoices = await invoiceService.getAllInvoices();
    res.json(invoices);
}

export async function getInvoice(req: Request, res: Response) {
    const invoice = await invoiceService.getInvoiceById(req.params.id);

    if (!invoice) {
        throw new AppError(404, "Fatura não encontrada");
    }

    res.json(invoice);
}

export async function createInvoice(req: Request, res: Response) {
    const invoice = await invoiceService.createInvoice(req.body);

    res.status(201).json({
        message: "Fatura criada com sucesso",
        data: invoice,
    });
}

export async function updateInvoice(req: Request, res: Response) {
    const invoice = await invoiceService.updateInvoice(req.params.id, req.body);

    res.json({
        message: "Fatura atualizada com sucesso",
        data: invoice,
    });
}

export async function deleteInvoice(req: Request, res: Response) {
    await invoiceService.deleteInvoice(req.params.id);

    res.json({
        message: "Fatura eliminada com sucesso",
    });
}