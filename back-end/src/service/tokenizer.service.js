import { get_encoding, get_encoding_name_for_model } from "tiktoken";
import {
  DEFAULT_ENCODING,
  DEFAULT_MODEL,
  MAX_CODE_CHAR_LENGTH,
  MAX_TOKEN_LENGTH,
  PREVIEW_MAX_CHARS,
  PREVIEW_MAX_LINES,
} from "../constants/tokenizer.constants.js";
import { ERROR } from "../mapper/error.mapper.js";

const normalizeNewLines = (value) => value.replace(/\r\n/g, "\n");

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

const buildPreview = (code) => {
  if (!code) {
    return "";
  }
  const normalized = normalizeNewLines(code);
  const previewLines = normalized.split("\n").slice(0, PREVIEW_MAX_LINES);
  let preview = previewLines.join("\n");
  if (preview.length > PREVIEW_MAX_CHARS) {
    preview = preview.slice(0, PREVIEW_MAX_CHARS);
  }
  return preview;
};

const resolveModelEncoding = ({ model, encoding }) => {
  if (encoding) {
    return {
      model: model || DEFAULT_MODEL,
      encoding,
      usedFallback: false,
    };
  }

  const normalizedModel = model || DEFAULT_MODEL;
  try {
    const inferred = get_encoding_name_for_model(normalizedModel);
    if (inferred) {
      return {
        model: normalizedModel,
        encoding: inferred,
        usedFallback: false,
      };
    }
  } catch {
    // swallow and fall back
  }

  return {
    model: normalizedModel,
    encoding: DEFAULT_ENCODING,
    usedFallback: true,
  };
};

export const TokenizerService = {
  async tokenize({ code, model, encoding, include_tokens = true }) {
    if (!code || code.length === 0) {
      throw ERROR.CODE_REQUIRED();
    }

    if (code.length > MAX_CODE_CHAR_LENGTH) {
      throw ERROR.CODE_TOO_LARGE();
    }

    const resolved = resolveModelEncoding({ model, encoding });

    let tokenizer;
    try {
      tokenizer = getEncoder(resolved.encoding);
    } catch {
      throw ERROR.UNSUPPORTED_ENCODING();
    }

    const tokens = tokenizer.encode(code);
    const tokenCount = tokens.length;

    if (tokenCount > MAX_TOKEN_LENGTH) {
      throw ERROR.TOKEN_LIMIT_EXCEEDED();
    }

    const tokensPayload = include_tokens ? Array.from(tokens) : undefined;

    return {
      model: resolved.model,
      encoding: resolved.encoding,
      used_fallback: resolved.usedFallback,
      token_count: tokenCount,
      ...(include_tokens && { tokens: tokensPayload }),
      preview: buildPreview(code),
    };
  },
};
