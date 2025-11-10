import express from "express";
import routes from "./routes/index.js";
import cookieParser from "cookie-parser";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import serviceInjector from "./middlewares/serviceInjector.js";
import { authMiddleware } from "./middlewares/auth.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(authMiddleware);
app.use(serviceInjector);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
