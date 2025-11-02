import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: 500, 
    },
    media_url: {
      type: String,
      default: "", 
    },
    media_type: {
      type: String,
      enum: ["text", "image", "video"], 
      required: true,
    },
    background_color: {
      type: String,
      default: "#4f46e5", 
    },
    expiresAt: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
      index: { expires: "0s" },
    },
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model("Story", storySchema);

export default Story;