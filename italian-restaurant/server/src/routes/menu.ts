import { Router } from "express";
import { MenuItemModel } from "../models/menuItem";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { validate, menuItemSchema } from "../middleware/validation";
import { query } from "../config/database";
import { success, error, notFound } from "../utils/response";
import { NotFoundError } from "../utils/errors";

const router = Router();

router.get("/featured", async (_req: AuthRequest, res) => {
  try {
    const items = await MenuItemModel.findAll({ is_available: true, is_featured: true });
    success(res, { items });
  } catch (err) {
    console.error("Get featured menu error:", err);
    error(res, 500, "Failed to fetch featured menu items", "INTERNAL_ERROR");
  }
});

router.get("/categories", async (_req: AuthRequest, res) => {
  try {
    const result = await query<{ category: string; count: string }>(
      `SELECT category, COUNT(*) as count
       FROM menu_items
       WHERE is_available = true
       GROUP BY category
       ORDER BY category`
    );

    const categories = result.rows.map((row) => ({
      name: row.category,
      count: parseInt(row.count, 10),
    }));

    success(res, { categories });
  } catch (err) {
    console.error("Get categories error:", err);
    error(res, 500, "Failed to fetch categories", "INTERNAL_ERROR");
  }
});

router.get("/", async (req: AuthRequest, res) => {
  try {
    const { category } = req.query;
    const filters: { category?: string; is_available?: boolean } = {};

    if (category && typeof category === "string") {
      filters.category = category;
    }

    const items = await MenuItemModel.findAll(filters);
    success(res, { items });
  } catch (err) {
    console.error("Get menu error:", err);
    error(res, 500, "Failed to fetch menu", "INTERNAL_ERROR");
  }
});

router.get("/:id", async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItemModel.findById(id);

    if (!item) {
      throw new NotFoundError("Menu item");
    }

    success(res, { item });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Menu item");
      return;
    }
    console.error("Get menu item error:", err);
    error(res, 500, "Failed to fetch menu item", "INTERNAL_ERROR");
  }
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  validate(menuItemSchema),
  async (req: AuthRequest, res) => {
    try {
      const item = await MenuItemModel.create(req.body);
      success(res, { item }, 201);
    } catch (err) {
      console.error("Create menu item error:", err);
      error(res, 500, "Failed to create menu item", "INTERNAL_ERROR");
    }
  }
);

router.put(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(menuItemSchema),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const item = await MenuItemModel.update(id, req.body);

      if (!item) {
        throw new NotFoundError("Menu item");
      }

      success(res, { item });
    } catch (err) {
      if (err instanceof NotFoundError) {
        notFound(res, "Menu item");
        return;
      }
      console.error("Update menu item error:", err);
      error(res, 500, "Failed to update menu item", "INTERNAL_ERROR");
    }
  }
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await MenuItemModel.delete(id);

      if (!deleted) {
        throw new NotFoundError("Menu item");
      }

      success(res, { message: "Menu item deleted" });
    } catch (err) {
      if (err instanceof NotFoundError) {
        notFound(res, "Menu item");
        return;
      }
      console.error("Delete menu item error:", err);
      error(res, 500, "Failed to delete menu item", "INTERNAL_ERROR");
    }
  }
);

export default router;
