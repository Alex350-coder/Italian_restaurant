import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { securityConfig } from "../config/security";
import { AuthRequest } from "./auth";

export interface SessionInfo {
  sessionId: string;
  userId: string;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  os: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

function parseUserAgent(userAgent: string): {
  device: string;
  browser: string;
  os: string;
} {
  let device = "Unknown";
  let browser = "Unknown";
  let os = "Unknown";

  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    device = /ipad/i.test(userAgent) ? "iPad" : /iphone/i.test(userAgent) ? "iPhone" : "Mobile";
  } else {
    device = "Desktop";
  }

  if (/chrome/i.test(userAgent) && !/edge|opr/i.test(userAgent)) {
    browser = "Chrome";
  } else if (/firefox/i.test(userAgent)) {
    browser = "Firefox";
  } else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) {
    browser = "Safari";
  } else if (/edge/i.test(userAgent)) {
    browser = "Edge";
  } else if (/opr|opera/i.test(userAgent)) {
    browser = "Opera";
  }

  if (/windows/i.test(userAgent)) {
    os = "Windows";
  } else if (/mac os/i.test(userAgent)) {
    os = "macOS";
  } else if (/linux/i.test(userAgent)) {
    os = "Linux";
  } else if (/android/i.test(userAgent)) {
    os = "Android";
  } else if (/iphone|ipad/i.test(userAgent)) {
    os = "iOS";
  }

  return { device, browser, os };
}

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

export async function createSession(
  userId: string,
  req: Request,
  tokenJti: string
): Promise<string> {
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] || "unknown";
  const { device, browser, os } = parseUserAgent(userAgent);
  const sessionId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + securityConfig.session.absoluteTimeoutMs
  );

  try {
    const activeSessions = await query(
      `SELECT COUNT(*) as count FROM active_sessions WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );

    const count = parseInt(activeSessions.rows[0].count, 10);
    if (count >= securityConfig.session.maxConcurrentSessions) {
      await query(
        `DELETE FROM active_sessions
         WHERE user_id = $1 AND id NOT IN (
           SELECT id FROM active_sessions
           WHERE user_id = $1
           ORDER BY last_activity_at ASC
           LIMIT $2
         )`,
        [userId, securityConfig.session.maxConcurrentSessions - 1]
      );
    }

    await query(
      `INSERT INTO active_sessions (id, user_id, token_jti, ip_address, user_agent, device, browser, os, created_at, last_activity_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [sessionId, userId, tokenJti, ip, userAgent, device, browser, os, now, now, expiresAt]
    );

    return sessionId;
  } catch (error) {
    console.error("Failed to create session:", error);
    return sessionId;
  }
}

export async function updateSessionActivity(sessionId: string): Promise<boolean> {
  try {
    const result = await query(
      `UPDATE active_sessions
       SET last_activity_at = NOW()
       WHERE id = $1 AND expires_at > NOW()`,
      [sessionId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Failed to update session activity:", error);
    return false;
  }
}

export async function invalidateSession(sessionId: string): Promise<boolean> {
  try {
    const result = await query(
      `DELETE FROM active_sessions WHERE id = $1`,
      [sessionId]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Failed to invalidate session:", error);
    return false;
  }
}

export async function invalidateAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<void> {
  try {
    if (exceptSessionId) {
      await query(
        `DELETE FROM active_sessions WHERE user_id = $1 AND id != $2`,
        [userId, exceptSessionId]
      );
    } else {
      await query(
        `DELETE FROM active_sessions WHERE user_id = $1`,
        [userId]
      );
    }
  } catch (error) {
    console.error("Failed to invalidate user sessions:", error);
  }
}

export async function getUserSessions(
  userId: string
): Promise<SessionInfo[]> {
  try {
    const result = await query(
      `SELECT id as "sessionId", user_id as "userId", ip_address as "ip",
              user_agent as "userAgent", device, browser, os,
              created_at as "createdAt", last_activity_at as "lastActivityAt",
              expires_at as "expiresAt"
       FROM active_sessions
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY last_activity_at DESC`,
      [userId]
    );

    return result.rows.map((row) => ({
      ...row,
      isCurrent: false,
    }));
  } catch (error) {
    console.error("Failed to get user sessions:", error);
    return [];
  }
}

export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const result = await query(
      `DELETE FROM active_sessions WHERE expires_at <= NOW()`
    );
    return result.rowCount ?? 0;
  } catch (error) {
    console.error("Failed to cleanup expired sessions:", error);
    return 0;
  }
}

export function sessionValidationMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next();
    return;
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    next();
    return;
  }

  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(token) as { jti?: string; exp?: number };
    if (!decoded?.jti) {
      next();
      return;
    }

    query(
      `SELECT id, expires_at FROM active_sessions
       WHERE token_jti = $1 AND user_id = $2 AND expires_at > NOW()`,
      [decoded.jti, req.user.id]
    )
      .then((result) => {
        if (result.rows.length > 0) {
          updateSessionActivity(result.rows[0].id).catch(console.error);
        }
        next();
      })
      .catch(() => {
        next();
      });
  } catch {
    next();
  }
}
