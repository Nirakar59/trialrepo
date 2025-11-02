


import express from "express";


import { getNotifications, markAsRead } from "../controllers/notification.controller.js";



const router = express.Router();




// Mark notification as read
router.put("/read/:notificationId", markAsRead);


// Get notifications for a user
router.get("/:userId", getNotifications);

export default router;
