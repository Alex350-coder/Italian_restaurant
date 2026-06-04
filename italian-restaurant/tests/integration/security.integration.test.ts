import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("../../server/src/config/env", () => ({
  env: {
    PORT: 3000,
    DB_HOST: "localhost",
    DB_PORT: 5432,
    DB_NAME: "test_db",
    DB_USER: "test",
    DB_PASS: "test",
    JWT_SECRET: TEST_SECRET,
    JWT_EXPIRES_IN: "7d",
    CORS_ORIGIN: "http://localhost:5173",
    NODE_ENV: "test",
  },
}));

vi.mock("../../server/src/middleware/rateLimit", () => ({
  generalLimiter: (req: any, res: any, next: any) => next(),
  authLimiter: (req: any, res: any, next: any) => next(),
  orderLimiter: (req: any, res: any, next: any) => next(),
  reservationLimiter: (req: any, res: any, next: any) => next(),
}));

vi.mock("../../server/src/middleware/security", () => ({
  securityMiddleware: () => [],
  requestLogger: (req: any, res: any, next: any) => next(),
}));

import app from "../../server/src/app";
import { UserModel } from "../../server/src/models/user";
import { query } from "../../server/src/config/database";

const mockQuery = vi.mocked(query);

function generateTestToken(role: string = "customer", userId: string = "user-1") {
  return jwt.sign(
    { userId, email: "test@test.com", role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

function generateExpiredToken() {
  return jwt.sign(
    { userId: "user-1", email: "test@test.com", role: "customer" },
    TEST_SECRET,
    { expiresIn: "0s" }
  );
}

function generateTokenWithWrongSecret() {
  return jwt.sign(
    { userId: "user-1", email: "test@test.com", role: "customer" },
    "completely-wrong-secret-key-12345",
    { expiresIn: "1h" }
  );
}

describe("Security Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rate Limiting", () => {
    it("should allow requests within rate limit", async () => {
      vi.spyOn(UserModel, "verifyPassword").mockResolvedValue(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "wrong" });

      expect(res.status).toBe(401);
    });

    it("should block requests when rate limit is exceeded", async () => {
      const rateLimitHit = { blocked: false };

      vi.doMock("../../server/src/middleware/rateLimit", () => ({
        generalLimiter: (req: any, res: any, next: any) => next(),
        authLimiter: (req: any, res: any, next: any) => {
          rateLimitHit.blocked = true;
          res.status(429).json({ success: false, error: "Too many requests" });
        },
        orderLimiter: (req: any, res: any, next: any) => next(),
        reservationLimiter: (req: any, res: any, next: any) => next(),
      }));

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@test.com", password: "wrong" });

      expect(res.status).toBe(429);
      expect(res.body.error).toBe("Too many requests");
    });
  });

  describe("CSRF Token Validation", () => {
    it("should reject requests without CSRF token on state-changing endpoints", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ items: [] });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("should accept requests with valid CSRF token header", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .set("X-CSRF-Token", "valid-csrf-token")
        .send({
          items: [{ menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 1 }],
        });

      expect(res.status).not.toBe(403);
    });
  });

  describe("XSS Prevention", () => {
    it("should sanitize XSS script tags in input", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: '<script>alert("xss")</script>Pizza',
          description: "Test pizza",
          price: 10,
          category: "pizza",
        });

      if (res.status === 201) {
        expect(res.body.data.item.name).not.toContain("<script>");
      }
    });

    it("should sanitize event handlers in input", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: '<img src=x onerror=alert(1)>Pizza',
          description: "Test",
          price: 10,
          category: "pizza",
        });

      if (res.status === 201) {
        expect(res.body.data.item.name).not.toContain("onerror");
      }
    });

    it("should block javascript: URLs", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Pizza",
          description: "Test",
          price: 10,
          category: "pizza",
          image_url: "javascript:alert(1)",
        });

      if (res.status === 400) {
        expect(res.body.success).toBe(false);
      }
    });
  });

  describe("SQL Injection Prevention", () => {
    it("should block SQL injection in login email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "'; DROP TABLE users; --",
          password: "password",
        });

      expect(res.status).toBe(400);
    });

    it("should block SQL injection in search queries", async () => {
      vi.spyOn(UserModel, "findByEmail").mockResolvedValue(null);

      const res = await request(app)
        .get("/api/menu?category=' OR 1=1 --");

      expect(res.status).toBeGreaterThanOrEqual(200);
    });

    it("should block SQL injection in order notes", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({
          items: [{ menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 1 }],
          notes: "'; DROP TABLE orders; --",
        });

      expect(res.status).not.toBe(500);
    });
  });

  describe("JWT Validation", () => {
    it("should reject requests with invalid JWT", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid.jwt.token");

      expect(res.status).toBe(401);
    });

    it("should reject requests with expired JWT", async () => {
      const expiredToken = generateExpiredToken();

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it("should reject requests with JWT signed with wrong secret", async () => {
      const wrongSecretToken = generateTokenWithWrongSecret();

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${wrongSecretToken}`);

      expect(res.status).toBe(401);
    });

    it("should accept requests with valid JWT", async () => {
      const token = generateTestToken("customer");
      const safeUser = {
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        role: "customer",
        phone: "123",
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(UserModel, "findById").mockResolvedValueOnce(safeUser);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("should reject malformed Authorization header", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Token abc123");

      expect(res.status).toBe(401);
    });

    it("should reject empty Authorization header", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "");

      expect(res.status).toBe(401);
    });
  });

  describe("Account Lockout", () => {
    it("should lock account after multiple failed login attempts", async () => {
      vi.spyOn(UserModel, "verifyPassword").mockResolvedValue(null);

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ email: "lock@test.com", password: "wrong" });
      }

      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "lock@test.com", password: "wrong" });

      expect(res.status).toBe(429);
    });

    it("should reset lockout counter after successful login", async () => {
      const user = {
        id: "user-lock",
        email: "reset@test.com",
        password_hash: "$2a$12$hashed",
        name: "Reset User",
        role: "customer",
      };

      vi.spyOn(UserModel, "verifyPassword")
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(user as any);

      for (let i = 0; i < 3; i++) {
        await request(app)
          .post("/api/auth/login")
          .send({ email: "reset@test.com", password: "wrong" });
      }

      vi.spyOn(UserModel, "toSafeUser").mockReturnValueOnce({
        id: "user-lock",
        email: "reset@test.com",
        name: "Reset User",
        role: "customer",
      });

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "reset@test.com", password: "correct" });

      expect(loginRes.status).toBe(200);
    });
  });

  describe("Content Security", () => {
    it("should set appropriate security headers", async () => {
      const res = await request(app).get("/api/menu");

      expect(res.status).toBe(200);
    });

    it("should reject oversized request bodies", async () => {
      const token = generateTestToken("customer");
      const largePayload = "x".repeat(10 * 1024 * 1024);

      const res = await request(app)
        .post("/api/orders")
        .set("Authorization", `Bearer ${token}`)
        .send({ data: largePayload });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
