import express from "express";
import { createGroup, sendMessage,removeMember, updateGroup, getMessages, leaveGroup, getMyGroups, getGroupById } from "../controllers/group.controller.js";
import upload from "../middleware/upload.middleware.js";
import  protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/groups", protectRoute, upload.single("file"), createGroup);
router.patch("/groups/:groupId", protectRoute, upload.single("photo"), updateGroup);
router.get("/groups/:groupId/messages", protectRoute, getMessages);
router.post("/groups/:groupId/messages", protectRoute, upload.single("image"), sendMessage);
router.get("/groups/user/:userId", protectRoute, getMyGroups); 
router.post("/groups/:groupId/leave", protectRoute, leaveGroup);
router.get("/groups/groupbyid/:groupId", protectRoute, getGroupById);
router.patch("/groups/:groupId/remove-member", protectRoute, removeMember);
export default router;
