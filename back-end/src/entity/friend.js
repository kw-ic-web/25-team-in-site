import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    friend_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    state: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true },
);
friendSchema.index({ user_id: 1, friend_id: 1 }, { unique: true });

export default mongoose.model("friend", friendSchema);
