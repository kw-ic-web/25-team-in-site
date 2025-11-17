import { z } from "zod";

// === HELPER ===
const toStringArray = (value) => {
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

const toNumberArray = (value) => {
  return toStringArray(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));
};

const optionalQueryString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().optional());

// === DTO ===

export const ProbListRequestDto = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  difficulties: z
    .preprocess(
      (value) => toNumberArray(value),
      z.array(z.number().int().min(1).max(5)),
    )
    .default([]),
  languages: z
    .preprocess((value) => toStringArray(value), z.array(z.string().min(1)))
    .default([]),
  main_category: optionalQueryString,
  sub_category: optionalQueryString,
});
