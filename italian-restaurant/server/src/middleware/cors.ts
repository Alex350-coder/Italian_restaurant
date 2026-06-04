import cors from "cors";
import { Request } from "express";
import { env } from "../config/env";

const ALLOWED_ORIGINS: string[] = [
  env.CORS_ORIGIN,
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
].filter(Boolean);

const PRODUCTION_ORIGINS: string[] = [
  env.CORS_ORIGIN,
].filter((o) => o && !o.includes("localhost"));

function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return true;

  const origins =
    env.NODE_ENV === "production" ? PRODUCTION_ORIGINS : ALLOWED_ORIGINS;

  return origins.includes(origin);
}

export function advancedCors() {
  return cors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (isOriginAllowed(requestOrigin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Requested-With",
      "X-Request-ID",
      "Accept",
      "Origin",
    ],
    exposedHeaders: [
      "X-CSRF-Token",
      "X-Request-ID",
      "X-RateLimit-Limit",
      "X-RateLimit-Remaining",
      "X-RateLimit-Reset",
    ],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
}
