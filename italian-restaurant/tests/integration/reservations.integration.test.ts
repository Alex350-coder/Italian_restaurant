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
import { ReservationModel } from "../../server/src/models/reservation";
import { query } from "../../server/src/config/database";

const TEST_SECRET = "test-secret-key-for-jwt-minimum-16";
const mockQuery = vi.mocked(query);

function makeReservation(overrides: any = {}) {
  return {
    id: "res-uuid-1",
    user_id: "user-1",
    reservation_date: "2026-07-15",
    reservation_time: "19:00",
    party_size: 4,
    name: "Mario Rossi",
    phone: "+39 333 1234567",
    email: "mario@example.com",
    notes: "Window seat",
    status: "confirmed",
    created_at: new Date("2026-06-01"),
    updated_at: new Date("2026-06-01"),
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

describe("Reservations Integration Tests (Enhanced)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PUT /reservations/:id/confirm", () => {
    it("should confirm a reservation when admin", async () => {
      const token = generateTestToken("admin");
      const reservation = makeReservation({ status: "pending" });

      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(reservation);
      vi.spyOn(ReservationModel, "updateStatus").mockResolvedValueOnce(
        makeReservation({ status: "confirmed" })
      );

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/confirm")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .put("/api/reservations/res-uuid-1/confirm");

      expect(res.status).toBe(401);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/confirm")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 404 when reservation does not exist", async () => {
      const token = generateTestToken("admin");
      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/reservations/nonexistent/confirm")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it("should return 400 when reservation is already cancelled", async () => {
      const token = generateTestToken("admin");
      const reservation = makeReservation({ status: "cancelled" });

      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(reservation);

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/confirm")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /reservations/today", () => {
    it("should return today's reservations for admin", async () => {
      const token = generateTestToken("admin");
      const todayStr = new Date().toISOString().split("T")[0];

      mockQuery.mockResolvedValueOnce({
        rows: [makeReservation({ reservation_date: todayStr })],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/reservations/today")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should require admin role", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .get("/api/reservations/today")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .get("/api/reservations/today");

      expect(res.status).toBe(401);
    });

    it("should return empty array when no reservations today", async () => {
      const token = generateTestToken("admin");

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/reservations/today")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reservations).toEqual([]);
    });
  });

  describe("GET /reservations/availability", () => {
    it("should return available slots for a date", async () => {
      vi.spyOn(ReservationModel, "findAvailableSlots").mockResolvedValueOnce([
        { time: "18:00", date: "2026-07-15", available: true },
        { time: "18:30", date: "2026-07-15", available: true },
        { time: "19:00", date: "2026-07-15", available: false },
      ]);

      const res = await request(app)
        .get("/api/reservations/availability?date=2026-07-15");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slots).toHaveLength(3);
    });

    it("should return 400 when date is missing", async () => {
      const res = await request(app)
        .get("/api/reservations/availability");

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Date query parameter is required");
    });

    it("should handle edge case of fully booked date", async () => {
      vi.spyOn(ReservationModel, "findAvailableSlots").mockResolvedValueOnce([
        { time: "18:00", date: "2026-12-31", available: false },
        { time: "18:30", date: "2026-12-31", available: false },
        { time: "19:00", date: "2026-12-31", available: false },
        { time: "19:30", date: "2026-12-31", available: false },
        { time: "20:00", date: "2026-12-31", available: false },
        { time: "20:30", date: "2026-12-31", available: false },
        { time: "21:00", date: "2026-12-31", available: false },
      ]);

      const res = await request(app)
        .get("/api/reservations/availability?date=2026-12-31");

      expect(res.status).toBe(200);
      const availableSlots = res.body.data.slots.filter((s: any) => s.available);
      expect(availableSlots).toHaveLength(0);
    });

    it("should handle party size edge cases", async () => {
      vi.spyOn(ReservationModel, "findAvailableSlots").mockResolvedValueOnce([
        { time: "19:00", date: "2026-07-15", available: true },
      ]);

      const res = await request(app)
        .get("/api/reservations/availability?date=2026-07-15&party_size=1");

      expect(res.status).toBe(200);
    });

    it("should handle past dates gracefully", async () => {
      vi.spyOn(ReservationModel, "findAvailableSlots").mockResolvedValueOnce([]);

      const res = await request(app)
        .get("/api/reservations/availability?date=2020-01-01");

      expect(res.status).toBe(200);
      expect(res.body.data.slots).toEqual([]);
    });
  });

  describe("POST /reservations", () => {
    it("should create a reservation when authenticated", async () => {
      const token = generateTestToken("customer");
      const reservation = makeReservation();

      vi.spyOn(ReservationModel, "create").mockResolvedValueOnce(reservation);

      const res = await request(app)
        .post("/api/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          reservation_date: "2026-07-15",
          reservation_time: "19:00",
          party_size: 4,
          name: "Mario Rossi",
          phone: "+39 333 1234567",
          email: "mario@example.com",
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reservation.status).toBe("confirmed");
    });

    it("should require authentication", async () => {
      const res = await request(app)
        .post("/api/reservations")
        .send({
          reservation_date: "2026-07-15",
          reservation_time: "19:00",
          party_size: 4,
          name: "Mario",
          phone: "123",
          email: "mario@example.com",
        });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid data", async () => {
      const token = generateTestToken("customer");

      const res = await request(app)
        .post("/api/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          reservation_date: "invalid-date",
          party_size: 0,
        });

      expect(res.status).toBe(400);
    });

    it("should return 400 when time slot is not available", async () => {
      const token = generateTestToken("customer");

      vi.spyOn(ReservationModel, "create").mockRejectedValueOnce(
        new Error("Selected time slot is not available")
      );

      const res = await request(app)
        .post("/api/reservations")
        .set("Authorization", `Bearer ${token}`)
        .send({
          reservation_date: "2026-07-15",
          reservation_time: "19:00",
          party_size: 4,
          name: "Mario",
          phone: "123",
          email: "mario@example.com",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("not available");
    });
  });

  describe("PUT /reservations/:id/cancel", () => {
    it("should cancel own reservation", async () => {
      const token = generateTestToken("customer", "user-1");
      const reservation = makeReservation({ user_id: "user-1" });

      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(reservation);
      vi.spyOn(ReservationModel, "updateStatus").mockResolvedValueOnce(
        makeReservation({ status: "cancelled" })
      );

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should allow admin to cancel any reservation", async () => {
      const token = generateTestToken("admin", "admin-1");
      const reservation = makeReservation({ user_id: "other-user" });

      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(reservation);
      vi.spyOn(ReservationModel, "updateStatus").mockResolvedValueOnce(
        makeReservation({ status: "cancelled" })
      );

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it("should return 403 when cancelling another user's reservation", async () => {
      const token = generateTestToken("customer", "user-1");
      const reservation = makeReservation({ user_id: "user-2" });

      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(reservation);

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(403);
    });

    it("should return 400 when already cancelled", async () => {
      const token = generateTestToken("customer", "user-1");
      const reservation = makeReservation({ user_id: "user-1", status: "cancelled" });

      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(reservation);

      const res = await request(app)
        .put("/api/reservations/res-uuid-1/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("already cancelled");
    });

    it("should return 404 when reservation does not exist", async () => {
      const token = generateTestToken("customer", "user-1");
      vi.spyOn(ReservationModel, "findById").mockResolvedValueOnce(null);

      const res = await request(app)
        .put("/api/reservations/nonexistent/cancel")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /reservations", () => {
    it("should return own reservations", async () => {
      const token = generateTestToken("customer", "user-1");
      const reservations = [makeReservation({ user_id: "user-1" })];

      vi.spyOn(ReservationModel, "findByUserId").mockResolvedValueOnce(reservations);

      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reservations).toHaveLength(1);
    });

    it("should return all reservations for admin", async () => {
      const token = generateTestToken("admin");
      const allReservations = [
        makeReservation({ id: "res-1" }),
        makeReservation({ id: "res-2", user_id: "user-2" }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: allReservations,
        rowCount: 2,
        oid: 0,
        command: "SELECT",
      });

      const res = await request(app)
        .get("/api/reservations")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.reservations).toHaveLength(2);
    });
  });
});
