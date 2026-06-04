import { Request, Response, NextFunction } from "express";
import { AuditLogModel } from "../models/auditLog";
import { AuthRequest } from "./auth";

const SKIP_PATHS = [
  "/api/health",
  "/api/auth/login",
  "/api/auth/register",
  "/api/upload",
];

function shouldAudit(req: Request): boolean {
  if (SKIP_PATHS.some((p) => req.path.startsWith(p))) {
    return false;
  }

  return ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
}

function extractResourceFromPath(path: string): { resource: string; resourceId?: string } {
  const parts = path.split("/").filter(Boolean);
  const apiIndex = parts.indexOf("api");

  if (apiIndex === -1 || apiIndex + 1 >= parts.length) {
    return { resource: "unknown" };
  }

  const resourceParts = parts.slice(apiIndex + 1);
  const resource = resourceParts[0] || "unknown";
  const resourceId = resourceParts.length > 1 ? resourceParts[1] : undefined;

  return { resource, resourceId };
}

function getActionFromMethod(method: string): string {
  switch (method) {
    case "POST": return "create";
    case "PUT":
    case "PATCH": return "update";
    case "DELETE": return "delete";
    default: return "unknown";
  }
}

export function auditLogger(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!shouldAudit(req)) {
    next();
    return;
  }

  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let responseStatusCode = res.statusCode;
  let responseSent = false;

  res.status = function (code: number) {
    responseStatusCode = code;
    return originalStatus(code);
  } as any;

  res.json = function (body: any) {
    if (!responseSent) {
      responseSent = true;

      const { resource, resourceId } = extractResourceFromPath(req.path);
      const action = getActionFromMethod(req.method);

      const logEntry = {
        userId: req.user?.id || "anonymous",
        action,
        resource,
        resourceId,
        method: req.method,
        path: req.path,
        statusCode: responseStatusCode,
        ip: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
        requestBody: req.method !== "DELETE" ? sanitizeLogBody(req.body) : undefined,
        responseStatus: (responseStatusCode >= 200 && responseStatusCode < 400 ? "success" : "failure") as "success" | "failure",
      };

      AuditLogModel.create(logEntry).catch((err) => {
        console.error("Failed to write audit log:", err);
      });
    }

    return originalJson(body);
  } as any;

  next();
}

function sanitizeLogBody(body: any): any {
  if (!body || typeof body !== "object") {
    return body;
  }

  const sensitiveFields = ["password", "password_hash", "token", "secret", "credit_card", "ssn"];
  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

export async function auditLogEndpoint(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const {
      userId,
      resource,
      action,
      from,
      to,
      page = "1",
      limit = "50",
    } = req.query as Record<string, string>;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLogModel.findByFilters({
      userId: userId as string,
      resource: resource as string,
      action: action as string,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: parseInt(limit),
      offset,
    });

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Audit log endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit logs",
    });
  }
}

export async function auditStatsEndpoint(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const stats = await AuditLogModel.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Audit stats endpoint error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to retrieve audit stats",
    });
  }
}
