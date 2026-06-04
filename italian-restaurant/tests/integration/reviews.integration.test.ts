import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
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

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";

function generateTestToken(role: string = "customer", userId: string = "user-1") {
  return jwt.sign(
    { userId, email: "test@test.com", role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

function makeReview(overrides: any = {}) {
  return {
    id: "rev-uuid-1",
    user_id: "user-1",
    menu_item_id: "menu-uuid-1",
    rating: 5,
    comment: "Excellent pasta!",
    created_at: new Date("2026-06-01"),
    updated_at: new Date("2026-06-01"),
    ...overrides,
  };
}

describe("Reviews Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/reviews", () => {
    it("should create a review when authenticated", async () => {
      const token = generateTestToken("customer");
      const review = makeReview();

      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          menu_item_id: "menu-uuid-1",
          rating: 5,
          comment: "Excellent pasta!",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/reviews")
        .send({
          menu_item_id: "menu-uuid-1",
          rating: 5,
          comment: "Great!",
        });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid rating", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          menu_item_id: "menu-uuid-1",
          rating: 6,
          comment: "Too good!",
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for missing comment", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          menu_item_id: "menu-uuid-1",
          rating: 5,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 for missing menu_item_id", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/reviews")
        .set("Authorization", `Bearer ${token}`)
        .send({
          rating: 5,
          comment: "Great!",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/reviews/:menuItemId", () => {
    it("should return reviews for a menu item", async () => {
      const reviews = [
        makeReview({ id: "rev-1", rating: 5 }),
        makeReview({ id: "rev-2", rating: 4, user_id: "user-2", comment: "Very good" }),
      ];

      const res = await request(app)
        .get("/api/reviews/menu-uuid-1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should not require authentication to view reviews", async () => {
      const res = await request(app)
        .get("/api/reviews/menu-uuid-1");

      expect(res.status).toBe(200);
    });

    it("should return 400 for invalid menu item ID", async () => {
      const res = await request(app)
        .get("/api/reviews/invalid-id");

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/reviews/:id", () => {
    it("should update review when user is the owner", async () => {
      const token = generateTestToken("customer", "user-1");

      const res = await request(app)
        .put("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 4, comment: "Updated review" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .put("/api/reviews/rev-uuid-1")
        .send({ rating: 4 });

      expect(res.status).toBe(401);
    });

    it("should return 403 when user is not the owner", async () => {
      const token = generateTestToken("customer", "other-user");

      const res = await request(app)
        .put("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 4 });

      expect(res.status).toBe(403);
    });

    it("should return 400 for invalid rating on update", async () => {
      const token = generateTestToken("customer", "user-1");

      const res = await request(app)
        .put("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ rating: 0 });

      expect(res.status).toBe(400);
    });

    it("should allow partial updates", async () => {
      const token = generateTestToken("customer", "user-1");

      const res = await request(app)
        .put("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`)
        .send({ comment: "Only updated comment" });

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    it("should delete review when user is the owner", async () => {
      const token = generateTestToken("customer", "user-1");

      const res = await request(app)
        .delete("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should delete review when user is admin", async () => {
      const token = generateTestToken("admin", "admin-1");

      const res = await request(app)
        .delete("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .delete("/api/reviews/rev-uuid-1");

      expect(res.status).toBe(401);
    });

    it("should return 403 when non-owner non-admin tries to delete", async () => {
      const token = generateTestToken("customer", "other-user");

      const res = await request(app)
        .delete("/api/reviews/rev-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 when review does not exist", async () => {
      const token = generateTestToken("customer", "user-1");

      const res = await request(app)
        .delete("/api/reviews/nonexistent")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
