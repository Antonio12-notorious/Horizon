import { Response } from "express";
import * as clientsService from "./clients.service";
import { AppError } from "../../middleware/error.middleware";

export interface ValidatedRequest {
    validatedData?: any;
}

export async function getAllClients(req: any, res: Response) {
    const clients = await clientsService.getAllClients();
    res.json(clients);
}

export async function getClientById(req: any, res: Response) {
    const client = await clientsService.getClientById(req.params.id);
    if (!client) {
        throw new AppError(404, "Cliente não encontrado");
    }
    res.json(client);
}

export async function createClient(req: any, res: Response) {
    const client = await clientsService.createClient(req.validatedData);
    res.status(201).json({
        message: "Cliente criado com sucesso",
        data: client
    });
}

export async function updateClient(req: any, res: Response) {
    const client = await clientsService.updateClient(req.params.id, req.validatedData);
    res.json({
        message: "Cliente atualizado com sucesso",
        data: client
    });
}

export async function deleteClient(req: any, res: Response) {
    await clientsService.deleteClient(req.params.id);
    res.json({
        message: "Cliente deletado com sucesso"
    });
}