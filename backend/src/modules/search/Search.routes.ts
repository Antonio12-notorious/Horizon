import { Router } from "express";
import { searchHandler } from "./Search.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

// GET /api/search?q=texto&limit=10&types=client,invoice,...
router.get("/", authMiddleware, searchHandler);

export default router;