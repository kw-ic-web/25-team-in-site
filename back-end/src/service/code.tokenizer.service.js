import { get_encoding, get_encoding_name_for_model } from "tiktoken";
import {
  DEFAULT_MODEL,
  MAX_TOKEN_LENGTH,
} from "../constants/tokenizer.constants.js";
import { ERROR } from "../mapper/error.mapper.js";
import { CodeTokenizeResponseDto } from "../dto/code/tokenize.response.dto.js";

const encoderCache = new Map();
let cleanupRegistered = false;

const registerCleanup = () => {
  if (cleanupRegistered) {
    return;
  }
  cleanupRegistered = true;

  const cleanup = () => {
    for (const encoder of encoderCache.values()) {
      try {
        encoder.free();
      } catch {
        // ignore cleanup failures
      }
    }
    encoderCache.clear();
  };

  process.once("exit", cleanup);
  process.once("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
};

const getEncoder = (encoding) => {
  if (!encoderCache.has(encoding)) {
    registerCleanup();
    encoderCache.set(encoding, get_encoding(encoding));
  }
  return encoderCache.get(encoding);
};

const resolveEncoding = () => {
  try {
    const inferred = get_encoding_name_for_model(DEFAULT_MODEL);
    if (inferred) {
      return inferred;
    }
  } catch {
    // fall back to default
  }

  // fallback 사용 시 에러 발생
  throw ERROR.UNSUPPORTED_ENCODING();
};

export const TokenizerService = {
  async tokenize({ code }) {
    // DTO에서 이미 검증된 값이므로 중복 검증 제거

    const encoding = resolveEncoding();

    let tokenizer;
    try {
      tokenizer = getEncoder(encoding);
    } catch {
      throw ERROR.UNSUPPORTED_ENCODING();
    }

    const tokens = tokenizer.encode(code);
    const tokenCount = tokens.length;

    if (tokenCount > MAX_TOKEN_LENGTH) {
      throw ERROR.TOKEN_LIMIT_EXCEEDED();
    }

    const result = {
      token_count: tokenCount,
    };

    return CodeTokenizeResponseDto.parse(result);
  },
};
