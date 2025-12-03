import http from "http";
import app from "./app.js";
import config from "./config/env.config.js";
import connectDB from "./infrastructure/mongoConnection.infra.js";
import { initializeWebSocket } from "./infrastructure/socket.js";
import { setupSocketHandlers } from "./sockets/index.js";

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

  try {
    const wss = initializeWebSocket(server);
    setupSocketHandlers(wss);
  } catch (error) {
    console.error("Failed to initialize WebSocket:", error);
    process.exit(1);
  }

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

  server.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
    // Docker purge 스케줄러를 서버 시작 후에 동적으로 초기화
    try {
      const { scheduleDailyDockerPurge } = await import(
        "./service/evaluation.service.js"
      );
      scheduleDailyDockerPurge();
    } catch (error) {
      console.error("Failed to schedule Docker purge:", error);
    }
  });
})();
