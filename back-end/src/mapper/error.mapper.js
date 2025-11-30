import { BadRequestError } from "../errors/badRequest.error.js";
import { ConflictError } from "../errors/conflict.error.js";
import { InternalServerError } from "../errors/internalServerError.error.js";
import { UnauthorizedError } from "../errors/unauthorized.error.js";
import { PayloadTooLargeError } from "../errors/payloadTooLarge.error.js";

export const ERROR = {
  INVALID_ID_FORMAT: () =>
    new BadRequestError("아이디 형식이 올바르지 않습니다."),
  INVALID_PASSWORD_FORMAT: () =>
    new BadRequestError("비밀번호 형식이 올바르지 않습니다."),
  INVALID_EMAIL_FORMAT: () =>
    new BadRequestError("올바른 이메일 형식이 아닙니다."),
  INVALID_LANGUAGE: () =>
    new BadRequestError("선호하는 프로그래밍 언어가 올바르지 않습니다."),
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
  USER_NOT_FOUND: () =>
    new UnauthorizedError("사용자 정보를 찾을 수 없습니다."),
  INVALID_PROB_ID: () => new BadRequestError("문제 ID가 올바르지 않습니다."),
  FAIL_TO_GET_PROB_DETAIL: () =>
    new InternalServerError("문제 세부사항을 찾을 수 없습니다."),
  INVALID_CODE_TYPE: () =>
    new BadRequestError("코드는 문자열 타입이어야 합니다."),
  CODE_REQUIRED: () => new BadRequestError("토큰화할 코드를 입력해주세요."),
  CODE_TOO_LARGE: () =>
    new PayloadTooLargeError("허용된 코드 길이를 초과했습니다."),
  UNSUPPORTED_ENCODING: () =>
    new BadRequestError("지원하지 않는 인코딩입니다."),
  TOKEN_LIMIT_EXCEEDED: () =>
    new BadRequestError("허용된 토큰 수를 초과했습니다."),
  INVALID_MESSAGE_FORMAT: (message) =>
    new BadRequestError(`[WebSocket] 잘못된 메세지 형식입니다: ${message}`),
  FAILED_TO_SEND_MESSAGE: (message) =>
    new BadRequestError(`[WebSocket] 메세지 전송에 실패했습니다: ${message}`),
};
