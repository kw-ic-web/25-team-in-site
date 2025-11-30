import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import config from "../config/env.config.js";

const parseCookies = (req) => {
  const cookies = {};
  const cookieHeader = req.headers.cookie;

  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const trimmed = cookie.trim();
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex > 0) {
        const name = trimmed.substring(0, eqIndex);
        const value = trimmed.substring(eqIndex + 1);
        cookies[name] = decodeURIComponent(value);
      }
    });
  }

  return cookies;
};

const verifyToken = (req) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies.token;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    return {
      userId: decoded.user_id,
    };
  } catch (error) {
    return null;
  }
};

export const initializeWebSocket = (httpServer) => {
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/",
    verifyClient: (info, callback) => {
      const userInfo = verifyToken(info.req);
      if (!userInfo) {
        callback(false, 401, "Unauthorized: Invalid or missing token");
        return;
      }
      // 인증 성공 시 사용자 정보를 req에 저장
      info.req.userId = userInfo.userId;
      callback(true);
    },
  });

  return wss;
};
