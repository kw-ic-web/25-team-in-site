import { z } from "zod";

// === HELPER ===
const _toStringArray = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item : String(item)))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const _toNumberArray = (value) => {
  return _toStringArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));
};

const _toBoolean = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  return undefined;
};

const _normalizeEnumValue = (value, allowed, fallback) => {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
};

const optionalQueryString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().optional());

// === DTO ===

const SORT_BY_VALUES = ["created_at", "difficulty", "success_rate"];
const SORT_ORDER_VALUES = ["asc", "desc"];

export const ProbListRequestDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: optionalQueryString,
  difficulties: z
    .preprocess(
      (value) => _toNumberArray(value),
      z.array(z.number().int().min(1).max(5)),
    )
    .default([]),
  languages: z
    .preprocess((value) => _toStringArray(value), z.array(z.string().min(1)))
    .default([]),
  main_category: optionalQueryString,
  sub_category: optionalQueryString,
  sort_by: z
    .preprocess(
      (value) => _normalizeEnumValue(value, SORT_BY_VALUES, "created_at"),
      z.enum(SORT_BY_VALUES),
    )
    .default("created_at"),
  sort_order: z
    .preprocess(
      (value) => _normalizeEnumValue(value, SORT_ORDER_VALUES, "desc"),
      z.enum(SORT_ORDER_VALUES),
    )
    .default("desc"),
  exclude_solved: z
    .preprocess((value) => {
      const normalized = _toBoolean(value);
      return typeof normalized === "boolean" ? normalized : undefined;
    }, z.boolean())
    .default(false),
});
