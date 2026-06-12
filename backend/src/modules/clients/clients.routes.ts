import { Router } from "express";
import * as controller from "./clients.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { validateSchema } from "../../middleware/validate.middleware";
import { createClientSchema, updateClientSchema } from "../../schemas/clients.schemas";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getAllClients));

router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getClientById));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), validateSchema(createClientSchema), asyncHandler(controller.createClient));

router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(updateClientSchema), asyncHandler(controller.updateClient));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(controller.deleteClient));

export default router;