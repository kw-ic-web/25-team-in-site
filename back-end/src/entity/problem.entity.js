import mongoose from "mongoose";
import { v7 as uuidv7 } from "uuid";

const problemSchema = new mongoose.Schema(
  {
    problem_id: {
      type: String,
      default: () => uuidv7(),
      unique: true,
      required: true,
    },
    problem_source_id: { type: String, required: true },
    problem_title: { type: String, required: true },
    problem_difficulty: { type: Number, required: true, min: 1, max: 5 },
    problem_lang: { type: [String], required: true, default: ["Python"] },
    problem_main_category: { type: [String], default: [] },
    problem_sub_category: { type: [String], default: [] },
    problem_success_rate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Problem = mongoose.model("Problem", problemSchema);
