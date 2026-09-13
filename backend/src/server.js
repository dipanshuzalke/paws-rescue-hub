import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { createApp } from "./app.js";
import { createServer } from "node:http";
import { createSocketServer } from "./sockets/socketServer.js";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();

  const httpServer = createServer(app);

  const io = createSocketServer(httpServer);

  httpServer.listen(env.port, () => {
    console.log(
      `[server] ResQ Paws API listening on http://localhost:${env.port} (${env.nodeEnv})`,
    );

    console.log(`[server] CORS origin: ${env.clientUrl}`);
    console.log(`[socket] Socket.IO server initialized`);
  });

  const shutdown = async (signal) => {
    console.log(
      `\n[server] ${signal} received — shutting down gracefully`,
    );

    httpServer.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  process.on("unhandledRejection", (reason) => {
    console.error("[server] Unhandled rejection:", reason);
  });
}

bootstrap().catch((error) => {
  console.error("[server] Failed to start:", error);
  process.exit(1);
});