import mongoose from "mongoose";

const problemDetailSchema = new mongoose.Schema(
  {
    problem_id: {
      type: String,
      ref: "Problem",
      unique: true,
      required: true,
    },
    problem_body: { type: String },
    problem_attachment_urls: { type: [String], default: [] },
    problem_test_cases: { type: [String], default: [] },
    problem_evaluate_cases: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const ProblemDetail = mongoose.model(
  "ProblemDetail",
  problemDetailSchema,
);
