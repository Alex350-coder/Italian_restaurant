import { describe, it, expect, vi } from "vitest";

class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

class ValidationError extends AppError {
  public details: any;

  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, "NOT_FOUND");
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden") {
    super(message, 403, "FORBIDDEN");
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

class ConflictError extends AppError {
  constructor(message: string = "Resource already exists") {
    super(message, 409, "CONFLICT");
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

class TooManyRequestsError extends AppError {
  constructor(message: string = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

class InternalServerError extends AppError {
  constructor(message: string = "Internal server error") {
    super(message, 500, "INTERNAL_ERROR");
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

describe("Error Classes", () => {
  describe("AppError", () => {
    it("should create error with correct structure", () => {
      const error = new AppError("Test error", 500);

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
    });

    it("should preserve error message", () => {
      const error = new AppError("Custom message", 400);

      expect(error.message).toBe("Custom message");
    });

    it("should set code when provided", () => {
      const error = new AppError("Error", 400, "CUSTOM_CODE");

      expect(error.code).toBe("CUSTOM_CODE");
    });

    it("should have undefined code when not provided", () => {
      const error = new AppError("Error", 400);

      expect(error.code).toBeUndefined();
    });

    it("should capture stack trace", () => {
      const error = new AppError("Error", 400);

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("Error");
    });
  });

  describe("ValidationError", () => {
    it("should have status code 400", () => {
      const error = new ValidationError("Invalid input");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    it("should preserve error message", () => {
      const error = new ValidationError("Email is required");

      expect(error.message).toBe("Email is required");
    });

    it("should include details when provided", () => {
      const details = { field: "email", issue: "invalid format" };
      const error = new ValidationError("Validation failed", details);

      expect(error.details).toEqual(details);
    });

    it("should have undefined details when not provided", () => {
      const error = new ValidationError("Validation failed");

      expect(error.details).toBeUndefined();
    });

    it("should be instance of AppError", () => {
      const error = new ValidationError("Test");

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(ValidationError);
    });
  });

  describe("NotFoundError", () => {
    it("should have status code 404", () => {
      const error = new NotFoundError("Menu item");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });

    it("should include resource name in message", () => {
      const error = new NotFoundError("Order");

      expect(error.message).toBe("Order not found");
    });

    it("should work with different resource names", () => {
      expect(new NotFoundError("User").message).toBe("User not found");
      expect(new NotFoundError("Reservation").message).toBe("Reservation not found");
      expect(new NotFoundError("Review").message).toBe("Review not found");
    });

    it("should be instance of AppError", () => {
      const error = new NotFoundError("Test");

      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe("UnauthorizedError", () => {
    it("should have status code 401", () => {
      const error = new UnauthorizedError();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });

    it("should use default message", () => {
      const error = new UnauthorizedError();

      expect(error.message).toBe("Unauthorized");
    });

    it("should accept custom message", () => {
      const error = new UnauthorizedError("Invalid token");

      expect(error.message).toBe("Invalid token");
    });
  });

  describe("ForbiddenError", () => {
    it("should have status code 403", () => {
      const error = new ForbiddenError();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });

    it("should use default message", () => {
      const error = new ForbiddenError();

      expect(error.message).toBe("Forbidden");
    });

    it("should accept custom message", () => {
      const error = new ForbiddenError("Insufficient permissions");

      expect(error.message).toBe("Insufficient permissions");
    });
  });

  describe("ConflictError", () => {
    it("should have status code 409", () => {
      const error = new ConflictError();

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
    });

    it("should use default message", () => {
      const error = new ConflictError();

      expect(error.message).toBe("Resource already exists");
    });

    it("should accept custom message", () => {
      const error = new ConflictError("Email already registered");

      expect(error.message).toBe("Email already registered");
    });
  });

  describe("TooManyRequestsError", () => {
    it("should have status code 429", () => {
      const error = new TooManyRequestsError();

      expect(error.statusCode).toBe(429);
      expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("should use default message", () => {
      const error = new TooManyRequestsError();

      expect(error.message).toBe("Too many requests");
    });

    it("should accept custom message", () => {
      const error = new TooManyRequestsError("Slow down");

      expect(error.message).toBe("Slow down");
    });
  });

  describe("InternalServerError", () => {
    it("should have status code 500", () => {
      const error = new InternalServerError();

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_ERROR");
    });

    it("should use default message", () => {
      const error = new InternalServerError();

      expect(error.message).toBe("Internal server error");
    });

    it("should accept custom message", () => {
      const error = new InternalServerError("Database connection failed");

      expect(error.message).toBe("Database connection failed");
    });
  });
});
