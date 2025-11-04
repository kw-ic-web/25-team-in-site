import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { ConflictError } from "../errors/conflict.js";
import { UserRepository } from "../repository/userRepository.js";
import { BadRequestError } from "../errors/badRequest.js";
import { UnauthorizedError } from "../errors/unauthorized.js";

export const AuthService = {
  async register(id, password, email) {
    const normEmail = email.trim().toLowerCase();
    const [byId, byEmail] = await Promise.all([
      UserRepository.findOne({ user_id: id }),
      UserRepository.findOne({ user_email: normEmail }),
    ]);
    if (byId) throw new ConflictError("이미 등록된 아이디입니다.");
    if (byEmail) throw new ConflictError("이미 등록된 이메일입니다.");

    try {
      const user = await UserRepository.create({
        user_id: id,
        user_email: normEmail,
        user_pw: password,
      });
      return user;
    } catch (err) {
      if (err?.code === 11000)
        throw new ConflictError("아이디/이메일이 이미 존재합니다.");
      throw err;
    }
  },
  async login(email, password) {
    if (!email || !password)
      throw new BadRequestError("이메일/비밀번호를 입력하세요.");
    const normEmail = email.trim().toLowerCase();
    const user = await UserRepository.findOne({ user_email: normEmail });
    if (!user)
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    const ok = await user.comparePassword(password);
    if (!ok)
      throw new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다.");
    return jwt.sign({ user_id: user.user_id }, config.jwtSecret, {
      noTimestamp: true,
    });
  },

  async isIdAvailable(id) {
    const exist = await UserRepository.findOne({ user_id: id });
    if (exist) return false;
    return true;
  },

  async isEmailAvailable(email) {
    const normEmail = email.trim().toLowerCase();
    const exist = await UserRepository.findOne({ user_email: normEmail });
    if (exist) return false;
    return true;
  },
};
