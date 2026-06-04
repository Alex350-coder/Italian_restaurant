import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { query } from "../config/database";
import { securityConfig, validatePasswordStrength } from "../config/security";
import { AuthRequest } from "./auth";

const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "123456", "12345678", "1234567890",
  "qwerty", "abc123", "letmein", "admin", "welcome", "monkey", "master",
  "dragon", "login", "princess", "football", "shadow", "sunshine", "trustno1",
  "iloveyou", "1234567", "123456789", "1234567890", "12345", "12345678910",
  "passw0rd", "hello", "charlie", "donald", "password12", "password1234",
  "passw0rd1", "qwerty123", "admin123", "root", "toor", "changeme",
  "default", "guest", "test", "user", "demo",
]);

const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordComplexity(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const { password: policy } = securityConfig;

  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must be at most ${policy.maxLength} characters`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z)");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z)");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number (0-9)");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  if (/(.)\1{2,}/.test(password)) {
    errors.push("Password must not contain 3+ consecutive identical characters");
  }

  if (/^(012|123|234|345|456|567|678|789|890)/.test(password)) {
    errors.push("Password must not start with sequential numbers");
  }

  if (/^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    errors.push("Password must not start with sequential letters");
  }

  return { valid: errors.length === 0, errors };
}

export function isCommonPassword(password: string): boolean {
  const lower = password.toLowerCase();
  return COMMON_PASSWORDS.has(lower);
}

export async function checkPasswordHistory(
  userId: string,
  plaintextPassword: string
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const result = await query(
      `SELECT password_hash FROM password_history
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, securityConfig.password.preventReuse]
    );

    for (const row of result.rows) {
      const matches = await bcrypt.compare(plaintextPassword, row.password_hash);
      if (matches) {
        return {
          allowed: false,
          error: `Cannot reuse last ${securityConfig.password.preventReuse} passwords`,
        };
      }
    }

    return { allowed: true };
  } catch (error) {
    console.error("Password history check failed:", error);
    return { allowed: true };
  }
}

export async function recordPasswordHistory(
  userId: string,
  passwordHash: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO password_history (id, user_id, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [crypto.randomUUID(), userId, passwordHash]
    );

    const countResult = await query(
      `SELECT COUNT(*) as count FROM password_history WHERE user_id = $1`,
      [userId]
    );

    const count = parseInt(countResult.rows[0].count, 10);
    if (count > securityConfig.password.preventReuse) {
      await query(
        `DELETE FROM password_history
         WHERE user_id = $1 AND id NOT IN (
           SELECT id FROM password_history
           WHERE user_id = $1
           ORDER BY created_at DESC
           LIMIT $2
         )`,
        [userId, securityConfig.password.preventReuse]
      );
    }
  } catch (error) {
    console.error("Failed to record password history:", error);
  }
}

export function passwordPolicyMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const { newPassword } = req.body;

  if (!newPassword) {
    next();
    return;
  }

  const complexity = validatePasswordComplexity(newPassword);
  if (!complexity.valid) {
    res.status(400).json({
      success: false,
      error: "Password does not meet complexity requirements",
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

  next();
}
