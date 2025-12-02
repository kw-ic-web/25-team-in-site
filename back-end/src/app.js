import express from "express";
import cookieParser from "cookie-parser";
import corsConfig from "./config/cors.config.js";
import routes from "./routes/index.route.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import serviceInjector from "./middlewares/serviceInjector.middleware.js";
import { authMiddleware } from "./middlewares/auth.middleware.js";

const app = express();

app.use(corsConfig);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public")); // 정적 파일 제공 (이미지 등)

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(authMiddleware);
app.use(serviceInjector);

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
