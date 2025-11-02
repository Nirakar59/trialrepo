import express from "express";
import { search } from "../controllers/search.controller.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// GET /api/search
router.get("/search", protectRoute, search);

export default router;
