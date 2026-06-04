import { Router, Response } from "express";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { UserModel } from "../models/user";
import {
  AuthRequest,
  generateToken,
  generateRefreshToken,
  requireAuth,
  loginWithLockout,
  invalidateAllUserTokens,
  handleTokenRefresh,
} from "../middleware/auth";
import { validate, registerSchema, loginSchema, changePasswordSchema } from "../middleware/validation";
import { authLimiter } from "../middleware/rateLimit";
import { emailService } from "../services/emailService";
import { query } from "../config/database";
import { securityConfig } from "../config/security";
import {
  validatePasswordComplexity,
  isCommonPassword,
  hashPassword,
  comparePassword,
  checkPasswordHistory,
  recordPasswordHistory,
} from "../middleware/passwordPolicy";
import {
  getUserSessions,
  invalidateSession,
  invalidateAllUserSessions,
} from "../middleware/sessionManager";
import {
  recordSecurityEvent,
} from "../services/securityMonitor";

const router = Router();

function getClientIp(req: any): string {
  return (
    req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function storeResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
  const tokenHash = hashToken(token);
  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt]
  );
}

async function validateResetToken(token: string): Promise<{ userId: string; valid: boolean; expired?: boolean }> {
  const tokenHash = hashToken(token);
  const result = await query(
    `SELECT user_id, expires_at, used
     FROM password_reset_tokens
     WHERE token_hash = $1 AND used = false
     ORDER BY created_at DESC
     LIMIT 1`,
    [tokenHash]
  );

  if (result.rows.length === 0) {
    return { userId: "", valid: false };
  }

  const row = result.rows[0];
  if (new Date() > new Date(row.expires_at)) {
    return { userId: row.user_id, valid: false, expired: true };
  }

  return { userId: row.user_id, valid: true };
}

async function markResetTokenUsed(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await query(
    `UPDATE password_reset_tokens SET used = true WHERE token_hash = $1`,
    [tokenHash]
  );
}

async function cleanupUserResetTokens(userId: string): Promise<void> {
  await query(
    `DELETE FROM password_reset_tokens WHERE user_id = $1`,
    [userId]
  );
}

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password, name, phone } = req.body;

      const complexity = validatePasswordComplexity(password);
      if (!complexity.valid) {
        res.status(400).json({
          success: false,
          error: "Password does not meet security requirements",
          details: complexity.errors,
        });
        return;
      }

      if (isCommonPassword(password)) {
        res.status(400).json({
          success: false,
          error: "This password is too common. Please choose a more unique password",
        });
        return;
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: "Email already registered",
        });
        return;
      }

      const user = await UserModel.create({ email, password, name, phone });
      const token = generateToken(user);

      const passwordHash = await hashPassword(password);
      await recordPasswordHistory(user.id, passwordHash);

      res.status(201).json({
        success: true,
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to register user",
      });
    }
  }
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { email, password } = req.body;
      const ip = getClientIp(req);
      const userAgent = req.headers["user-agent"] || "unknown";

      const result = await loginWithLockout(email, password, ip, userAgent);

      if (result.locked) {
        res.status(423).json({
          success: false,
          error: `Account locked due to too many failed attempts. Try again in ${result.lockoutMinutes} minutes`,
        });
        return;
      }

      if (!result.user) {
        res.status(401).json({
          success: false,
          error: "Invalid email or password",
          ...(result.remainingAttempts !== undefined && {
            remainingAttempts: result.remainingAttempts,
          }),
        });
        return;
      }

      const safeUser = UserModel.toSafeUser(result.user);

      res.json({
        success: true,
        data: {
          user: safeUser,
          token: result.token,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to login",
      });
    }
  }
);

router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    res.json({
      success: true,
      data: { user: req.user },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get profile",
    });
  }
});

router.put("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const { name, phone, email } = req.body;

    if (email && email !== req.user.email) {
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        res.status(409).json({ success: false, error: "Email already in use" });
        return;
      }
    }

    const updated = await UserModel.updateProfile(req.user.id, { name, phone, email });
    if (!updated) {
      res.status(400).json({ success: false, error: "No fields to update" });
      return;
    }

    res.json({ success: true, data: { user: updated } });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, error: "Failed to update profile" });
  }
});

router.post("/refresh", async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: "Refresh token is required",
      });
      return;
    }

    const tokens = await handleTokenRefresh(refreshToken);

    if (!tokens) {
      res.status(401).json({
        success: false,
        error: "Invalid or expired refresh token",
      });
      return;
    }

    res.json({
      success: true,
      data: { token: tokens.token, refreshToken: tokens.refreshToken },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to refresh token",
    });
  }
});

router.post("/forgot-password", async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      res.status(400).json({
        success: false,
        error: "Email is required",
      });
      return;
    }

    const user = await UserModel.findByEmail(email);

    if (!user) {
      res.json({
        success: true,
        data: { message: "If an account exists, a reset link has been sent" },
      });
      return;
    }

    const resetToken = uuidv4().replace(/-/g, "").slice(0, 32);
    const expiresAt = new Date(Date.now() + securityConfig.account.passwordResetTokenTtlMs);

    await storeResetToken(user.id, resetToken, expiresAt);

    await emailService.sendPasswordReset({
      customerName: user.name,
      resetToken,
      expiresIn: "1 hour",
    });

    res.json({
      success: true,
      data: { message: "If an account exists, a reset link has been sent" },
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to process password reset request",
    });
  }
});

