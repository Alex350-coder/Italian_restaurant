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
import { query } from "../../server/src/config/database";

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";
const mockQuery = vi.mocked(query);

function makeNotification(overrides: any = {}) {
  return {
    id: "notif-uuid-1",
    user_id: "user-1",
    type: "order_update",
    title: "Order Confirmed",
    message: "Your order has been confirmed",
    is_read: false,
    created_at: new Date("2026-06-01"),
    ...overrides,
  };
}

function generateTestToken(role: string = "customer", userId: string = "user-1") {
  return jwt.sign(
    { userId, email: "test@test.com", role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Notifications Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/notifications", () => {
    it("should return user notifications", async () => {
      const token = generateTestToken("customer");
      const notifications = [
        makeNotification({ id: "n1", title: "Order Confirmed" }),
        makeNotification({ id: "n2", title: "Reservation Reminder", is_read: true }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: notifications,
        rowCount: 2,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(2);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/notifications");

      expect(res.status).toBe(401);
    });

    it("should return empty array when no notifications", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications).toEqual([]);
    });

    it("should only return notifications for authenticated user", async () => {
      const token = generateTestToken("customer", "user-1");

      mockQuery.mockResolvedValueOnce({
        rows: [makeNotification({ user_id: "user-1" })],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/notifications")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("user_id"),
        expect.arrayContaining(["user-1"])
      );
    });
  });

  describe("GET /api/notifications/unread-count", () => {
    it("should return unread notification count", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "5" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(5);
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/notifications/unread-count");

      expect(res.status).toBe(401);
    });

    it("should return 0 when no unread notifications", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "0" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/notifications/unread-count")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });
  });

  describe("PUT /api/notifications/:id/read", () => {
    it("should mark a notification as read", async () => {
      const token = generateTestToken("customer");
      const notification = makeNotification({ is_read: false });

      mockQuery.mockResolvedValueOnce({
        rows: [{ ...notification, is_read: true }],
        rowCount: 1,
        oid: 0,
        command: "UPDATE",
      });

      const res = await request(app)
        .put("/api/notifications/notif-uuid-1/read")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app).put("/api/notifications/notif-uuid-1/read");

      expect(res.status).toBe(401);
    });

    it("should return 404 when notification not found", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "UPDATE",
      });

      const res = await request(app)
        .put("/api/notifications/nonexistent/read")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("PUT /api/notifications/read-all", () => {
    it("should mark all notifications as read", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 5,
        oid: 0,
        command: "UPDATE",
      });

      const res = await request(app)
        .put("/api/notifications/read-all")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain("read");
    });

    it("should require authentication", async () => {
      const res = await request(app).put("/api/notifications/read-all");

      expect(res.status).toBe(401);
    });

    it("should succeed even with no unread notifications", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "UPDATE",
      });

      const res = await request(app)
        .put("/api/notifications/read-all")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("should delete a notification", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        oid: 0,
        command: "DELETE",
      });

      const res = await request(app)
        .delete("/api/notifications/notif-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app).delete("/api/notifications/notif-uuid-1");

      expect(res.status).toBe(401);
    });

    it("should return 404 when notification not found", async () => {
      const token = generateTestToken("customer");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "DELETE",
      });

      const res = await request(app)
        .delete("/api/notifications/nonexistent")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
