import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import app from "./app.js";
import { logger } from "./lib/logger.js";
import { registerSocketHandlers } from "./game/rooms.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = createServer(app);

const corsOrigin = process.env["CORS_ORIGIN"]
  ?? (process.env["NODE_ENV"] === "production"
    ? process.env["REPL_SLUG"]
      ? `https://${process.env["REPL_SLUG"]}.${process.env["REPL_OWNER"]}.replit.app`
      : false
    : true);

const io = new SocketIOServer(httpServer, {
  path: "/api/socket.io",
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening with Socket.io");
});
