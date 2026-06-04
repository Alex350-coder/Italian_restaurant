import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

const SENSITIVE_PATHS = ["/api/auth", "/api/security", "/api/upload"];

function isSensitiveEndpoint(path: string): boolean {
  return SENSITIVE_PATHS.some((p) => path.startsWith(p));
}

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4();
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
}

export function securityHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.removeHeader("X-Powered-By");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("X-Download-Options", "noopen");
  res.setHeader("X-DNS-Prefetch-Control", "off");

  res.setHeader(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
  );

  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

  if (req.method === "GET" || req.method === "HEAD") {
    if (isSensitiveEndpoint(req.path)) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } else {
      res.setHeader("Cache-Control", "no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
    }
  }

  const rateLimitRemaining = res.getHeader("X-RateLimit-Remaining");
  if (rateLimitRemaining !== undefined) {
    res.setHeader("X-RateLimit-Remaining", rateLimitRemaining);
  }

  next();
}

export function rateLimitHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    const rateLimitLimit = res.getHeader("X-RateLimit-Limit");
    const rateLimitRemaining = res.getHeader("X-RateLimit-Remaining");
    const rateLimitReset = res.getHeader("X-RateLimit-Reset");

    if (rateLimitLimit) res.setHeader("X-RateLimit-Limit", rateLimitLimit);
    if (rateLimitRemaining !== undefined) res.setHeader("X-RateLimit-Remaining", rateLimitRemaining);
    if (rateLimitReset) res.setHeader("X-RateLimit-Reset", rateLimitReset);

    return originalJson(body);
  } as any;

  next();
}