router.post("/reset-password", async (req: AuthRequest, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
      return;
    }

    const complexity = validatePasswordComplexity(newPassword);
    if (!complexity.valid) {
      res.status(400).json({
        success: false,
        error: "Password does not meet security requirements",
        details: complexity.errors,
      });
      return;
    }

    if (isCommonPassword(newPassword)) {
      res.status(400).json({
        success: false,
        error: "This password is too common. Please choose a more unique password",
      });
      return;
    }

    const tokenResult = await validateResetToken(token);

    if (!tokenResult.valid) {
      if (tokenResult.expired) {
        res.status(400).json({
          success: false,
          error: "Reset token has expired",
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Invalid or expired reset token",
        });
      }
      return;
    }

    const user = await UserModel.findById(tokenResult.userId);
    if (!user) {
      res.status(400).json({
        success: false,
        error: "User not found",
      });
      return;
    }

    const newHash = await hashPassword(newPassword);

    const historyCheck = await checkPasswordHistory(tokenResult.userId, newPassword);
    if (!historyCheck.allowed) {
      res.status(400).json({
        success: false,
        error: historyCheck.error,
      });
      return;
    }

    await query(
      "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3",
      [newHash, new Date(), tokenResult.userId]
    );

    await recordPasswordHistory(tokenResult.userId, newHash);

    await invalidateAllUserTokens(tokenResult.userId);

    await markResetTokenUsed(token);
    await cleanupUserResetTokens(tokenResult.userId);

    await emailService.sendPasswordResetConfirmation(user.name);

    res.json({
      success: true,
      data: { message: "Password reset successful. Please login with your new password" },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to reset password",
    });
  }
});

router.post(
  "/change-password",
  requireAuth,
  validate(changePasswordSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;
      const ip = getClientIp(req);

      const user = await UserModel.findByEmail(req.user.email);
      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
        });
        return;
      }

      const isValid = await comparePassword(currentPassword, user.password_hash);
      if (!isValid) {
        await recordSecurityEvent({
          type: "suspicious_activity",
          details: `Failed password change attempt for user ${req.user.id}`,
          severity: "medium",
          ip,
          userId: req.user.id,
        });

        res.status(401).json({
          success: false,
          error: "Current password is incorrect",
        });
        return;
      }

      const complexity = validatePasswordComplexity(newPassword);
      if (!complexity.valid) {
        res.status(400).json({
          success: false,
          error: "New password does not meet security requirements",
          details: complexity.errors,
        });
        return;
      }

      if (isCommonPassword(newPassword)) {
        res.status(400).json({
          success: false,
          error: "This password is too common. Please choose a more unique password",
        });
        return;
      }

      if (currentPassword === newPassword) {
        res.status(400).json({
          success: false,
          error: "New password must be different from current password",
        });
        return;
      }

      const newHash = await hashPassword(newPassword);

      const historyCheck = await checkPasswordHistory(req.user.id, newHash);
      if (!historyCheck.allowed) {
        res.status(400).json({
          success: false,
          error: historyCheck.error,
        });
        return;
      }

      await query(
        "UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3",
        [newHash, new Date(), req.user.id]
      );

      await recordPasswordHistory(req.user.id, newHash);

      if (securityConfig.session.invalidateOnPasswordChange) {
        await invalidateAllUserTokens(req.user.id);
      }

      res.json({
        success: true,
        data: { message: "Password changed successfully. Please login again" },
      });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to change password",
      });
    }
  }
);

router.get(
  "/sessions",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const sessions = await getUserSessions(req.user.id);

      res.json({
        success: true,
        data: { sessions },
      });
    } catch (error) {
      console.error("Get sessions error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve sessions",
      });
    }
  }
);

router.delete(
  "/sessions/:id",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const { id } = req.params;

      const sessionCheck = await query(
        `SELECT id FROM active_sessions WHERE id = $1 AND user_id = $2`,
        [id, req.user.id]
      );

      if (sessionCheck.rows.length === 0) {
        res.status(404).json({
          success: false,
          error: "Session not found",
        });
        return;
      }

      const invalidated = await invalidateSession(id);

      if (invalidated) {
        res.json({
          success: true,
          data: { message: "Session revoked successfully" },
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Session not found",
        });
      }
    } catch (error) {
      console.error("Revoke session error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to revoke session",
      });
    }
  }
);

router.delete(
  "/sessions",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      await invalidateAllUserTokens(req.user.id);

      res.json({
        success: true,
        data: { message: "All sessions revoked successfully" },
      });
    } catch (error) {
      console.error("Revoke all sessions error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to revoke sessions",
      });
    }
  }
);

router.get(
  "/login-history",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = Math.min(parseInt((req.query.limit as string) || "20", 10), 100);
      const offset = (page - 1) * limit;

      const result = await query(
        `SELECT id, ip_address as "ip", user_agent as "userAgent",
                success, failure_reason as "failureReason",
                created_at as "timestamp"
         FROM login_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [req.user.id, limit, offset]
      );

      const countResult = await query(
        `SELECT COUNT(*) as total FROM login_history WHERE user_id = $1`,
        [req.user.id]
      );

      res.json({
        success: true,
        data: {
          history: result.rows,
          pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total, 10),
          },
        },
      });
    } catch (error) {
      console.error("Get login history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve login history",
      });
    }
  }
);

export default router;
