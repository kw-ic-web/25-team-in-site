import express from "express";
import routes from "./routes/index.js";
import notFound from "./middlewares/notFound.js";
import errorHandler from "./middlewares/errorHandler.js";
import problemRouter from "./routes/problem.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", routes);

app.use("/api/problem", problemRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
