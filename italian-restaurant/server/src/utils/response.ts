import { Response } from "express";
import { buildPaginationMeta, PaginationMeta } from "./pagination";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
  message?: string;
  meta?: PaginationMeta;
  timestamp: string;
  path?: string;
  details?: Record<string, unknown>;
}

export function success<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  if (message) {
    response.message = message;
  }

  res.status(statusCode).json(response);
}

export function created<T>(res: Response, data: T, message?: string): void {
  success(res, data, 201, message);
}

export function error(
  res: Response,
  statusCode: number,
  message: string,
  errorCode?: string,
  details?: Record<string, unknown>
): void {
  const response: ApiResponse = {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };

  if (errorCode) {
    response.errorCode = errorCode;
  }

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
}

export function paginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  limit: number
): void {
  const meta = buildPaginationMeta(total, page, limit);

  const response: ApiResponse<T[]> = {
    success: true,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function badRequest(res: Response, message: string, errorCode?: string): void {
  error(res, 400, message, errorCode);
}

export function unauthorized(res: Response, message = "Authentication required"): void {
  error(res, 401, message, "UNAUTHORIZED");
}

export function forbidden(res: Response, message = "Insufficient permissions"): void {
  error(res, 403, message, "FORBIDDEN");
}

export function notFound(res: Response, resource = "Resource"): void {
  error(res, 404, `${resource} not found`, "NOT_FOUND");
}

export function conflict(res: Response, message: string): void {
  error(res, 409, message, "CONFLICT");
}

export function tooManyRequests(res: Response, message = "Too many requests"): void {
  error(res, 429, message, "RATE_LIMIT_EXCEEDED");
}

export function internalError(res: Response, message = "Internal server error"): void {
  error(res, 500, message, "INTERNAL_ERROR");
}
