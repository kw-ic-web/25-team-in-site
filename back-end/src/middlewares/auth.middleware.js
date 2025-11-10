import jwt from "jsonwebtoken";
import config from "../config/env.config.js";
import { ERROR } from "../../mapper/error.mapper.js";

const _publicPaths = ["/api/v1/auth/login", "/api/v1/auth/register"];
const _normalize = (s = "") => s.replace(/\/+$/, "");

export const authMiddleware = (req, res, next) => {
  const path = _normalize(req.originalUrl || req.url);
  if (_publicPaths.some((p) => path.startsWith(p))) {
    return next();
  }

  const token = req.cookies?.token;
  if (!token) return next(ERROR.INVALID_TOKEN());

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (err) {
    next(ERROR.INVALID_TOKEN());
  }
};
