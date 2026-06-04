import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  extractToken,
  verifyToken,
  attachUser,
  requireAuth,
  requireRole,
  generateToken,
  AuthRequest,
} from "../../server/src/middleware/auth";

vi.mock("../../server/src/config/env", () => ({
  env: {
    JWT_SECRET: "test-secret-key-for-jwt-minimum-16",
    JWT_EXPIRES_IN: "7d",
    NODE_ENV: "test",
  },
}));

vi.mock("../../server/src/models/user", () => ({
  UserModel: {
    findById: vi.fn(),
  },
}));

import { UserModel } from "../../server/src/models/user";

const mockFindById = vi.mocked(UserModel.findById);

function createMockReq(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    headers: {},
    user: undefined,
    ...overrides,
  } as unknown as AuthRequest;
}

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

function createMockNext(): NextFunction {
  return vi.fn() as unknown as NextFunction;
}

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extractToken", () => {
    it("should extract token from valid Bearer header", () => {
      const req = createMockReq({
        headers: { authorization: "Bearer abc123token" },
      });

      const token = extractToken(req);

      expect(token).toBe("abc123token");
    });

    it("should return null when authorization header is missing", () => {
      const req = createMockReq({ headers: {} });

      const token = extractToken(req);

      expect(token).toBeNull();
    });

    it("should return null when authorization header has wrong format (no Bearer prefix)", () => {
      const req = createMockReq({
        headers: { authorization: "abc123token" },
      });

      const token = extractToken(req);

      expect(token).toBeNull();
    });

    it("should return null when authorization header has wrong format (no space)", () => {
      const req = createMockReq({
        headers: { authorization: "Bearerabc123token" },
      });

      const token = extractToken(req);

      expect(token).toBeNull();
    });

    it("should return null when authorization header has extra parts", () => {
      const req = createMockReq({
        headers: { authorization: "Bearer token extra" },
      });

      const token = extractToken(req);

      expect(token).toBeNull();
    });

    it("should return null for empty string", () => {
      const req = createMockReq({
        headers: { authorization: "" },
      });

      const token = extractToken(req);

      expect(token).toBeNull();
    });
  });

  describe("verifyToken", () => {
    it("should decode a valid token", () => {
      const payload = { userId: "user-1", email: "test@test.com", role: "customer" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });

      const decoded = verifyToken(token);

      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("test@test.com");
      expect(decoded.role).toBe("customer");
    });

    it("should throw for an invalid token", () => {
      expect(() => verifyToken("invalid-token")).toThrow("Invalid or expired token");
    });

    it("should throw for an expired token", () => {
      const payload = { userId: "user-1", email: "test@test.com", role: "customer" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "0s" });

      expect(() => verifyToken(token)).toThrow("Invalid or expired token");
    });

    it("should throw for a token signed with wrong secret", () => {
      const payload = { userId: "user-1", email: "test@test.com", role: "customer" };
      const token = jwt.sign(payload, "wrong-secret-key-12345", { expiresIn: "1h" });

      expect(() => verifyToken(token)).toThrow("Invalid or expired token");
    });
  });

  describe("attachUser", () => {
    it("should attach user to request when valid token is present", async () => {
      const payload = { userId: "user-1", email: "test@test.com", role: "customer" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });

      const user = {
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        role: "customer",
        phone: "123",
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockFindById.mockResolvedValueOnce(user);

      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = createMockNext();

      await attachUser(req, res, next);

      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    it("should call next without attaching user when no token is present", async () => {
      const req = createMockReq({ headers: {} });
      const res = createMockRes();
      const next = createMockNext();

      await attachUser(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it("should call next without attaching user when token is invalid", async () => {
      const req = createMockReq({
        headers: { authorization: "Bearer invalid-token" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await attachUser(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it("should call next when user is not found in database", async () => {
      const payload = { userId: "user-1", email: "test@test.com", role: "customer" };
      const token = jwt.sign(payload, TEST_SECRET, { expiresIn: "1h" });

      mockFindById.mockResolvedValueOnce(null);

      const req = createMockReq({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockRes();
      const next = createMockNext();

      await attachUser(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });

    it("should not send error response on failure", async () => {
      const req = createMockReq({
        headers: { authorization: "Bearer garbage" },
      });
      const res = createMockRes();
      const next = createMockNext();

      await attachUser(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe("requireAuth", () => {
    it("should call next when user is attached", () => {
      const req = createMockReq({
        user: {
          id: "user-1",
          email: "test@test.com",
          name: "Test",
          role: "customer",
          phone: "123",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 401 when user is not attached", () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();
      const next = createMockNext();

      requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Authentication required" })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should call next when user has the required role", () => {
      const req = createMockReq({
        user: {
          id: "user-1",
          email: "admin@test.com",
          name: "Admin",
          role: "admin",
          phone: "123",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole("admin");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should call next when user has one of multiple allowed roles", () => {
      const req = createMockReq({
        user: {
          id: "user-1",
          email: "admin@test.com",
          name: "Admin",
          role: "admin",
          phone: "123",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole("admin", "staff");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should return 403 when user does not have the required role", () => {
      const req = createMockReq({
        user: {
          id: "user-1",
          email: "customer@test.com",
          name: "Customer",
          role: "customer",
          phone: "123",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole("admin");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: "Insufficient permissions" })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when no user is attached", () => {
      const req = createMockReq({ user: undefined });
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole("admin");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should reject customer when only admin is allowed", () => {
      const req = createMockReq({
        user: {
          id: "user-1",
          email: "c@test.com",
          name: "C",
          role: "customer",
          phone: "123",
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const res = createMockRes();
      const next = createMockNext();

      const middleware = requireRole("admin");
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const user = { id: "user-1", email: "test@test.com", role: "customer" };

      const token = generateToken(user);

      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });

    it("should generate a token that can be verified", () => {
      const user = { id: "user-1", email: "test@test.com", role: "customer" };

      const token = generateToken(user);
      const decoded = jwt.verify(token, TEST_SECRET) as any;

      expect(decoded.userId).toBe("user-1");
      expect(decoded.email).toBe("test@test.com");
      expect(decoded.role).toBe("customer");
    });

    it("should include expiration in the token", () => {
      const user = { id: "user-1", email: "test@test.com", role: "customer" };

      const token = generateToken(user);
      const decoded = jwt.verify(token, TEST_SECRET) as any;

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(decoded.iat);
    });
  });
});
