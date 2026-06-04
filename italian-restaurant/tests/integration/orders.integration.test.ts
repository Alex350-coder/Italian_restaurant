import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
  transaction: vi.fn((cb: Function) => {
    const mockClient = { query: vi.fn() };
    return cb(mockClient);
  }),
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
import { OrderModel } from "../../server/src/models/order";
import { query } from "../../server/src/config/database";

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";
const mockQuery = vi.mocked(query);

function makeOrder(overrides: any = {}) {
  return {
    id: "order-uuid-1",
    user_id: "user-1",
    status: "pending",
    total: 25.0,
    notes: "Extra napkins",
    created_at: new Date("2026-06-01"),
    updated_at: new Date("2026-06-01"),
    ...overrides,
  };
}

function makeOrderItem(overrides: any = {}) {
  return {
    id: "item-uuid-1",
    order_id: "order-uuid-1",
    menu_item_id: "menu-uuid-1",
    quantity: 2,
    unit_price: 12.5,
    subtotal: 25.0,
    ...overrides,
  };
}

function makeOrderWithItems(overrides: any = {}) {
  const order = makeOrder(overrides);
  return {
    ...order,
    items: [makeOrderItem({ order_id: order.id })],
  };
}

function generateTestToken(role: string = "customer", userId: string = "user-1") {
  return jwt.sign(
    { userId, email: "test@test.com", role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Orders Integration Tests (Enhanced)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/orders/:id/pay", () => {
    it("should process payment for an order", async () => {
      const token = generateTestToken("customer");
      const order = makeOrderWithItems({ status: "pending" });

      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(order);
      vi.spyOn(OrderModel, "updateStatus").mockResolvedValueOnce(
        makeOrder({ status: "confirmed" })
      );

      const res = await request(app)
        .post("/api/orders/order-uuid-1/pay")
        .set("Authorization", `Bearer ${token}`)
        .send({ payment_method_id: "pm_card_visa" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/orders/order-uuid-1/pay")
        .send({ payment_method_id: "pm_card_visa" });

      expect(res.status).toBe(401);
    });

    it("should return 404 when order does not exist", async () => {
      const token = generateTestToken("customer");
      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/orders/nonexistent/pay")
        .set("Authorization", `Bearer ${token}`)
        .send({ payment_method_id: "pm_card_visa" });

      expect(res.status).toBe(404);
    });

    it("should reject payment for already paid order", async () => {
      const token = generateTestToken("customer");
      const order = makeOrderWithItems({ status: "confirmed" });

      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(order);

      const res = await request(app)
        .post("/api/orders/order-uuid-1/pay")
        .set("Authorization", `Bearer ${token}`)
        .send({ payment_method_id: "pm_card_visa" });

      expect(res.status).toBe(400);
    });

    it("should return 400 when payment method is missing", async () => {
      const token = generateTestToken("customer");
      const order = makeOrderWithItems({ status: "pending" });

      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(order);

      const res = await request(app)
        .post("/api/orders/order-uuid-1/pay")
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/orders/:id/cancel", () => {
    it("should cancel an order", async () => {
      const token = generateTestToken("customer");
      const order = makeOrderWithItems({ status: "pending" });

      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(order);
      vi.spyOn(OrderModel, "updateStatus").mockResolvedValueOnce(
        makeOrder({ status: "cancelled" })
      );

      const res = await request(app)
        .post("/api/orders/order-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/orders/order-uuid-1/cancel");

      expect(res.status).toBe(401);
    });

    it("should return 404 when order does not exist", async () => {
      const token = generateTestToken("customer");
      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .post("/api/orders/nonexistent/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("should not allow cancelling delivered order", async () => {
      const token = generateTestToken("customer");
      const order = makeOrderWithItems({ status: "delivered" });

      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(order);

      const res = await request(app)
        .post("/api/orders/order-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it("should not allow customer to cancel another user's order", async () => {
      const token = generateTestToken("customer", "user-1");
      const order = makeOrderWithItems({ user_id: "user-2", status: "pending" });

      vi.spyOn(OrderModel, "findById").mockResolvedValueOnce(order);

      const res = await request(app)
        .post("/api/orders/order-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/orders/stats", () => {
    it("should return order statistics for admin", async () => {
      const token = generateTestToken("admin");

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ total_orders: "150", total_revenue: "4500.00" }],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [
            { status: "pending", count: "12" },
            { status: "confirmed", count: "25" },
            { status: "preparing", count: "8" },
            { status: "ready", count: "5" },
            { status: "delivered", count: "95" },
            { status: "cancelled", count: "5" },
          ],
          rowCount: 6,
          oid: 0,
          command: "SELECT",
        });

      const res = await request(app)
        .get("/api/orders/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .get("/api/orders/stats")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .get("/api/orders/stats");

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/orders/today", () => {
    it("should return today's orders for admin", async () => {
      const token = generateTestToken("admin");
      const todayOrders = [
        makeOrderWithItems({ id: "today-1", status: "preparing" }),
        makeOrderWithItems({ id: "today-2", status: "ready" }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: todayOrders.map((o) => ({ ...o })),
        rowCount: 2,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/orders/today")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .get("/api/orders/today")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .get("/api/orders/today");

      expect(res.status).toBe(401);
    });

    it("should return empty array when no orders today", async () => {
      const token = generateTestToken("admin");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/orders/today")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe("GET /api/orders (admin view)", () => {
    it("should return all orders when admin is authenticated", async () => {
      const token = generateTestToken("admin", "admin-1");
      const orders = [
        makeOrderWithItems({ id: "order-1" }),
        makeOrderWithItems({ id: "order-2", status: "confirmed" }),
      ];

      mockQuery
        .mockResolvedValueOnce({
          rows: orders.map((o) => ({ ...o })),
          rowCount: 2,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [makeOrderItem({ order_id: "order-1" })],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [makeOrderItem({ order_id: "order-2" })],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        });

      const res = await request(app)
        .get("/api/orders")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
