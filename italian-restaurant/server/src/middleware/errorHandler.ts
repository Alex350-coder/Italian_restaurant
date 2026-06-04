import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode?: string;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly details: Record<string, string[]>;

  constructor(message: string, details: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: Record<string, string[]>;
  stack?: string;
  timestamp: string;
  path: string;
  method: string;
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  const path = req.originalUrl;
  const method = req.method;

  if (err instanceof ValidationError) {
    const response: ErrorResponse = {
      success: false,
      error: err.message,
      errorCode: err.errorCode,
      details: err.details,
      timestamp,
      path,
      method,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  if (err instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: err.message,
      errorCode: err.errorCode,
      timestamp,
      path,
      method,
    };

    if (process.env.NODE_ENV !== "production") {
      response.stack = err.stack;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  console.error(`[ERROR] ${timestamp} ${method} ${path}:`, err);

  const response: ErrorResponse = {
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
    errorCode: "INTERNAL_ERROR",
    timestamp,
    path,
    method,
  };

  if (process.env.NODE_ENV !== "production") {
    response.stack = err.stack;
  }

  res.status(500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ErrorResponse = {
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    errorCode: "ROUTE_NOT_FOUND",
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  res.status(404).json(response);
}
