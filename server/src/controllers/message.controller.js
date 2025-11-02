import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { emitToUser } from "../sockets/socket.io.js";
import { createNotification } from "./notification.controller.js";

export const sendMessage = async (req, res) => {
    const { receiver } = req.params;
    const { sender, text, message_type } = req.body;
    const image = req.file;
    let imageUrl = '';

    try {
        // Validate sender and receiver
        if (!sender || !receiver) {
            return res.status(400).json({ message: "Sender and receiver are required." });
        }

        // Validate that at least text or image is provided
        if (!text && !image) {
            return res.status(400).json({ message: "Text or image message is required." });
        }

        // Upload image if present
        if (image) {
            const mime = image.mimetype;
            const base64Image = `data:${mime};base64,${image.buffer.toString("base64")}`;
            const result = await cloudinary.uploader.upload(base64Image, {
                resource_type: "image",
                folder: "messages",
            });
            imageUrl = result.secure_url;   
        }

        // Save message in DB
        const message = await Message.create({
            sender,
            receiver,
            text,
            media_url: imageUrl,
            message_type
        });
   console.log("ready to emit");
        // Emit message to receiver in real-time
        emitToUser(receiver, "receive-message", {
            _id: message._id,
            sender,
            receiver,
            text,
            message_type,
            media_url: imageUrl,
            imageUrl,
            createdAt: message.createdAt,
        });

        // Create a notification for receiver
        await createNotification({
            to: receiver,
            from: sender,
            type: "message",
            message: `${req.user.fullname} sent you a message`,
            link: `/messages/${sender}`,
        });

        // Respond with message data
        return res.status(200).json({
            message: "Message sent successfully",
            data: {
                _id: message._id,
                sender: message.sender,
                receiver: message.receiver,
                text: message.text,
                message_type: message.message_type,
                media_url: message.media_url,
                createdAt: message.createdAt,
            }
        });

    } catch (error) {
        console.error("Message error:", error);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const getMessages = async (req, res) => {
    const sender = req.user._id;
    const { receiver } = req.params;

    try {
        const messages = await Message.find({ $or: [{ sender: sender, receiver: receiver }, { sender: receiver, receiver: sender }] }).sort({ createdAt: -1 });
        return res.status(200).json({ messages });
    } catch (error) {
        console.error("Message error:", error);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const fetchLatestMessage = async (req, res) => {
    const userId = req.user?._id;

    try {
        const messages = await Message.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate('sender', 'fullname profilePics')
        .populate('receiver', 'fullname profilePics');

        return res.status(200).json({ messages });
    } catch (error) {
        console.error("Message error:", error);
        return res.status(500).json({ message: "Internal Server Error!" });
    }
};