import { Router } from "express";
import * as invoiceController from "./invoices.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../middleware/role.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(invoiceController.getInvoices));

router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(invoiceController.getInvoice));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(invoiceController.createInvoice));

router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), asyncHandler(invoiceController.updateInvoice));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(invoiceController.deleteInvoice));

export default router;