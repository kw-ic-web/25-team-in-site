import express from "express";
import cookieParser from "cookie-parser";
import routes from "./routes/index.route.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import serviceInjector from "./middlewares/serviceInjector.middleware.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// TODO: Auth기능 테스트 가능한 엔드포인트 생겼을 시, Health 엔드포인트 여기로 옮기기. 현재는 health/로 auth 기능 작동 테스트
app.use(authMiddleware);
app.use(serviceInjector);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
