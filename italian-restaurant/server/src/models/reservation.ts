import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";

export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed";

export interface Reservation {
  id: string;
  user_id: string;
  reservation_date: Date;
  reservation_time: string;
  party_size: number;
  name: string;
  phone: string;
  email: string;
  notes: string | null;
  status: ReservationStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateReservationInput {
  user_id: string;
  reservation_date: string;
  reservation_time: string;
  party_size: number;
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface AvailabilityCheck {
  date: string;
  time: string;
  available: boolean;
}

const MAX_PARTY_SIZE = 20;
const MAX_CONCURRENT_RESERVATIONS = 5;

export const ReservationModel = {
  async findById(id: string): Promise<Reservation | null> {
    const result = await query<Reservation>(
      "SELECT * FROM reservations WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async findByUserId(userId: string): Promise<Reservation[]> {
    const result = await query<Reservation>(
      "SELECT * FROM reservations WHERE user_id = $1 ORDER BY reservation_date DESC, reservation_time DESC",
      [userId]
    );
    return result.rows;
  },

  async create(input: CreateReservationInput): Promise<Reservation> {
    const isAvailable = await this.checkAvailability(
      input.reservation_date,
      input.reservation_time,
      input.party_size
    );

    if (!isAvailable) {
      throw new Error("Selected time slot is not available");
    }

    if (input.party_size > MAX_PARTY_SIZE) {
      throw new Error(`Maximum party size is ${MAX_PARTY_SIZE}`);
    }

    const id = uuidv4();
    const now = new Date();
    const confirmationCode = Math.random().toString(36).slice(2, 10).toUpperCase();

    const result = await query<Reservation>(
      `INSERT INTO reservations (id, user_id, reservation_date, reservation_time, party_size, name, phone, email, notes, confirmation_code, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.reservation_date,
        input.reservation_time,
        input.party_size,
        input.name,
        input.phone,
        input.email,
        input.notes || null,
        confirmationCode,
        "confirmed",
        now,
        now,
      ]
    );

    return result.rows[0];
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation | null> {
    const result = await query<Reservation>(
      `UPDATE reservations SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, new Date(), id]
    );
    return result.rows[0] || null;
  },

  async checkAvailability(
    date: string,
    time: string,
    partySize: number
  ): Promise<boolean> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM reservations
       WHERE reservation_date = $1
       AND reservation_time = $2
       AND status IN ('pending', 'confirmed')`,
      [date, time]
    );

    const currentCount = parseInt(result.rows[0]?.count || "0", 10);

    if (partySize > MAX_PARTY_SIZE) {
      return false;
    }

    return currentCount < MAX_CONCURRENT_RESERVATIONS;
  },

  async findAvailableSlots(date: string): Promise<AvailabilityCheck[]> {
    const timeSlots = [
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00",
    ];

    const result = await query<{ reservation_time: string; count: string }>(
      `SELECT reservation_time, COUNT(*) as count
       FROM reservations
       WHERE reservation_date = $1
       AND status IN ('pending', 'confirmed')
       GROUP BY reservation_time`,
      [date]
    );

    const reservationCounts = new Map(
      result.rows.map((r) => [r.reservation_time, parseInt(r.count, 10)])
    );

    return timeSlots.map((slot) => ({
      date,
      time: slot,
      available: (reservationCounts.get(slot) || 0) < MAX_CONCURRENT_RESERVATIONS,
    }));
  },
};
