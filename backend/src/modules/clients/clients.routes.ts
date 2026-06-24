import { Router } from "express";
import * as controller from "./clients.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { validateSchema } from "../../middleware/validate.middleware.js";
import { createClientSchema, updateClientSchema } from "../../schemas/clients.schemas.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getAllClients));

router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(controller.getClientById));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), validateSchema(createClientSchema), asyncHandler(controller.createClient));

router.put("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), validateSchema(updateClientSchema), asyncHandler(controller.updateClient));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(controller.deleteClient));

export default router;