import express from "express";
import { getHomeData } from "../controllers/home.controller.js";
import  protectRoute  from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, getHomeData);

export default router;