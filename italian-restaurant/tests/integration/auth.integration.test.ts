import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

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
    JWT_SECRET: "test-secret-key-for-jwt-minimum-16",
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
import { query } from "../../server/src/config/database";
import { UserModel } from "../../server/src/models/user";

const mockQuery = vi.mocked(query);
const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";

function makeUser(overrides: any = {}) {
  return {
    id: "user-uuid-1",
    email: "mario.rossi@example.com",
    password_hash: "$2a$12$hashedpasswordvalue",
    name: "Mario Rossi",
    phone: "+39 333 1234567",
    role: "customer",
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

function makeSafeUser(overrides: any = {}) {
  const user = makeUser(overrides);
  const { password_hash, ...safe } = user;
  return safe;
}

function generateTestToken(user: { id: string; email: string; role: string }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Auth Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should create a new user and return user + token", async () => {
      const safeUser = makeSafeUser();
      const createdUser = makeUser();

      vi.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(null);
      vi.spyOn(UserModel, "create").mockResolvedValueOnce(safeUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "mario.rossi@example.com",
          password: "Mario123!",
          name: "Mario Rossi",
          phone: "+39 333 1234567",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("mario.rossi@example.com");
      expect(res.body.data.user.name).toBe("Mario Rossi");
      expect(res.body.data.user).not.toHaveProperty("password_hash");
      expect(res.body.data.token).toBeDefined();
      expect(typeof res.body.data.token).toBe("string");
    });

    it("should return 409 when email is already registered", async () => {
      const existingUser = makeUser();
      vi.spyOn(UserModel, "findByEmail").mockResolvedValueOnce(existingUser);

      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "mario.rossi@example.com",
          password: "Mario123!",
          name: "Mario Rossi",
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Email already registered");
    });

    it("should return 400 for invalid registration data", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "invalid",
          password: "weak",
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Validation failed");
    });

    it("should return 400 when email is missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          password: "Password1!",
          name: "Test",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when password is too short", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({
          email: "test@test.com",
          password: "Ab1",
          name: "Test",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return a token when credentials are valid", async () => {
      const user = makeUser();
      const safeUser = makeSafeUser();

      vi.spyOn(UserModel, "verifyPassword").mockResolvedValueOnce(user);
      vi.spyOn(UserModel, "toSafeUser").mockReturnValueOnce(safeUser);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "mario.rossi@example.com",
          password: "Mario123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("mario.rossi@example.com");
      expect(res.body.data.user).not.toHaveProperty("password_hash");
      expect(res.body.data.token).toBeDefined();
    });

    it("should return 401 when credentials are invalid", async () => {
      vi.spyOn(UserModel, "verifyPassword").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "mario.rossi@example.com",
          password: "WrongPassword!",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Invalid email or password");
    });

    it("should return 400 for invalid login data", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({
          email: "not-an-email",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return the authenticated user", async () => {
      const user = makeUser();
      const safeUser = makeSafeUser();
      const token = generateTestToken({ id: user.id, email: user.email, role: user.role });

      vi.spyOn(UserModel, "findById").mockResolvedValueOnce(safeUser);

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe("mario.rossi@example.com");
      expect(res.body.data.user).not.toHaveProperty("password_hash");
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should return 401 when token is expired", async () => {
      const expiredToken = jwt.sign(
        { userId: "user-1", email: "test@test.com", role: "customer" },
        TEST_SECRET,
        { expiresIn: "0s" }
      );

      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });
});
