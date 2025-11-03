import mongoose from "mongoose";
import { v7 as uuidv7 } from "uuid";

const problemSchema = new mongoose.Schema(
  {
    problem_id: { type: String, default: () => uuidv7(), unique: true },
    problem_difficulty: { type: Number, required: true },
    problem_lang: { type: String, required: true },
    problem_main_category: { type: String },
    problem_sub_category: { type: String },
    problem_success_rate: { type: Number },
    problem_body: { type: String },
    problem_attachment_urls: { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("problem", problemSchema);
