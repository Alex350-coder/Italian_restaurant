import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import {
  validate,
  registerSchema,
  loginSchema,
  createOrderSchema,
  createReservationSchema,
  menuItemSchema,
  updateOrderStatusSchema,
} from "../../server/src/middleware/validation";

function createMockReq(body: any = {}, query: any = {}, params: any = {}): Request {
  return {
    body,
    query,
    params,
  } as unknown as Request;
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

describe("Validation Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validate (general middleware)", () => {
    it("should call next when validation passes", () => {
      const req = createMockReq(
        { email: "test@test.com", password: "Password123!@", name: "Test" },
        {},
        {}
      );
      const res = createMockRes();
      const next = createMockNext();

      const middleware = validate(registerSchema);
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 400 with error details when validation fails", () => {
      const req = createMockReq({ email: "bad" });
      const res = createMockRes();
      const next = createMockNext();

      const middleware = validate(registerSchema);
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "Validation failed",
          details: expect.any(Object),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const req = createMockReq(
        { email: "mario@example.com", password: "MarioRossi123!@", name: "Mario Rossi" },
        {},
        {}
      );
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.body.email).toBe("mario@example.com");
      expect(req.body.name).toBe("Mario Rossi");
    });

    it("should accept registration with optional phone", () => {
      const req = createMockReq(
        { email: "mario@example.com", password: "MarioRossi123!@", name: "Mario", phone: "+39 333 1234567" },
        {},
        {}
      );
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid email format", () => {
      const req = createMockReq({
        email: "not-an-email",
        password: "Password1!",
        name: "Test",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      const callArgs = (res.json as any).mock.calls[0][0];
      expect(callArgs.details).toBeDefined();
    });

    it("should reject password shorter than 8 characters", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "Ab1",
        name: "Test",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject password without uppercase letter", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "lowercase1!",
        name: "Test",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject password without lowercase letter", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "UPPERCASE1!",
        name: "Test",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject password without number", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "NoNumberHere!",
        name: "Test",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject name shorter than 2 characters", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "Password1!",
        name: "A",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject name longer than 100 characters", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "Password1!",
        name: "A".repeat(101),
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing required fields", () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = createMockNext();

      validate(registerSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(loginSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid email", () => {
      const req = createMockReq({
        email: "invalid",
        password: "password123",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(loginSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing password", () => {
      const req = createMockReq({
        email: "test@test.com",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(loginSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject empty password", () => {
      const req = createMockReq({
        email: "test@test.com",
        password: "",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(loginSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("createOrderSchema", () => {
    it("should accept valid order data", () => {
      const req = createMockReq({
        items: [
          { menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 },
        ],
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should accept order with notes", () => {
      const req = createMockReq({
        items: [
          { menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 1 },
        ],
        notes: "No onions please",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should accept order with multiple items", () => {
      const req = createMockReq({
        items: [
          { menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 2 },
          { menu_item_id: "6ba7b810-9dad-11d1-80b4-00c04fd430c8", quantity: 1 },
        ],
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject order with no items", () => {
      const req = createMockReq({ items: [] });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject item with invalid UUID", () => {
      const req = createMockReq({
        items: [{ menu_item_id: "not-a-uuid", quantity: 1 }],
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject item with zero quantity", () => {
      const req = createMockReq({
        items: [{ menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: 0 }],
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject item with negative quantity", () => {
      const req = createMockReq({
        items: [{ menu_item_id: "550e8400-e29b-41d4-a716-446655440000", quantity: -1 }],
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing items field", () => {
      const req = createMockReq({ notes: "test" });
      const res = createMockRes();
      const next = createMockNext();

      validate(createOrderSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("createReservationSchema", () => {
    it("should accept valid reservation data", () => {
      const req = createMockReq({
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 4,
        name: "Mario Rossi",
        phone: "+39 333 1234567",
        email: "mario@example.com",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should accept reservation with notes", () => {
      const req = createMockReq({
        reservation_date: "2026-07-15",
        reservation_time: "20:00",
        party_size: 2,
        name: "Luca",
        phone: "+39 333 1111111",
        email: "luca@example.com",
        notes: "High chair needed",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject invalid date format (not YYYY-MM-DD)", () => {
      const req = createMockReq({
        reservation_date: "15-07-2026",
        reservation_time: "19:00",
        party_size: 4,
        name: "Test",
        phone: "123",
        email: "test@test.com",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject invalid time format (not HH:MM)", () => {
      const req = createMockReq({
        reservation_date: "2026-07-15",
        reservation_time: "7pm",
        party_size: 4,
        name: "Test",
        phone: "123",
        email: "test@test.com",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject party size of 0", () => {
      const req = createMockReq({
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 0,
        name: "Test",
        phone: "123",
        email: "test@test.com",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject party size over 20", () => {
      const req = createMockReq({
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 21,
        name: "Test",
        phone: "123",
        email: "test@test.com",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing email", () => {
      const req = createMockReq({
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 4,
        name: "Test",
        phone: "123",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing required fields", () => {
      const req = createMockReq({});
      const res = createMockRes();
      const next = createMockNext();

      validate(createReservationSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("menuItemSchema", () => {
    it("should accept valid menu item data", () => {
      const req = createMockReq({
        name: "Pizza Margherita",
        description: "Classic tomato, mozzarella, basil",
        price: 12.5,
        category: "pizza",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should accept menu item with optional fields", () => {
      const req = createMockReq({
        name: "Pizza Diavola",
        description: "Spicy salami pizza",
        price: 14.0,
        category: "pizza",
        image_url: "https://example.com/diavola.jpg",
        is_available: true,
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should reject empty name", () => {
      const req = createMockReq({
        name: "",
        description: "Test",
        price: 10,
        category: "pizza",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject negative price", () => {
      const req = createMockReq({
        name: "Test",
        description: "Test",
        price: -5,
        category: "pizza",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject zero price", () => {
      const req = createMockReq({
        name: "Test",
        description: "Test",
        price: 0,
        category: "pizza",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject invalid image_url", () => {
      const req = createMockReq({
        name: "Test",
        description: "Test",
        price: 10,
        category: "pizza",
        image_url: "not-a-url",
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject missing category", () => {
      const req = createMockReq({
        name: "Test",
        description: "Test",
        price: 10,
      });
      const res = createMockRes();
      const next = createMockNext();

      validate(menuItemSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe("updateOrderStatusSchema", () => {
    it("should accept valid status update", () => {
      const req = createMockReq(
        { status: "confirmed" },
        {},
        { id: "550e8400-e29b-41d4-a716-446655440000" }
      );
      const res = createMockRes();
      const next = createMockNext();

      validate(updateOrderStatusSchema)(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it("should accept all valid statuses", () => {
      const statuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];

      for (const status of statuses) {
        const req = createMockReq(
          { status },
          {},
          { id: "550e8400-e29b-41d4-a716-446655440000" }
        );
        const res = createMockRes();
        const next = createMockNext();

        validate(updateOrderStatusSchema)(req, res, next);
        expect(next).toHaveBeenCalled();
        vi.clearAllMocks();
      }
    });

    it("should reject invalid status", () => {
      const req = createMockReq(
        { status: "invalid_status" },
        {},
        { id: "550e8400-e29b-41d4-a716-446655440000" }
      );
      const res = createMockRes();
      const next = createMockNext();

      validate(updateOrderStatusSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should reject invalid order ID in params", () => {
      const req = createMockReq({ status: "confirmed" }, {}, { id: "not-a-uuid" });
      const res = createMockRes();
      const next = createMockNext();

      validate(updateOrderStatusSchema)(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
