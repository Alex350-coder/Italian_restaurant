import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";

class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400);
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

function handleError(err: Error, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err instanceof ValidationError && err.details ? { details: err.details } : {}),
    });
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
}

function createMockRes(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("Error Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AppError", () => {
    it("should create error with message and status code", () => {
      const error = new AppError("Something went wrong", 500);

      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
    });

    it("should be an instance of Error", () => {
      const error = new AppError("Test", 400);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it("should have correct name", () => {
      const error = new AppError("Test", 400);

      expect(error.name).toBe("Error");
    });

    it("should capture stack trace", () => {
      const error = new AppError("Test", 400);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("Test");
      expect(error.stack).toContain("at ");
    });
  });

  describe("handleError", () => {
    it("should return correct status for AppError", () => {
      const res = createMockRes();
      const error = new AppError("Custom error", 422);

      handleError(error, res);

      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Custom error",
      });
    });

    it("should return 500 for non-AppError errors", () => {
      const res = createMockRes();
      const error = new Error("Unexpected error");

      handleError(error, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: "Internal server error",
      });
    });

    it("should not expose internal error details in standard response", () => {
      const res = createMockRes();
      const error = new Error("Database connection string: postgres://user:pass@host");

      handleError(error, res);

      const jsonCall = (res.json as any).mock.calls[0][0];
      expect(jsonCall.error).not.toContain("postgres://");
    });
  });

  describe("ValidationError", () => {
    it("should return 400 status code", () => {
      const res = createMockRes();
      const error = new ValidationError("Invalid input");

      handleError(error, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should include error message", () => {
      const res = createMockRes();
      const error = new ValidationError("Email is required");

      handleError(error, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Email is required" })
      );
    });

    it("should include details when provided", () => {
      const res = createMockRes();
      const details = { field: "email", issue: "invalid format" };
      const error = new ValidationError("Validation failed", details);

      handleError(error, res);

      const jsonCall = (res.json as any).mock.calls[0][0];
      expect(jsonCall.details).toEqual(details);
    });

    it("should not include details when not provided", () => {
      const res = createMockRes();
      const error = new ValidationError("Validation failed");

      handleError(error, res);

      const jsonCall = (res.json as any).mock.calls[0][0];
      expect(jsonCall.details).toBeUndefined();
    });

    it("should be instance of AppError", () => {
      const error = new ValidationError("Test");

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.isOperational).toBe(true);
    });
  });

  describe("NotFoundError", () => {
    it("should return 404 status code", () => {
      const res = createMockRes();
      const error = new NotFoundError("Menu item");

      handleError(error, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should include resource name in message", () => {
      const res = createMockRes();
      const error = new NotFoundError("Order");

      handleError(error, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Order not found" })
      );
    });

    it("should work with different resource names", () => {
      const resources = ["User", "Menu Item", "Reservation", "Review"];

      for (const resource of resources) {
        const res = createMockRes();
        const error = new NotFoundError(resource);

        handleError(error, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect((res.json as any).mock.calls[0][0].error).toBe(`${resource} not found`);
        vi.clearAllMocks();
      }
    });
  });

  describe("UnauthorizedError", () => {
    it("should return 401 status code", () => {
      const res = createMockRes();
      const error = new UnauthorizedError();

      handleError(error, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should use default message when none provided", () => {
      const res = createMockRes();
      const error = new UnauthorizedError();

      handleError(error, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Unauthorized" })
      );
    });

    it("should accept custom message", () => {
      const res = createMockRes();
      const error = new UnauthorizedError("Invalid token");

      handleError(error, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Invalid token" })
      );
    });
  });

  describe("ForbiddenError", () => {
    it("should return 403 status code", () => {
      const res = createMockRes();
      const error = new ForbiddenError();

      handleError(error, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it("should use default message when none provided", () => {
      const res = createMockRes();
      const error = new ForbiddenError();

      handleError(error, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Forbidden" })
      );
    });

    it("should accept custom message", () => {
      const res = createMockRes();
      const error = new ForbiddenError("Insufficient permissions");

      handleError(error, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: "Insufficient permissions" })
      );
    });
  });
});
