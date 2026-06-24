import { Router } from "express";
import {
    listUsers,
    getUser,
    createUser,
    updateUser,
    activateUser,
    deactivateUser,
    blockUser,
    resetUserPassword,
    getUserLogs,
    getSecurityLogs,
    updateProfile,
    getProfile,
} from "./user.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";
import { roleMiddleware } from "../../../middleware/role.middleware.js";
import { validateSchema } from "../../../middleware/validate.middleware.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { createUserSchema, updateUserSchema, updateProfileSchema } from "../../../schemas/user.schemas.js";
const router = Router();

// ─── Rotas de perfil do próprio usuário (exigem autenticação) ────────────────
router.put("/profile", authMiddleware, validateSchema(updateProfileSchema), asyncHandler(updateProfile));
router.get("/profile", authMiddleware, asyncHandler(getProfile));

// ─── Rotas de admin (exigem autenticação + role ADMIN) ──────────────────────
router.use(authMiddleware);
router.use(roleMiddleware(["ADMIN"]));

router.get("/", asyncHandler(listUsers));
router.get("/logs", asyncHandler(getSecurityLogs));
router.get("/:id", asyncHandler(getUser));
router.get("/:id/logs", asyncHandler(getUserLogs));
router.post("/", validateSchema(createUserSchema), asyncHandler(createUser));
router.put("/:id", validateSchema(updateUserSchema), asyncHandler(updateUser));
router.patch("/:id/activate", asyncHandler(activateUser));
router.patch("/:id/deactivate", asyncHandler(deactivateUser));
router.patch("/:id/block", asyncHandler(blockUser));
router.patch("/:id/reset-password", asyncHandler(resetUserPassword));

export default router;