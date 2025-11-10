import mongoose from "mongoose";
import { v7 as uuidv7 } from "uuid";

const solvedSchema = new mongoose.Schema(
  {
    solved_id: { type: String, default: () => uuidv7(), unique: true },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
    },
    solved_feedback: { type: String },
    solved_runtime: { type: Number },
    solved_memory_usage: { type: Number },
    solved_code: { type: String },
  },
  { timestamps: true },
);

solvedSchema.index({ user_id: 1, problem_id: 1 });

export const Solved = mongoose.model("solved", solvedSchema);
