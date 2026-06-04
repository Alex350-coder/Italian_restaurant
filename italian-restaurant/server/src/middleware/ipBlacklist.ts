import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";

const MAX_FAILED_ATTEMPTS = 10;
const BAN_DURATION_MS = 5 * 60 * 1000;

interface FailedAttempt {
  ip: string;
  timestamp: number;
}

const failedAttempts = new Map<string, FailedAttempt[]>();
const manualBanList = new Set<string>();

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

function cleanupOldAttempts(ip: string): void {
  const attempts = failedAttempts.get(ip);
  if (!attempts) return;

  const now = Date.now();
  const recent = attempts.filter((a) => now - a.timestamp < BAN_DURATION_MS);

  if (recent.length === 0) {
    failedAttempts.delete(ip);
  } else {
    failedAttempts.set(ip, recent);
  }
}

export function recordFailedAttempt(ip: string): boolean {
  cleanupOldAttempts(ip);

  const attempts = failedAttempts.get(ip) || [];
  attempts.push({ ip, timestamp: Date.now() });
  failedAttempts.set(ip, attempts);

  return attempts.length >= MAX_FAILED_ATTEMPTS;
}

export function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip);
}

export async function banIp(ip: string, reason?: string): Promise<void> {
  manualBanList.add(ip);

  try {
    await query(
      `INSERT INTO ip_blacklist (ip_address, reason, banned_at, expires_at)
       VALUES ($1, $2, NOW(), NOW() + INTERVAL '24 hours')
       ON CONFLICT (ip_address) DO UPDATE SET
         reason = $2,
         banned_at = NOW(),
         expires_at = NOW() + INTERVAL '24 hours'`,
      [ip, reason || "Manual ban"]
    );
  } catch (error) {
    console.error("Failed to persist IP ban:", error);
  }
}

export async function unbanIp(ip: string): Promise<boolean> {
  manualBanList.delete(ip);

  try {
    const result = await query(
      "DELETE FROM ip_blacklist WHERE ip_address = $1",
      [ip]
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Failed to unban IP:", error);
    return false;
  }
}

export async function isIpBanned(ip: string): Promise<boolean> {
  if (manualBanList.has(ip)) {
    return true;
  }

  const attempts = failedAttempts.get(ip);
  if (attempts) {
    const now = Date.now();
    const recent = attempts.filter((a) => now - a.timestamp < BAN_DURATION_MS);
    if (recent.length >= MAX_FAILED_ATTEMPTS) {
      return true;
    }
  }

  try {
    const result = await query(
      "SELECT 1 FROM ip_blacklist WHERE ip_address = $1 AND expires_at > NOW()",
      [ip]
    );
    if ((result.rowCount ?? 0) > 0) {
      manualBanList.add(ip);
      return true;
    }
  } catch (error) {
    console.error("Failed to check IP blacklist:", error);
  }

  return false;
}

export function ipBlacklistMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const ip = getClientIp(req);

  if (manualBanList.has(ip)) {
    res.status(403).json({
      success: false,
      error: "Access denied",
    });
    return;
  }

  const attempts = failedAttempts.get(ip);
  if (attempts) {
    const now = Date.now();
    const recent = attempts.filter((a) => now - a.timestamp < BAN_DURATION_MS);
    if (recent.length >= MAX_FAILED_ATTEMPTS) {
      banIp(ip, "Auto-ban: too many failed attempts").catch(console.error);
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }
  }

  next();
}

export function getClientIpMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  (req as any).clientIp = getClientIp(req);
  next();
}

export function getFailedAttemptsStats(): { total: number; topIps: Array<{ ip: string; attempts: number }> } {
  let total = 0;
  const ipCounts: Record<string, number> = {};

  for (const [ip, attempts] of failedAttempts.entries()) {
    cleanupOldAttempts(ip);
    const cleaned = failedAttempts.get(ip);
    if (cleaned && cleaned.length > 0) {
      ipCounts[ip] = cleaned.length;
      total += cleaned.length;
    }
  }

  const topIps = Object.entries(ipCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20)
    .map(([ip, attempts]) => ({ ip, attempts }));

  return { total, topIps };
}

export async function getBlacklistedIps(): Promise<
  Array<{ ip: string; reason: string; bannedAt: Date; expiresAt: Date }>
> {
  try {
    const result = await query(
      "SELECT ip_address as ip, reason, banned_at, expires_at FROM ip_blacklist WHERE expires_at > NOW() ORDER BY banned_at DESC"
    );
    return result.rows;
  } catch (error) {
    console.error("Failed to get blacklisted IPs:", error);
    return [];
  }
}
