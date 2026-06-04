import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { env } from "../config/env";

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = "_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_SECRET = env.JWT_SECRET + "_csrf";

function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString("hex");
}

function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", CSRF_SECRET)
    .update(token)
    .digest("hex");
}

function getCsrfSecretFromRequest(req: Request): string | undefined {
  return req.cookies?.[CSRF_COOKIE_NAME] as string | undefined;
}

export function generateCsrfTokenPair(
  req: Request,
  res: Response
): { token: string; cookie: string } {
  const token = generateCsrfToken();
  const hashedToken = hashToken(token);

  res.cookie(CSRF_COOKIE_NAME, hashedToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 1000,
  });

  return { token, cookie: hashedToken };
}

export function csrfProtection(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (env.NODE_ENV === "test") {
    next();
    return;
  }

  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  const hasBearerToken = authHeader && authHeader.startsWith("Bearer ");

  if (
    req.path === "/api/auth/login" ||
    req.path === "/api/auth/register" ||
    req.path === "/api/health" ||
    hasBearerToken
  ) {
    next();
    return;
  }

  const cookieToken = getCsrfSecretFromRequest(req);
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  if (!cookieToken || !headerToken) {
    res.status(403).json({
      success: false,
      error: "CSRF token missing",
    });
    return;
  }

  const hashedHeaderToken = hashToken(headerToken);

  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(hashedHeaderToken))) {
    res.status(403).json({
      success: false,
      error: "Invalid CSRF token",
    });
    return;
  }

  next();
}

export function csrfTokenEndpoint(
  req: Request,
  res: Response
): void {
  const { token } = generateCsrfTokenPair(req, res);

  res.json({
    success: true,
    data: { csrfToken: token },
  });
}

export { CSRF_HEADER_NAME, CSRF_COOKIE_NAME };
