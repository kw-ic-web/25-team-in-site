import express from "express";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import serviceInjector from "./middlewares/serviceInjector.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(serviceInjector);
//TODO: Zod 에러 핸들링 미들웨어 추가. ENUM 사용하여 커스텀 에러 반환

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
