import Call from "../models/call.model.js";
import { emitToUser } from "../sockets/socket.io.js";

// Start a new call
export const Calling = async (req, res) => {
    try {
        const { caller, receiver, type } = req.body;
        if (!caller || !receiver || !type) {
            return res.status(400).json({ message: "caller, receiver, and type are required" });
        }

        const call = await Call.create({ caller, receiver, type });

        // Notify the receiver in real time
        emitToUser(receiver, "incoming-call", { call });

        return res.status(201).json({ success: true, call });
    } catch (error) {
        console.error("Error starting call:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// Accept call
export const acceptCall = async (req, res) => {
    try {
        const { id } = req.params;
        const call = await Call.findByIdAndUpdate(
            id,
            { status: "accepted", startedAt: new Date() },
            { new: true }
        );
        if (!call) return res.status(404).json({ message: "Call not found" });

        // Notify the caller
        emitToUser(call.caller, "call-accepted", { call });

        return res.json({ success: true, call });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Reject call
export const rejectCall = async (req, res) => {
    try {
        const { id } = req.params;
        const call = await Call.findByIdAndUpdate(
            id,
            { status: "rejected", endedAt: new Date() },
            { new: true }
        );
        if (!call) return res.status(404).json({ message: "Call not found" });

        // Notify the caller
        emitToUser(call.caller, "call-rejected", { call });

        return res.json({ success: true, call });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// End call
export const endCall = async (req, res) => {
    try {
        const { id } = req.params;
        const call = await Call.findByIdAndUpdate(
            id,
            { status: "ended", endedAt: new Date() },
            { new: true }
        );
        if (!call) return res.status(404).json({ message: "Call not found" });

        // Notify both caller and receiver
        emitToUser(call.caller, "call-ended", { call });
        emitToUser(call.receiver, "call-ended", { call });

        return res.json({ success: true, call });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
