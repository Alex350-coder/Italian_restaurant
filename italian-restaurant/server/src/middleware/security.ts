import helmet from "helmet";
import cors from "cors";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";

export function securityMiddleware() {
  return [
    helmet(),
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  ];
}

export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  if (env.NODE_ENV === "development") {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
  }
  next();
}
