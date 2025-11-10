import { ERROR } from "../../mapper/errorMapper.js";
import { ZodError } from "zod";

export default (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let name = err.name || "Error";
  let message = err.message || "Internal Server Error";

  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const code = issue.message;
    const errorInfo = ERROR[code];

    if (errorInfo) {
      status = errorInfo.status;
      name = errorInfo.name;
      message = errorInfo.message;
    }
  }
  const responseBody = {
    name,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  };
  return res.status(status).json(responseBody);
};
