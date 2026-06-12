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
} from "./user.controller";
import { authMiddleware } from "../../../middleware/auth.middleware";
import { roleMiddleware } from "../../../middleware/role.middleware";
import { validateSchema } from "../../../middleware/validate.middleware";
import { asyncHandler } from "../../../utils/asyncHandler";
import { createUserSchema, updateUserSchema } from "../../../schemas/user.schemas";
const router = Router();

// todas as rotas exigem auth + role ADMIN
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