import { Router } from "express";
import * as controller from "./service.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { validateSchema } from "../../middleware/validate.middleware.js";
import { createServiceSchema, updateServiceSchema } from "../../schemas/service.schemas.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getServices));

router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getService));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(createServiceSchema), asyncHandler(controller.createService));

router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(updateServiceSchema), asyncHandler(controller.updateService));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(controller.deleteService));

export default router;