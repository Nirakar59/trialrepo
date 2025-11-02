import express from "express";
import upload from "../middleware/upload.middleware.js";
import { sendMessage,getMessages,fetchLatestMessage } from "../controllers/message.controller.js";
import  protectRoute  from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/send/:receiver', protectRoute, upload.single('image'), sendMessage);
router.get('/latest', protectRoute, fetchLatestMessage);
router.get('/:receiver', protectRoute, getMessages);

export default router;
