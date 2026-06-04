import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { success, error, notFound, forbidden, badRequest, conflict } from "../utils/response";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/errors";
import { parsePagination } from "../utils/pagination";

const router = Router();

export interface Review {
  id: string;
  user_id: string;
  menu_item_id: string;
  rating: number;
  comment: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ReviewWithUser extends Review {
  user_name: string;
}

export const ReviewModel = {
  async findById(id: string): Promise<ReviewWithUser | null> {
    const result = await query<Review & { user_name: string }>(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  async findByMenuItemId(menuItemId: string): Promise<ReviewWithUser[]> {
    const result = await query<Review & { user_name: string }>(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.menu_item_id = $1
       ORDER BY r.created_at DESC`,
      [menuItemId]
    );
    return result.rows;
  },

  async findByUserId(userId: string): Promise<ReviewWithUser[]> {
    const result = await query<Review & { user_name: string }>(
      `SELECT r.*, u.name as user_name
       FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async create(
    userId: string,
    menuItemId: string,
    rating: number,
    comment?: string
  ): Promise<ReviewWithUser> {
    const id = uuidv4();
    const now = new Date();

    const result = await query<Review & { user_name: string }>(
      `INSERT INTO reviews (id, user_id, menu_item_id, rating, comment, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, userId, menuItemId, rating, comment || null, now, now]
    );

    const review = result.rows[0];

    const userResult = await query<{ name: string }>(
      "SELECT name FROM users WHERE id = $1",
      [userId]
    );

    return {
      ...review,
      user_name: userResult.rows[0]?.name || "Unknown",
    };
  },

  async update(
    id: string,
    rating: number,
    comment?: string
  ): Promise<ReviewWithUser | null> {
    const result = await query<Review & { user_name: string }>(
      `UPDATE reviews SET rating = $1, comment = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [rating, comment || null, new Date(), id]
    );

    if (!result.rows[0]) return null;

    const userResult = await query<{ name: string }>(
      "SELECT name FROM users WHERE id = $1",
      [result.rows[0].user_id]
    );

    return {
      ...result.rows[0],
      user_name: userResult.rows[0]?.name || "Unknown",
    };
  },

  async delete(id: string): Promise<boolean> {
    const result = await query("DELETE FROM reviews WHERE id = $1", [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async findByUserAndMenuItem(
    userId: string,
    menuItemId: string
  ): Promise<Review | null> {
    const result = await query<Review>(
      "SELECT * FROM reviews WHERE user_id = $1 AND menu_item_id = $2",
      [userId, menuItemId]
    );
    return result.rows[0] || null;
  },

  async getAverageRating(
    menuItemId: string
  ): Promise<{ average: number; count: number }> {
    const result = await query<{ average: string; count: string }>(
      `SELECT COALESCE(AVG(rating), 0) as average, COUNT(*) as count
       FROM reviews WHERE menu_item_id = $1`,
      [menuItemId]
    );
    return {
      average: parseFloat(result.rows[0]?.average || "0"),
      count: parseInt(result.rows[0]?.count || "0", 10),
    };
  },
};

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { menu_item_id, user_id } = req.query;

    if (menu_item_id && typeof menu_item_id === "string") {
      const reviews = await ReviewModel.findByMenuItemId(menu_item_id);
      success(res, { reviews });
      return;
    }

    if (user_id && typeof user_id === "string") {
      const reviews = await ReviewModel.findByUserId(user_id);
      success(res, { reviews });
      return;
    }

    error(
      res,
      400,
      "menu_item_id or user_id query parameter is required",
      "VALIDATION_ERROR"
    );
  } catch (err) {
    console.error("Get reviews error:", err);
    error(res, 500, "Failed to fetch reviews", "INTERNAL_ERROR");
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findById(id);

    if (!review) {
      throw new NotFoundError("Review");
    }

    success(res, { review });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Review");
      return;
    }
    console.error("Get review error:", err);
    error(res, 500, "Failed to fetch review", "INTERNAL_ERROR");
  }
});

router.get("/:menuItemId/stats", async (req: AuthRequest, res) => {
  try {
    const { menuItemId } = req.params;
    const stats = await ReviewModel.getAverageRating(menuItemId);
    success(res, stats);
  } catch (err) {
    console.error("Get review stats error:", err);
    error(res, 500, "Failed to fetch review stats", "INTERNAL_ERROR");
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { menu_item_id, rating, comment } = req.body;

    if (!menu_item_id) {
      error(res, 400, "menu_item_id is required", "VALIDATION_ERROR");
      return;
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      error(
        res,
        400,
        "rating must be a number between 1 and 5",
        "VALIDATION_ERROR"
      );
      return;
    }

    if (comment && typeof comment === "string" && comment.length > 1000) {
      error(
        res,
        400,
        "comment must be at most 1000 characters",
        "VALIDATION_ERROR"
      );
      return;
    }

    const existing = await ReviewModel.findByUserAndMenuItem(
      req.user!.id,
      menu_item_id
    );

    if (existing) {
      throw new ConflictError("You have already reviewed this item. Use PUT to update.");
    }

    const review = await ReviewModel.create(
      req.user!.id,
      menu_item_id,
      rating,
      comment
    );

    success(res, { review }, 201);
  } catch (err) {
    if (err instanceof ConflictError) {
      conflict(res, err.message);
      return;
    }
    console.error("Create review error:", err);
    error(res, 500, "Failed to create review", "INTERNAL_ERROR");
  }
});

router.put("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const existing = await ReviewModel.findById(id);

    if (!existing) {
      throw new NotFoundError("Review");
    }

    if (existing.user_id !== req.user!.id) {
      throw new ForbiddenError("You can only edit your own reviews");
    }

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      error(
        res,
        400,
        "rating must be a number between 1 and 5",
        "VALIDATION_ERROR"
      );
      return;
    }

    const review = await ReviewModel.update(id, rating, comment);
    success(res, { review });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Review");
      return;
    }
    if (err instanceof ForbiddenError) {
      forbidden(res, err.message);
      return;
    }
    console.error("Update review error:", err);
    error(res, 500, "Failed to update review", "INTERNAL_ERROR");
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const existing = await ReviewModel.findById(id);

    if (!existing) {
      throw new NotFoundError("Review");
    }

    if (existing.user_id !== req.user!.id && req.user!.role !== "admin") {
      throw new ForbiddenError("You can only delete your own reviews");
    }

    const deleted = await ReviewModel.delete(id);

    if (!deleted) {
      error(res, 500, "Failed to delete review", "INTERNAL_ERROR");
      return;
    }

    success(res, { message: "Review deleted" });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Review");
      return;
    }
    if (err instanceof ForbiddenError) {
      forbidden(res, err.message);
      return;
    }
    console.error("Delete review error:", err);
    error(res, 500, "Failed to delete review", "INTERNAL_ERROR");
  }
});

export default router;
