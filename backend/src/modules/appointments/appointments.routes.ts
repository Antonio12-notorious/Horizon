import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateSchema } from "../../middleware/validate.middleware";
import { createAppointmentSchema, updateAppointmentSchema } from "../../schemas/appointments.schemas";
import { asyncHandler } from "../../utils/asyncHandler";

import {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
} from "./appointments.controller";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(getAppointments));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), validateSchema(createAppointmentSchema), asyncHandler(createAppointment));

router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(updateAppointmentSchema), asyncHandler(updateAppointment));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(deleteAppointment));

export default router;