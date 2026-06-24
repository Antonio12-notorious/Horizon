import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { validateSchema } from "../../middleware/validate.middleware.js";
import { createAppointmentSchema, updateAppointmentSchema } from "../../schemas/appointments.schemas.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

import {
    getAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
} from "./appointments.controller.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(getAppointments));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), validateSchema(createAppointmentSchema), asyncHandler(createAppointment));

router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(updateAppointmentSchema), asyncHandler(updateAppointment));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(deleteAppointment));

export default router;