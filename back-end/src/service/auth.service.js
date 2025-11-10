import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import { ERROR } from "../../mapper/error.mapper.js";
import { UserRepository } from "../repository/user.repository.js";
import { AuthResponseDto } from "../dto/auth/auth.response.dto.js";

export const AuthService = {
  async register(dto) {
    const { user_id, email, password, language, level, purpose } = dto;

    const [byId, byEmail] = await Promise.all([
      UserRepository.findOne({ user_id: user_id }),
      UserRepository.findOne({ user_email: email }),
    ]);
    if (byId) throw ERROR.CONFLICT_ID();
    if (byEmail) throw ERROR.CONFLICT_EMAIL();

    try {
      await UserRepository.create({
        user_id,
        user_email: email,
        user_pw: password,
        prefer_language: language,
        purpose,
        metalevel: level,
      });

      const token = await this._generateToken(user_id);
      return AuthResponseDto.parse({
        user_id,
        email,
        token,
      });
    } catch (err) {
      if (err?.code === 11000) throw ERROR.CONFLICT_RACE();
      throw err;
    }
  },

  async login(dto) {
    const { email, password } = dto;
    const user = await UserRepository.findOne(
      { user_email: email },
      { includePassword: true },
    );
    if (!user) throw ERROR.INVALID_LOGIN_INFO();
    const ok = await user.comparePassword(password);
    if (!ok) throw ERROR.INVALID_LOGIN_INFO();
    const token = await this._generateToken(user.user_id);
    return AuthResponseDto.parse({
      user_id: user.user_id,
      email,
      token,
    });
  },

  async _generateToken(user_id) {
    return jwt.sign({ user_id }, config.jwtSecret, {
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
