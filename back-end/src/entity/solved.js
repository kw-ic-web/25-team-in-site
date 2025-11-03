import mongoose from "mongoose";
import { v7 as uuidv7 } from "uuid";

const solvedSchema = new mongoose.Schema(
  {
    solved_id: { type: String, default: () => uuidv7(), unique: true },
    user_id: { type: String, ref: "User", required: true },
    problem_id: { type: String, ref: "Problem", required: true },
    solved_feedback: { type: String },
    solved_runtime: { type: Number },
    solved_memory_usage: { type: Number },
    solved_code: { type: String },
  },
  { timestamps: true },
);

export default mongoose.model("solved", solvedSchema);
