import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { attachUser } from "./middleware/auth";
import { advancedHelmet } from "./middleware/helmet";
import { advancedCors } from "./middleware/cors";
import {
  requestIdMiddleware,
  securityHeadersMiddleware,
} from "./middleware/securityHeaders";
import { securityMonitorMiddleware } from "./services/securityMonitor";
import { generalLimiter } from "./middleware/rateLimit";
import { logger } from "./middleware/logger";
import { errorHandler, notFoundHandler, AppError } from "./middleware/errorHandler";
import { sanitizerMiddleware } from "./middleware/sanitizer";
import { csrfProtection, csrfTokenEndpoint } from "./middleware/csrf";
import { auditLogger } from "./middleware/auditLog";
import { ipBlacklistMiddleware } from "./middleware/ipBlacklist";
import { defaultRequestSizeLimit } from "./middleware/requestSizeLimit";
import { sessionValidationMiddleware } from "./middleware/sessionManager";
import authRoutes from "./routes/auth";
import menuRoutes from "./routes/menu";
import orderRoutes from "./routes/orders";
import reservationRoutes from "./routes/reservations";
import reviewRoutes from "./routes/reviews";
import uploadRoutes from "./routes/upload";
import securityRoutes from "./routes/security";
import webhooksRouter from "./routes/webhooks";
import notificationRoutes from "./routes/notifications";

const app = express();

app.set("trust proxy", 1);

app.use(advancedHelmet());
app.use(advancedCors());
app.use(requestIdMiddleware);
app.use(securityHeadersMiddleware);
app.use(securityMonitorMiddleware);

app.use(logger);
app.use(generalLimiter);
app.use(ipBlacklistMiddleware);
app.use(defaultRequestSizeLimit());
app.use(sanitizerMiddleware);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(attachUser);
app.use(sessionValidationMiddleware);

app.get("/api/csrf-token", csrfTokenEndpoint);
app.use(csrfProtection);

app.use(auditLogger);

app.use("/uploads", express.static(path.resolve("uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/webhooks", webhooksRouter);

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    },
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
