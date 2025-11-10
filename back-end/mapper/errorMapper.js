import { BadRequestError } from "../src/errors/badRequest.js";
import { ConflictError } from "../src/errors/conflict.js";
import { UnauthorizedError } from "../src/errors/unauthorized.js";

export const ERROR = {
  INVALID_REGISTER_REQUEST: new BadRequestError(
    "아이디, 비밀번호, 이메일을 입력하세요.",
  ),
  INVALID_EMAIL_FORMAT: new BadRequestError("올바른 이메일 형식이 아닙니다."),
  CONFLICT_ID: new ConflictError("이미 등록된 아이디입니다."),
  CONFLICT_EMAIL: new ConflictError("이미 등록된 이메일입니다."),
  CONFLICT_RACE: new ConflictError("아이디/이메일이 이미 존재합니다."),
  INVALID_LOGIN_REQUEST: new BadRequestError("이메일/비밀번호를 입력하세요."),
  INVALID_LOGIN_INFO: new UnauthorizedError(
    "이메일 또는 비밀번호가 올바르지 않습니다.",
  ),
};
