import { Router } from "express";
import * as invoiceController from "./invoices.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { roleMiddleware } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(invoiceController.getInvoices));

router.get("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(invoiceController.getInvoice));

router.post("/", authMiddleware, roleMiddleware(["ADMIN", "GERENTE", "OPERADOR"]), asyncHandler(invoiceController.createInvoice));

router.patch("/:id", authMiddleware, roleMiddleware(["ADMIN", "GERENTE"]), asyncHandler(invoiceController.updateInvoice));

router.delete("/:id", authMiddleware, roleMiddleware(["ADMIN"]), asyncHandler(invoiceController.deleteInvoice));

export default router;