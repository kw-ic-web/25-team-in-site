import mongoose from "mongoose";

const problemDetailSchema = new mongoose.Schema(
  {
    problem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Problem",
      unique: true,
      required: true,
    },
    problem_body: { type: String, default: "" }, // 한국어 HTML
    problem_attachment_urls: { type: [String], default: [] },
    problem_test_cases: { type: [String], default: [] },
    problem_evaluate_cases: { type: [String], default: [] },
    problem_time_limit: { type: Number, default: 0 }, // 밀리초 단위 (ms)
    problem_memory_limit: { type: Number, default: 0 }, // 바이트 단위 (bytes)
  },
  { timestamps: true }
);

export const ProblemDetail = mongoose.model(
  "ProblemDetail",
  problemDetailSchema
);
