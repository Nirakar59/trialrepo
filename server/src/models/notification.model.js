import mongoose from "mongoose";

const notifiSchema = new mongoose.Schema(
    {
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String, // 'message', 'like', 'comment', 'follow'
            enum: ["follow", "like", "comment","message","connect"], // we can reuse later
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        link: {
            type: String,
            default: 'http://localhost:5173'
        },
        read: {
            type: Boolean,
            default: false,
        },
        relatedPost: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
        },
    },
    { timestamps: true }
);

const Notifi = mongoose.model("Notifi", notifiSchema);
export default Notifi;
