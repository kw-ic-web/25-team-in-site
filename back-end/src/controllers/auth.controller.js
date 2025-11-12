import { RegisterRequestDto } from "../dto/auth/register.request.dto.js";
import { LoginRequestDto } from "../dto/auth/login.request.dto.js";

export const AuthController = {
  async register(req, res, next) {
    try {
      const dto = RegisterRequestDto.parse(req.body);
      const responseDto = await req.services.auth.register(dto);
      res
        .cookie("token", responseDto.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        })
        .status(201)
        .json({
          user_id: responseDto.user_id,
          email: responseDto.email,
        });
    } catch (e) {
      next(e);
    }
  },

  async login(req, res, next) {
    try {
      const dto = LoginRequestDto.parse(req.body);
      const responseDto = await req.services.auth.login(dto);
      res
        .cookie("token", responseDto.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 30 * 24 * 60 * 60 * 1000,
        })
        .status(200)
        .json({
          user_id: responseDto.user_id,
          email: responseDto.email,
        });
    } catch (e) {
      next(e);
    }
  },
};
