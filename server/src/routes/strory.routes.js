import express from "express";
import {createStory,getStory,deleteStory} from "../controllers/story.controller.js"
import upload from "../middleware/upload.middleware.js"
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protectRoute, upload.single("storyImage"), createStory);

router.get("/", protectRoute, getStory);

router.delete("/:storyId", protectRoute, deleteStory);

export default router;