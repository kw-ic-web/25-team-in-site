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

friendSchema.pre("save", function (next) {
  if (this.user_id.equals(this.friend_id)) {
    next(new Error("User cannot friend themselves"));
  } else {
    next();
  }
});

export const Friend = mongoose.model("Friend", friendSchema);
