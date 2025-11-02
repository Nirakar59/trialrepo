
import Notifi from "../models/notification.model.js";
import { emitToUser } from "../sockets/socket.io.js";
// Generic function to create and emit notification
export const createNotification = async ({
    to,
    from,
    type,
    message,    
    relatedPost = null,
    link = 'http://localhost:5173'
}) => {
    try {
        // console.log("Creating notification:", { to, from, type, message, relatedPost });
        const notifi = await Notifi.create({
            to,
            from,
            type,
            message,
            relatedPost,
            link
        });
        // Emit notification in real-time
        emitToUser(to, "receive-notification", notifi);

        return notifi;
    } catch (error) {
        console.error("Notification creation error:", error.message);
    }
};

// Fetch notifications for a user
export const getNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await Notifi.find({ to: userId })
            .sort({ createdAt: -1 })
            .populate("from", "name avatar")
            .populate("relatedPost", "title content");

        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await Notifi.findByIdAndUpdate(notificationId, { read: true });
        res.status(200).json({ success: true, message: "Notification marked as read" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
