import { BadRequestError } from "../errors/badRequest.error.js";
import { ConflictError } from "../errors/conflict.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";

export const ERROR = {
  INVALID_REGISTER_REQUEST: () =>
    new BadRequestError("아이디, 비밀번호, 이메일을 입력하세요."),
  INVALID_EMAIL_FORMAT: () =>
    new BadRequestError("올바른 이메일 형식이 아닙니다."),
  INVALID_LANGUAGE: () => new BadRequestError("선호하는 프로그래밍 언어 오류"),
  INVALID_PURPOSE: () => new BadRequestError("가입 목적이 올바르지 않습니다."),
  INVALID_LEVEL_RANGE: () =>
    new BadRequestError("숙련도는 1~4 사이의 정수여야 합니다."),
  CONFLICT_ID: () => new ConflictError("이미 등록된 아이디입니다."),
  CONFLICT_EMAIL: () => new ConflictError("이미 등록된 이메일입니다."),
  CONFLICT_RACE: () => new ConflictError("아이디/이메일이 이미 존재합니다."),
  INVALID_LOGIN_REQUEST: () =>
    new BadRequestError("이메일/비밀번호를 입력하세요."),
  INVALID_LOGIN_INFO: () =>
    new UnauthorizedError("이메일 또는 비밀번호가 올바르지 않습니다."),
  INVALID_TOKEN: () => new UnauthorizedError("인증 정보가 올바르지 않습니다."),
};
