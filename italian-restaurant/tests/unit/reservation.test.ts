import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ReservationModel,
  Reservation,
  AvailabilityCheck,
} from "../../server/src/models/reservation";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
}));

import { query } from "../../server/src/config/database";

const mockQuery = vi.mocked(query);

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: "res-uuid-1",
    user_id: "user-uuid-1",
    reservation_date: new Date("2026-07-15"),
    reservation_time: "19:00",
    party_size: 4,
    name: "Mario Rossi",
    phone: "+39 333 1234567",
    email: "mario.rossi@example.com",
    notes: "Window seat please",
    status: "confirmed",
    created_at: new Date("2026-06-01"),
    updated_at: new Date("2026-06-01"),
    ...overrides,
  };
}

describe("ReservationModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a reservation with confirmed status", async () => {
      const input = {
        user_id: "user-1",
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 4,
        name: "Mario Rossi",
        phone: "+39 333 1234567",
        email: "mario@example.com",
      };

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [makeReservation()],
          rowCount: 1,
          oid: 0,
          command: "INSERT",
        });

      const result = await ReservationModel.create(input);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result.status).toBe("confirmed");
      expect(result.user_id).toBe("user-uuid-1");
      expect(result.party_size).toBe(4);
    });

    it("should throw when time slot is not available", async () => {
      const input = {
        user_id: "user-1",
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 4,
        name: "Mario Rossi",
        phone: "+39 333 1234567",
        email: "mario@example.com",
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "5" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      await expect(ReservationModel.create(input)).rejects.toThrow(
        "Selected time slot is not available"
      );
    });

    it("should throw when party size exceeds maximum (20)", async () => {
      const input = {
        user_id: "user-1",
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 25,
        name: "Big Party",
        phone: "+39 333 0000000",
        email: "big@example.com",
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "0" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      await expect(ReservationModel.create(input)).rejects.toThrow(
        "Selected time slot is not available"
      );
    });

    it("should include notes when provided", async () => {
      const input = {
        user_id: "user-1",
        reservation_date: "2026-07-15",
        reservation_time: "19:00",
        party_size: 2,
        name: "Mario",
        phone: "+39 333 1111111",
        email: "m@example.com",
        notes: "Anniversary dinner",
      };

      const createdReservation = makeReservation({ notes: "Anniversary dinner" });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ count: "0" }],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [createdReservation],
          rowCount: 1,
          oid: 0,
          command: "INSERT",
        });

      const result = await ReservationModel.create(input);

      expect(result.notes).toBe("Anniversary dinner");
    });
  });

  describe("findByUserId", () => {
    it("should return all reservations for the given user", async () => {
      const reservations = [
        makeReservation({ id: "res-1", user_id: "user-1" }),
        makeReservation({ id: "res-2", user_id: "user-1", status: "cancelled" }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: reservations,
        rowCount: 2,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findByUserId("user-1");

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("WHERE user_id = $1");
      expect(sql).toContain("ORDER BY reservation_date DESC, reservation_time DESC");
      expect(params[0]).toBe("user-1");
    });

    it("should return empty array when user has no reservations", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findByUserId("user-no-reservations");

      expect(result).toEqual([]);
    });
  });

  describe("updateStatus", () => {
    it("should update the reservation status", async () => {
      const updated = makeReservation({ status: "cancelled" });

      mockQuery.mockResolvedValueOnce({
        rows: [updated],
        rowCount: 1,
        oid: 0,
        command: "UPDATE",
      });

      const result = await ReservationModel.updateStatus("res-uuid-1", "cancelled");

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("UPDATE reservations SET status =");
      expect(params[0]).toBe("cancelled");
      expect(params[2]).toBe("res-uuid-1");
      expect(result?.status).toBe("cancelled");
    });

    it("should return null when reservation does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "UPDATE",
      });

      const result = await ReservationModel.updateStatus("nonexistent", "confirmed");

      expect(result).toBeNull();
    });

    it("should allow all valid status transitions", async () => {
      const statuses = ["pending", "confirmed", "cancelled", "completed"] as const;

      for (const status of statuses) {
        mockQuery.mockResolvedValueOnce({
          rows: [makeReservation({ status })],
          rowCount: 1,
          oid: 0,
          command: "UPDATE",
        });

        const result = await ReservationModel.updateStatus("res-uuid-1", status);
        expect(result?.status).toBe(status);
      }
    });
  });

  describe("checkAvailability", () => {
    it("should return true when no reservations exist for the slot", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "0" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.checkAvailability("2026-07-15", "19:00", 4);

      expect(result).toBe(true);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("reservation_date = $1");
      expect(sql).toContain("reservation_time = $2");
      expect(sql).toContain("status IN ('pending', 'confirmed')");
      expect(params).toEqual(["2026-07-15", "19:00"]);
    });

    it("should return true when fewer than 5 reservations exist for the slot", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "3" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.checkAvailability("2026-07-15", "19:00", 2);

      expect(result).toBe(true);
    });

    it("should return false when 5 or more reservations exist for the slot", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "5" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.checkAvailability("2026-07-15", "19:00", 2);

      expect(result).toBe(false);
    });

    it("should return false when party size exceeds maximum", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "0" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.checkAvailability("2026-07-15", "19:00", 25);

      expect(result).toBe(false);
    });

    it("should not count cancelled reservations", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "2" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.checkAvailability("2026-07-15", "19:00", 4);

      expect(result).toBe(true);
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("status IN ('pending', 'confirmed')");
    });

    it("should handle null count gracefully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: null }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.checkAvailability("2026-07-15", "19:00", 2);

      expect(result).toBe(true);
    });
  });

  describe("findAvailableSlots", () => {
    it("should return all 13 time slots with availability", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findAvailableSlots("2026-07-15");

      expect(result).toHaveLength(13);
      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("GROUP BY reservation_time");
      expect(params[0]).toBe("2026-07-15");
    });

    it("should mark slots as available when fewer than 5 reservations", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ reservation_time: "19:00", count: "2" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findAvailableSlots("2026-07-15");

      const slot19 = result.find((s) => s.time === "19:00");
      expect(slot19?.available).toBe(true);
    });

    it("should mark slots as unavailable when 5 or more reservations exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ reservation_time: "19:00", count: "5" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findAvailableSlots("2026-07-15");

      const slot19 = result.find((s) => s.time === "19:00");
      expect(slot19?.available).toBe(false);
    });

    it("should include the date in each slot", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findAvailableSlots("2026-07-15");

      result.forEach((slot) => {
        expect(slot.date).toBe("2026-07-15");
      });
    });

    it("should include standard lunch and dinner time slots", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findAvailableSlots("2026-07-15");
      const times = result.map((s) => s.time);

      expect(times).toContain("12:00");
      expect(times).toContain("12:30");
      expect(times).toContain("13:00");
      expect(times).toContain("13:30");
      expect(times).toContain("14:00");
      expect(times).toContain("14:30");
      expect(times).toContain("18:00");
      expect(times).toContain("18:30");
      expect(times).toContain("19:00");
      expect(times).toContain("19:30");
      expect(times).toContain("20:00");
      expect(times).toContain("20:30");
      expect(times).toContain("21:00");
    });

    it("should default unreserved slots to available", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await ReservationModel.findAvailableSlots("2026-07-15");

      result.forEach((slot) => {
        expect(slot.available).toBe(true);
      });
    });
  });

  describe("date validation", () => {
    it("should accept future dates for availability check", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ count: "0" }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateStr = futureDate.toISOString().split("T")[0];

      const result = await ReservationModel.checkAvailability(dateStr, "19:00", 2);
      expect(result).toBe(true);
    });
  });
});
