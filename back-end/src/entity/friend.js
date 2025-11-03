import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    friend_id: { type: String, required: true },
    user_id: { type: String, required: true, ref: "User" },
    state: {
      type: String,
      enum: ["pending", "accepted", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true },
);

export default mongoose.model("friend", friendSchema);
