import cors from "cors";
import config from "./env.config.js";

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.cors.origin;
    // origin이 없는 경우 (같은 origin 요청 또는 Postman 등) 허용
    if (
      !origin ||
      allowedOrigins.length === 0 ||
      allowedOrigins.includes(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("CORS 정책에 의해 차단되었습니다."));
    }
  },
  credentials: true, // 쿠키 및 인증 정보 허용
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: [],
  maxAge: 86400, // preflight 요청 캐시 시간 (24시간)
};

export default cors(corsOptions);
