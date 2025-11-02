import express from "express";
import { Calling } from "../controllers/call.controller.js";
import protectRoute  from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/start', protectRoute, Calling);

export default router;
