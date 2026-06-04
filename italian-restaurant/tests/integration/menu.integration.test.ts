import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
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
import { MenuItemModel } from "../../server/src/models/menuItem";

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";

function makeMenuItem(overrides: any = {}) {
  return {
    id: "menu-uuid-1",
    name: "Pizza Margherita",
    description: "Classic tomato, mozzarella, basil",
    price: 12.5,
    category: "pizza",
    image_url: "https://images.example.com/margherita.jpg",
    is_available: true,
    is_deleted: false,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

function generateTestToken(role: string = "customer") {
  return jwt.sign(
    { userId: "user-1", email: "test@test.com", role },
    TEST_SECRET,
    { expiresIn: "1h" }
  );
}

describe("Menu Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/menu", () => {
    it("should return all menu items", async () => {
      const items = [
        makeMenuItem({ id: "1", name: "Margherita", category: "pizza" }),
        makeMenuItem({ id: "2", name: "Carbonara", category: "pasta" }),
        makeMenuItem({ id: "3", name: "Tiramisu", category: "desserts" }),
      ];

      vi.spyOn(MenuItemModel, "findAll").mockResolvedValueOnce(items);

      const res = await request(app).get("/api/menu");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(3);
      expect(res.body.data.items[0].name).toBe("Margherita");
    });

    it("should filter by category when query param is provided", async () => {
      const pizzaItems = [
        makeMenuItem({ id: "1", name: "Margherita", category: "pizza" }),
        makeMenuItem({ id: "2", name: "Diavola", category: "pizza" }),
      ];

      vi.spyOn(MenuItemModel, "findAll").mockResolvedValueOnce(pizzaItems);

      const res = await request(app).get("/api/menu?category=pizza");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toHaveLength(2);
      expect(MenuItemModel.findAll).toHaveBeenCalledWith({ category: "pizza" });
    });

    it("should return empty array when no items match", async () => {
      vi.spyOn(MenuItemModel, "findAll").mockResolvedValueOnce([]);

      const res = await request(app).get("/api/menu?category=nonexistent");

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });

    it("should not require authentication", async () => {
      vi.spyOn(MenuItemModel, "findAll").mockResolvedValueOnce([]);

      const res = await request(app).get("/api/menu");

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/menu/:id", () => {
    it("should return a single menu item by id", async () => {
      const item = makeMenuItem();

      vi.spyOn(MenuItemModel, "findById").mockResolvedValueOnce(item);

      const res = await request(app).get("/api/menu/menu-uuid-1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.name).toBe("Pizza Margherita");
    });

    it("should return 404 when item is not found", async () => {
      vi.spyOn(MenuItemModel, "findById").mockResolvedValueOnce(null);

      const res = await request(app).get("/api/menu/nonexistent-id");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe("Menu item not found");
    });
  });

  describe("POST /api/menu", () => {
    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/menu")
        .send({
          name: "New Pizza",
          description: "A new pizza",
          price: 10,
          category: "pizza",
        });

      expect(res.status).toBe(401);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Pizza",
          description: "A new pizza",
          price: 10,
          category: "pizza",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("Insufficient permissions");
    });

    it("should create a menu item when admin is authenticated", async () => {
      const token = generateTestToken("admin");
      const newItem = makeMenuItem({ id: "new-id", name: "New Pizza" });

      vi.spyOn(MenuItemModel, "create").mockResolvedValueOnce(newItem);

      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "New Pizza",
          description: "A new pizza",
          price: 10.0,
          category: "pizza",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.name).toBe("New Pizza");
    });

    it("should return 400 for invalid menu item data", async () => {
      const token = generateTestToken("admin");

      const res = await request(app)
        .post("/api/menu")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "",
          price: -5,
        });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/menu/:id", () => {
    it("should require authentication", async () => {
      const res = await request(app)
        .put("/api/menu/menu-uuid-1")
        .send({ name: "Updated" });

      expect(res.status).toBe(401);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .put("/api/menu/menu-uuid-1")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Pizza",
          description: "Updated",
          price: 15,
          category: "pizza",
        });

      expect(res.status).toBe(403);
    });

    it("should update a menu item when admin is authenticated", async () => {
      const token = generateTestToken("admin");
      const updatedItem = makeMenuItem({ name: "Updated Margherita", price: 14.0 });

      vi.spyOn(MenuItemModel, "update").mockResolvedValueOnce(updatedItem);

      const res = await request(app)
        .put("/api/menu/menu-uuid-1")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Margherita",
          description: "Classic tomato, mozzarella, basil",
          price: 14.0,
          category: "pizza",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.item.name).toBe("Updated Margherita");
    });

    it("should return 404 when updating non-existent item", async () => {
      const token = generateTestToken("admin");

      vi.spyOn(MenuItemModel, "update").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/menu/nonexistent-id")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated",
          description: "Updated",
          price: 10,
          category: "pizza",
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Menu item not found");
    });
  });

  describe("DELETE /api/menu/:id", () => {
    it("should require authentication", async () => {
      const res = await request(app).delete("/api/menu/menu-uuid-1");

      expect(res.status).toBe(401);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .delete("/api/menu/menu-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should soft delete a menu item when admin is authenticated", async () => {
      const token = generateTestToken("admin");

      vi.spyOn(MenuItemModel, "delete").mockResolvedValueOnce(true);

      const res = await request(app)
        .delete("/api/menu/menu-uuid-1")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toBe("Menu item deleted");
    });

    it("should return 404 when deleting non-existent item", async () => {
      const token = generateTestToken("admin");

      vi.spyOn(MenuItemModel, "delete").mockResolvedValueOnce(false);

      const res = await request(app)
        .delete("/api/menu/nonexistent-id")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
