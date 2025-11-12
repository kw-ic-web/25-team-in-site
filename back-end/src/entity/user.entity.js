import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    user_id: { type: String, required: true, unique: true },
    user_pw: { type: String, required: true },
    user_email: {
      type: String,
      required: true,
      unique: true,
    },
    user_xp: { type: Number, default: 0 },
    user_level: { type: Number, default: 1 },
    prefer_language: { type: String },
    purpose: { type: String },
    metalevel: { type: Number }, //서버 내부 레벨 <- 초기값은 유저 선택 레벨
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  // 비밀번호가 변경되지 않았다면 skip
  if (!this.isModified("user_pw")) return next();

  try {
    const salt = await bcrypt.genSalt(10); // saltRounds=10 → 충분히 안전함
    this.user_pw = await bcrypt.hash(this.user_pw, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.user_pw);
};

export const User = mongoose.model("User", userSchema);
