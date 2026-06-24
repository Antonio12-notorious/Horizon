import { Request, Response } from "express";
import * as appointmentService from "./appointments.service.js";
import { AppError } from "../../middleware/error.middleware.js";

export async function getAppointments(req: Request, res: Response) {
    const appointments = await appointmentService.getAppointments();
    res.json(appointments);
}

export async function createAppointment(req: any, res: Response) {
    try {
        const appointment = await appointmentService.createAppointment(req.validatedData);
        res.status(201).json({
            message: "Marcação criada com sucesso",
            data: appointment
        });
    } catch (err: any) {
        throw new AppError(400, err.message);
    }
}

export async function updateAppointment(req: any, res: Response) {
    console.log("PARAMS:", req.params.id);
    console.log("BODY:", req.body);
    console.log("VALIDATED DATA:", req.validatedData);

    try {
        const appointment = await appointmentService.updateAppointment(
            req.params.id,
            req.validatedData
        );
        res.json({ message: "Marcação atualizada com sucesso", data: appointment });
    } catch (err: any) {
        throw new AppError(400, err.message);
    }
}

export async function deleteAppointment(req: Request, res: Response) {
    try {
        await appointmentService.deleteAppointment(req.params.id);
        res.json({
            message: "Marcação eliminada com sucesso"
        });
    } catch (err: any) {
        throw new AppError(400, err.message);
    }
}