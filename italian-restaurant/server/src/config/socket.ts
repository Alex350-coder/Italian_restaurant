import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { UserModel } from "../models/user";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
  userName?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

let io: Server;

const ROOMS = {
  ADMIN_DASHBOARD: "admin:dashboard",
  KITCHEN_DISPLAY: "kitchen:display",
  orderRoom: (orderId: string) => `order:${orderId}`,
  userRoom: (userId: string) => `user:${userId}`,
};

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        socket.userId = undefined;
        socket.userRole = undefined;
        next();
        return;
      }

      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await UserModel.findById(decoded.userId);

      if (user) {
        socket.userId = user.id;
        socket.userRole = user.role;
        socket.userName = user.name;
      }

      next();
    } catch (error) {
      next();
    }
  });

  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[SOCKET] Client connected: ${socket.id} (user: ${socket.userId || "anonymous"})`);

    if (socket.userId) {
      socket.join(ROOMS.userRoom(socket.userId));

      if (socket.userRole === "admin") {
        socket.join(ROOMS.ADMIN_DASHBOARD);
        console.log(`[SOCKET] Admin joined dashboard: ${socket.userName}`);
      }
    }

    socket.on("join:order", (orderId: string) => {
      if (socket.userId) {
        socket.join(ROOMS.orderRoom(orderId));
        console.log(`[SOCKET] User ${socket.userId} joined order room: ${orderId}`);
      }
    });

    socket.on("leave:order", (orderId: string) => {
      socket.leave(ROOMS.orderRoom(orderId));
    });

    socket.on("join:kitchen", () => {
      if (socket.userRole === "admin") {
        socket.join(ROOMS.KITCHEN_DISPLAY);
        console.log(`[SOCKET] Kitchen display joined`);
      }
    });

    socket.on("leave:kitchen", () => {
      socket.leave(ROOMS.KITCHEN_DISPLAY);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[SOCKET] Client disconnected: ${socket.id} (reason: ${reason})`);
    });

    socket.on("error", (error) => {
      console.error(`[SOCKET] Error for ${socket.id}:`, error);
    });
  });

  console.log("🔌 WebSocket server initialized");
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocket first.");
  }
  return io;
}

export function emitToUser(userId: string, event: string, data: any): void {
  if (io) {
    io.to(ROOMS.userRoom(userId)).emit(event, data);
  }
}

export function emitToAdmins(event: string, data: any): void {
  if (io) {
    io.to(ROOMS.ADMIN_DASHBOARD).emit(event, data);
  }
}

export function emitToOrder(orderId: string, event: string, data: any): void {
  if (io) {
    io.to(ROOMS.orderRoom(orderId)).emit(event, data);
  }
}

export function emitToKitchen(event: string, data: any): void {
  if (io) {
    io.to(ROOMS.KITCHEN_DISPLAY).emit(event, data);
  }
}

export function broadcast(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

export { ROOMS };
