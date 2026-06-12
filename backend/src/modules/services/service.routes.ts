import { Router } from "express";
import * as controller from "./service.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateSchema } from "../../middleware/validate.middleware";
import { createServiceSchema, updateServiceSchema } from "../../schemas/service.schemas";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getServices));

router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getService));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(createServiceSchema), asyncHandler(controller.createService));

router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(updateServiceSchema), asyncHandler(controller.updateService));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(controller.deleteService));

export default router;