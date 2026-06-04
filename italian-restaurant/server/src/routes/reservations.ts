import { Router } from "express";
import { ReservationModel } from "../models/reservation";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { validate, createReservationSchema } from "../middleware/validation";
import { reservationLimiter } from "../middleware/rateLimit";
import { query } from "../config/database";
import { notificationService } from "../services/notificationService";
import { emitToAdmins, emitToUser } from "../config/socket";
import { success, error, notFound, forbidden, badRequest } from "../utils/response";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";

const router = Router();

router.get(
  "/today",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res) => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const result = await query(
        `SELECT * FROM reservations
         WHERE reservation_date = $1
         ORDER BY reservation_time ASC`,
        [today]
      );

      const stats = await query<{
        status: string;
        count: string;
        total_guests: string;
      }>(
        `SELECT status, COUNT(*) as count, COALESCE(SUM(party_size), 0) as total_guests
         FROM reservations
         WHERE reservation_date = $1
         GROUP BY status`,
        [today]
      );

      success(res, {
        reservations: result.rows,
        stats: {
          date: today,
          total: result.rows.length,
          byStatus: stats.rows.map((r) => ({
            status: r.status,
            count: parseInt(r.count, 10),
            totalGuests: parseInt(r.total_guests, 10),
          })),
        },
      });
    } catch (err) {
      console.error("Get today reservations error:", err);
      error(res, 500, "Failed to fetch today's reservations", "INTERNAL_ERROR");
    }
  }
);

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      error(res, 401, "Authentication required", "UNAUTHORIZED");
      return;
    }

    let reservations;

    if (req.user.role === "admin") {
      const { query: dbQuery } = await import("../config/database");
      const result = await dbQuery(
        "SELECT * FROM reservations ORDER BY reservation_date DESC, reservation_time DESC"
      );
      reservations = result.rows;
    } else {
      reservations = await ReservationModel.findByUserId(req.user.id);
    }

    success(res, { reservations });
  } catch (err) {
    console.error("Get reservations error:", err);
    error(res, 500, "Failed to fetch reservations", "INTERNAL_ERROR");
  }
});

router.get("/availability", async (req: AuthRequest, res) => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      error(res, 400, "Date query parameter is required (YYYY-MM-DD)", "VALIDATION_ERROR");
      return;
    }

    const slots = await ReservationModel.findAvailableSlots(date);
    success(res, { slots });
  } catch (err) {
    console.error("Check availability error:", err);
    error(res, 500, "Failed to check availability", "INTERNAL_ERROR");
  }
});

router.post(
  "/",
  requireAuth,
  reservationLimiter,
  validate(createReservationSchema),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        error(res, 401, "Authentication required", "UNAUTHORIZED");
        return;
      }

      const reservation = await ReservationModel.create({
        user_id: req.user.id,
        ...req.body,
      });

      emitToAdmins("reservation:new", {
        id: reservation.id,
        customerName: reservation.name,
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        partySize: reservation.party_size,
        status: reservation.status,
        createdAt: reservation.created_at.toISOString(),
      });

      await notificationService.sendReservationConfirmation(
        req.user.id,
        reservation.id,
        String(reservation.reservation_date),
        reservation.reservation_time,
        reservation.party_size
      );

      success(res, { reservation }, 201);
    } catch (err: any) {
      console.error("Create reservation error:", err);
      error(res, 400, err.message || "Failed to create reservation", "BAD_REQUEST");
    }
  }
);

router.put(
  "/:id/confirm",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const reservation = await ReservationModel.findById(id);

      if (!reservation) {
        throw new NotFoundError("Reservation");
      }

      if (reservation.status === "confirmed") {
        throw new BadRequestError("Reservation is already confirmed");
      }

      if (reservation.status === "cancelled") {
        throw new BadRequestError("Cannot confirm a cancelled reservation");
      }

      const updated = await ReservationModel.updateStatus(id, "confirmed");

      emitToUser(reservation.user_id, "reservation:confirmed", {
        reservationId: id,
        status: "confirmed",
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        partySize: reservation.party_size,
      });

      emitToAdmins("reservation:updated", {
        reservationId: id,
        status: "confirmed",
        date: reservation.reservation_date,
        time: reservation.reservation_time,
        partySize: reservation.party_size,
      });

      await notificationService.sendReservationUpdate(
        reservation.user_id,
        id,
        "confirmed"
      );

      success(res, { reservation: updated });
    } catch (err) {
      if (err instanceof NotFoundError) {
        notFound(res, "Reservation");
        return;
      }
      if (err instanceof BadRequestError) {
        badRequest(res, err.message);
        return;
      }
      console.error("Confirm reservation error:", err);
      error(res, 500, "Failed to confirm reservation", "INTERNAL_ERROR");
    }
  }
);

router.put("/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const reservation = await ReservationModel.findById(id);

    if (!reservation) {
      throw new NotFoundError("Reservation");
    }

    if (req.user?.role !== "admin" && reservation.user_id !== req.user?.id) {
      throw new ForbiddenError("Access denied");
    }

    if (reservation.status === "cancelled") {
      throw new BadRequestError("Reservation is already cancelled");
    }

    const updated = await ReservationModel.updateStatus(id, "cancelled");

    emitToUser(reservation.user_id, "reservation:cancelled", {
      reservationId: id,
      status: "cancelled",
      date: reservation.reservation_date,
      time: reservation.reservation_time,
    });

    emitToAdmins("reservation:updated", {
      reservationId: id,
      status: "cancelled",
      date: reservation.reservation_date,
      time: reservation.reservation_time,
    });

    await notificationService.sendReservationUpdate(
      reservation.user_id,
      id,
      "cancelled"
    );

    success(res, { reservation: updated });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Reservation");
      return;
    }
    if (err instanceof ForbiddenError) {
      forbidden(res, "Access denied");
      return;
    }
    if (err instanceof BadRequestError) {
      badRequest(res, err.message);
      return;
    }
    console.error("Cancel reservation error:", err);
    error(res, 500, "Failed to cancel reservation", "INTERNAL_ERROR");
  }
});

export default router;
