import http from "http";
import app from "./app";
import { env } from "./config/env";
import { testConnection } from "./config/database";
import { initSocket, getIO } from "./config/socket";

async function startServer(): Promise<void> {
  try {
    const dbConnected = await testConnection();

    if (!dbConnected) {
      console.error("Failed to connect to database. Exiting...");
      process.exit(1);
    }

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(env.PORT, () => {
      console.log(`
🚀 Italian Restaurant API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Environment: ${env.NODE_ENV}
🔌 Port:       ${env.PORT}
🗄️  Database:   ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}
🔌 WebSocket:  enabled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`\n${signal} received. Starting graceful shutdown...`);

      const io = getIO();
      io.emit("server:shutdown", { message: "Server is shutting down" });

      setTimeout(() => {
        io.close(() => {
          console.log("WebSocket server closed");
        });

        httpServer.close(() => {
          console.log("HTTP server closed");
          process.exit(0);
        });
      }, 1000);

      setTimeout(() => {
        console.error("Forced shutdown after timeout");
        process.exit(1);
      }, 5000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

startServer();
