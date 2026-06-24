import { Request, Response } from "express";
import * as serviceService from "./services.service.js";
import { AppError } from "../../middleware/error.middleware.js";

export async function getServices(req: Request, res: Response) {
    const services = await serviceService.getAllServices();
    res.json(services);
}

export async function getService(req: Request, res: Response) {
    const service = await serviceService.getServiceById(req.params.id);
    if (!service) {
        throw new AppError(404, "Serviço não encontrado");
    }
    res.json(service);
}

export async function createService(req: any, res: Response) {
    const service = await serviceService.createService(req.validatedData);
    res.status(201).json({
        message: "Serviço criado com sucesso",
        data: service
    });
}

export async function updateService(req: any, res: Response) {
    const service = await serviceService.updateService(req.params.id, req.validatedData);
    res.json({
        message: "Serviço atualizado com sucesso",
        data: service
    });
}

export async function deleteService(req: Request, res: Response) {
    await serviceService.deleteService(req.params.id);
    res.json({ message: "Serviço eliminado com sucesso" });
}