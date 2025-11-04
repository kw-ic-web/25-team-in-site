import { ConflictError } from "../errors/conflict.js";
import { UserRepository } from "../repository/userRepository.js";

export const AuthService = {
  async register(id, pw, email) {
    const [byId, byEmail] = await Promise.all([
      UserRepo.findOne({ id }),
      UserRepo.findOne({ email }),
    ]);
    if (byId) throw new ConflictError("이미 등록된 아이디입니다.");
    if (byEmail) throw new ConflictError("이미 등록된 이메일입니다.");

    try {
      const user = await UserRepo.create({
        username,
        email,
        password,
      });
      return user;
    } catch (err) {
      if (err?.code === 11000)
        throw new ConflictError("아이디/이메일이 이미 존재합니다.");
      throw err;
    }
    //TODO: JWT 발급 및 리디렉션
  },

  async isIdAvailable(id) {
    const exist = await UserRepository.findOne({ user_id: id });
    if (exist) return false;
    return true;
  },

  async isEmailAvailable(email) {
    const exist = await UserRepository.findOne({ user_email: email });
    if (exist) return false;
    return true;
  },
};
