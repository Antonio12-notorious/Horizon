import { Router } from "express";
import {
    login,
    refresh,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    getMe,
} from "./auth.controller.js";
import { validateSchema } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
    loginSchema,
    changePasswordSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../../schemas/auth.schemas.js";

const router = Router();

// públicas
router.post("/login", validateSchema(loginSchema), asyncHandler(login));
router.post("/refresh", asyncHandler(refresh));
router.post("/forgot-password", validateSchema(forgotPasswordSchema), asyncHandler(forgotPassword));
router.post("/reset-password", validateSchema(resetPasswordSchema), asyncHandler(resetPassword));

// autenticadas
router.post("/logout", authMiddleware, asyncHandler(logout));
router.post("/change-password", authMiddleware, validateSchema(changePasswordSchema), asyncHandler(changePassword));
router.get("/me", authMiddleware, asyncHandler(getMe));

export default router;