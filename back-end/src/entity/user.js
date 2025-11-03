import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    user_pw: { type: String, required: true },
    user_email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "유효한 이메일 주소를 입력해주세요"],
    },
    user_xp: { type: Number, default: 0 },
    user_level: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export default mongoose.model("user", userSchema);
