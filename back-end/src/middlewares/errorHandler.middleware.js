import { ERROR } from "../mapper/error.mapper.js";
import { ZodError } from "zod";

export default (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let name = err.name || "Error";
  let message = err.message || "Internal Server Error";

  if (err instanceof ZodError) {
    const issue = err.issues[0]; //TODO: 여러개의 validation 에러 볼 수 있도록(UX)
    const code = issue.message;

    if (ERROR[code] && typeof ERROR[code] === "function") {
      const errorInfo = ERROR[code]();
      if (errorInfo) {
        status = errorInfo.status;
        name = errorInfo.name;
        message = errorInfo.message;
      }
    } else {
      // ERROR 매퍼에 없는 경우 기본 validation 에러로 처리
      status = 400;
      name = "ValidationError";
      message = `Validation failed: ${issue.path.join(".")} - ${issue.message}`;
    }
  }
  const responseBody = {
    name,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };
  return res.status(status).json(responseBody);
};
