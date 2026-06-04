import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env";
import { UserModel, SafeUser } from "../models/user";
import { query } from "../config/database";
import { securityConfig } from "../config/security";
import { recordFailedAttempt, clearFailedAttempts } from "./ipBlacklist";
import { recordSecurityEvent, detectBruteForce } from "../services/securityMonitor";
import {
  createSession,
  invalidateAllUserSessions,
  updateSessionActivity,
} from "./sessionManager";

export interface AuthRequest extends Request {
  user?: SafeUser;
  sessionId?: string;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  jti: string;
  exp?: number;
}

interface LockoutRecord {
  failedAttempts: number;
  lockedAt: Date | null;
  lockoutExpires: Date | null;
  lastFailedAt: Date | null;
}

function getClientIp(req: Request): string {
  return (
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

export function verifyToken(token: string): JwtPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function generateToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  const jti = uuidv4();
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    env.JWT_SECRET,
    {
      expiresIn: securityConfig.session.accessTokenTtlMs / 1000,
    }
  );
}

export function generateRefreshToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  const jti = uuidv4();
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
      type: "refresh",
    },
    env.JWT_SECRET,
    {
      expiresIn: securityConfig.session.refreshTokenTtlMs / 1000,
    }
  );
}

async function isTokenBlacklisted(jti: string): Promise<boolean> {
  try {
    const result = await query(
      "SELECT 1 FROM token_blacklist WHERE token_jti = $1",
      [jti]
    );
    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

async function blacklistToken(
  jti: string,
  userId: string,
  expiresAt: Date
): Promise<void> {
  try {
    await query(
      `INSERT INTO token_blacklist (id, token_jti, user_id, expires_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (token_jti) DO NOTHING`,
      [uuidv4(), jti, userId, expiresAt]
    );
  } catch (error) {
    console.error("Failed to blacklist token:", error);
  }
}

async function getLockoutRecord(
  userId: string
): Promise<LockoutRecord | null> {
  try {
    const result = await query(
      `SELECT failed_attempts as "failedAttempts",
              locked_at as "lockedAt",
              lockout_expires as "lockoutExpires",
              last_failed_at as "lastFailedAt"
       FROM account_lockouts
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch {
    return null;
  }
}

async function recordFailedLoginAttempt(
  userId: string,
  ip: string
): Promise<{ locked: boolean; remainingAttempts: number }> {
  const record = await getLockoutRecord(userId);
  const now = new Date();

  if (!record) {
    await query(
      `INSERT INTO account_lockouts (id, user_id, failed_attempts, locked_at, lockout_expires, last_failed_at, created_at, updated_at)
       VALUES ($1, $2, 1, NULL, NULL, $3, $3, $3)`,
      [uuidv4(), userId, now]
    );
    return {
      locked: false,
      remainingAttempts: securityConfig.account.maxFailedAttempts - 1,
    };
  }

  if (record.lockedAt && record.lockoutExpires && now < new Date(record.lockoutExpires)) {
    return {
      locked: true,
      remainingAttempts: 0,
    };
  }

  const newAttempts = record.failedAttempts + 1;
  const shouldLock =
    newAttempts >= securityConfig.account.maxFailedAttempts;

  if (shouldLock) {
    const lockoutExpires = new Date(
      now.getTime() + securityConfig.account.lockoutDurationMs
    );
    await query(
      `UPDATE account_lockouts
       SET failed_attempts = $1, locked_at = $2, lockout_expires = $3,
           last_failed_at = $4, updated_at = $4
       WHERE user_id = $5`,
      [newAttempts, now, lockoutExpires, now, userId]
    );

    await recordSecurityEvent({
      type: "brute_force_attempt",
      details: `Account locked after ${newAttempts} failed attempts for user ${userId}`,
      severity: "high",
      ip,
      userId,
    });

    return { locked: true, remainingAttempts: 0 };
  }

  await query(
    `UPDATE account_lockouts
     SET failed_attempts = $1, last_failed_at = $2, updated_at = $2
     WHERE user_id = $3`,
    [newAttempts, now, userId]
  );

  return {
    locked: false,
    remainingAttempts: securityConfig.account.maxFailedAttempts - newAttempts,
  };
}

async function resetFailedAttempts(userId: string): Promise<void> {
  try {
    await query(
      `UPDATE account_lockouts
       SET failed_attempts = 0, locked_at = NULL, lockout_expires = NULL, updated_at = NOW()
       WHERE user_id = $1`,
      [userId]
    );
  } catch (error) {
    console.error("Failed to reset attempts:", error);
  }
}

async function recordLoginHistory(
  userId: string,
  ip: string,
  userAgent: string,
  success: boolean,
  failureReason?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO login_history (id, user_id, ip_address, user_agent, success, failure_reason, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [uuidv4(), userId, ip, userAgent, success, failureReason || null]
    );
  } catch (error) {
    console.error("Failed to record login history:", error);
  }
}

export async function attachUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      next();
      return;
    }

    const decoded = verifyToken(token);

    if (decoded.jti) {
      const blacklisted = await isTokenBlacklisted(decoded.jti);
      if (blacklisted) {
        res.status(401).json({
          success: false,
          error: "Token has been revoked",
        });
        return;
      }
    }

    const user = await UserModel.findById(decoded.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    console.error("JWT verification failed:", error instanceof Error ? error.message : error);
    next();
  }
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: "Authentication required",
    });
    return;
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
}

export async function loginWithLockout(
  email: string,
  password: string,
  ip: string,
  userAgent?: string
): Promise<{
  user: any;
  token: string;
  refreshToken: string;
  locked?: boolean;
  remainingAttempts?: number;
  lockoutMinutes?: number;
}> {
  const user = await UserModel.verifyPassword(email, password);

  if (!user) {
    const existingUser = await UserModel.findByEmail(email);

    await detectBruteForce(ip, email);

    if (existingUser) {
      recordFailedAttempt(ip);
      const lockResult = await recordFailedLoginAttempt(existingUser.id, ip);

      await recordLoginHistory(
        existingUser.id,
        ip,
        userAgent || "unknown",
        false,
        "Invalid password"
      );

      if (lockResult.locked) {
        const lockoutMinutes = Math.ceil(
          securityConfig.account.lockoutDurationMs / 60000
        );
        return {
          user: null,
          token: "",
          refreshToken: "",
          locked: true,
          remainingAttempts: 0,
          lockoutMinutes,
        };
      }

      return {
        user: null,
        token: "",
        refreshToken: "",
        remainingAttempts: lockResult.remainingAttempts,
      };
    }

    recordFailedAttempt(ip);

    await recordSecurityEvent({
      type: "suspicious_activity",
      details: `Login attempt for non-existent email: ${email.substring(0, 3)}***`,
      severity: "low",
      ip,
    });

    return {
      user: null,
      token: "",
      refreshToken: "",
      remainingAttempts: securityConfig.account.maxFailedAttempts - 1,
    };
  }

  const lockoutRecord = await getLockoutRecord(user.id);
  if (
    lockoutRecord?.lockedAt &&
    lockoutRecord?.lockoutExpires &&
    new Date() < new Date(lockoutRecord.lockoutExpires)
  ) {
    const lockoutMinutes = Math.ceil(
      (new Date(lockoutRecord.lockoutExpires).getTime() - Date.now()) / 60000
    );
    return {
      user: null,
      token: "",
      refreshToken: "",
      locked: true,
      remainingAttempts: 0,
      lockoutMinutes,
    };
  }

  clearFailedAttempts(ip);
  await resetFailedAttempts(user.id);

  const token = generateToken(user);
  const refreshToken = generateRefreshToken(user);

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    decoded = { userId: user.id, email: user.email, role: user.role, jti: uuidv4() };
  }

  await createSession(user.id, { headers: { "user-agent": userAgent || "unknown" }, ip } as any, decoded.jti);

  await recordLoginHistory(user.id, ip, userAgent || "unknown", true);

  return { user, token, refreshToken };
}

export async function invalidateAllUserTokens(
  userId: string
): Promise<void> {
  try {
    await query(
      `UPDATE token_blacklist SET expires_at = NOW()
       WHERE user_id = $1 AND expires_at > NOW()`,
      [userId]
    );

    await invalidateAllUserSessions(userId);
  } catch (error) {
    console.error("Failed to invalidate tokens:", error);
  }
}

export async function handleTokenRefresh(
  refreshToken: string
): Promise<{ token: string; refreshToken: string } | null> {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtPayload;

    if ((decoded as any).type !== "refresh") {
      return null;
    }

    if (decoded.jti) {
      const blacklisted = await isTokenBlacklisted(decoded.jti);
      if (blacklisted) {
        return null;
      }

      const expiresAt = new Date(decoded.exp! * 1000);
      await blacklistToken(decoded.jti, decoded.userId, expiresAt);
    }

    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return null;
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return { token: newToken, refreshToken: newRefreshToken };
  } catch {
    return null;
  }
}
