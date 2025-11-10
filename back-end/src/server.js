import http from "http";
import app from "./app.js";
import config from "./config/env.config.js";
import connectDB from "./config/db.config.js";

const port = config.port;
app.set("port", port);

(async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
  const server = http.createServer(app);

  server.on("error", (error) => {
    if (error.syscall !== "listen") {
      throw error;
    }

    const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;

    switch (error.code) {
      case "EACCES":
        error.message = `${bind} requires elevated privileges`;
        throw error;
      case "EADDRINUSE":
        error.message = `${bind} is already in use`;
        throw error;
      default:
        throw error;
    }
  });

  server.listen(port);
})();
