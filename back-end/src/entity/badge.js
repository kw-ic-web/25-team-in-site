import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    badge_id: { type: String, required: true, unique: true },
    badge_name: { type: String, required: true },
    badge_description: { type: String },
    badge_order: { type: Number },
    badge_icon_url: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("badge", badgeSchema);
