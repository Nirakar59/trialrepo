import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Either a single receiver OR a group
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null,
    },

    message_type: {
      type: String,
      enum: ["text", "image", "video", "file"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
    },
    media_url: {
      type: String,
      default: "",
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Add an index for fast querying by group or receiver
messageSchema.index({ group: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
