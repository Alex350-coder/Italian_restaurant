import { Router } from "express";
import { OrderModel } from "../models/order";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import {
  validate,
  createOrderSchema,
  updateOrderStatusSchema,
} from "../middleware/validation";
import { orderLimiter } from "../middleware/rateLimit";
import { stripeService } from "../services/stripeService";
import { emailService } from "../services/emailService";
import { query } from "../config/database";
import { MenuItemModel } from "../models/menuItem";
import { orderTrackingService } from "../services/orderTracking";
import { success, error, notFound, forbidden, badRequest } from "../utils/response";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors";

const router = Router();

router.get("/stats", requireAuth, requireRole("admin"), async (_req: AuthRequest, res) => {
  try {
    const totalOrders = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM orders"
    );

    const totalRevenue = await query<{ total: string }>(
      "SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'"
    );

    const statusCounts = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count
       FROM orders
       GROUP BY status
       ORDER BY count DESC`
    );

    const popularItems = await query<{
      name: string;
      total_quantity: string;
      total_revenue: string;
    }>(
      `SELECT mi.name, SUM(oi.quantity) as total_quantity, SUM(oi.total_price) as total_revenue
       FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       GROUP BY mi.name
       ORDER BY total_quantity DESC
       LIMIT 10`
    );

    const recentOrders = await query<{
      id: string;
      status: string;
      total: number;
      created_at: Date;
    }>(
      `SELECT id, status, total, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 5`
    );

    success(res, {
      totalOrders: parseInt(totalOrders.rows[0]?.count || "0", 10),
      totalRevenue: parseFloat(totalRevenue.rows[0]?.total || "0"),
      ordersByStatus: statusCounts.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
      popularItems: popularItems.rows.map((r) => ({
        name: r.name,
        totalQuantity: parseInt(r.total_quantity, 10),
        totalRevenue: parseFloat(r.total_revenue),
      })),
      recentOrders: recentOrders.rows,
    });
  } catch (err) {
    console.error("Get order stats error:", err);
    error(res, 500, "Failed to fetch order statistics", "INTERNAL_ERROR");
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      error(res, 401, "Authentication required", "UNAUTHORIZED");
      return;
    }

    let orders;

    if (req.user.role === "admin") {
      const allOrders = [];
      const { query: dbQuery } = await import("../config/database");
      const result = await dbQuery("SELECT * FROM orders ORDER BY created_at DESC");
      for (const order of result.rows) {
        const itemsResult = await dbQuery(
          "SELECT * FROM order_items WHERE order_id = $1",
          [order.id]
        );
        allOrders.push({ ...order, items: itemsResult.rows });
      }
      orders = allOrders;
    } else {
      orders = await OrderModel.findByUserId(req.user.id);
    }

    success(res, { orders });
  } catch (err) {
    console.error("Get orders error:", err);
    error(res, 500, "Failed to fetch orders", "INTERNAL_ERROR");
  }
});

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);

    if (!order) {
      throw new NotFoundError("Order");
    }

    if (req.user?.role !== "admin" && order.user_id !== req.user?.id) {
      throw new ForbiddenError("Access denied");
    }

    success(res, { order });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Order");
      return;
    }
    if (err instanceof ForbiddenError) {
      forbidden(res, "Access denied");
      return;
    }
    console.error("Get order error:", err);
    error(res, 500, "Failed to fetch order", "INTERNAL_ERROR");
  }
});

router.post(
  "/",
  requireAuth,
  orderLimiter,
  validate(createOrderSchema),
  async (req: AuthRequest, res) => {
    try {
      if (!req.user) {
        error(res, 401, "Authentication required", "UNAUTHORIZED");
        return;
      }

      const order = await OrderModel.create({
        user_id: req.user.id,
        items: req.body.items,
        notes: req.body.notes,
      });

      const itemsWithNames = await Promise.all(
        order.items.map(async (item) => {
          const menuItem = await MenuItemModel.findById(item.menu_item_id);
          return {
            name: menuItem?.name || "Unknown Item",
            quantity: item.quantity,
            subtotal: Number(item.total_price),
          };
        })
      );

      await emailService.sendOrderConfirmation({
        orderId: order.id,
        customerName: req.user.name,
        items: itemsWithNames,
        total: Number(order.total),
        notes: order.notes || undefined,
      });

      await orderTrackingService.handleNewOrder(order.id);

      success(res, { order }, 201);
    } catch (err: any) {
      console.error("Create order error:", err);
      error(res, 400, err.message || "Failed to create order", "BAD_REQUEST");
    }
  }
);

router.put(
  "/:id/status",
  requireAuth,
  requireRole("admin"),
  validate(updateOrderStatusSchema),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const estimatedTime = await orderTrackingService.calculateEstimatedTime(id);

      const successUpdate = await orderTrackingService.updateOrderStatus({
        orderId: id,
        status,
        estimatedTime,
      });

      if (!successUpdate) {
        throw new NotFoundError("Order");
      }

      const order = await OrderModel.findById(id);
      success(res, { order });
    } catch (err) {
      if (err instanceof NotFoundError) {
        notFound(res, "Order");
        return;
      }
      console.error("Update order status error:", err);
      error(res, 500, "Failed to update order status", "INTERNAL_ERROR");
    }
  }
);

router.post("/:id/pay", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, cardToken } = req.body;

    const order = await OrderModel.findById(id);

    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.user_id !== req.user?.id && req.user?.role !== "admin") {
      throw new ForbiddenError("Access denied");
    }

    if (order.status === "cancelled") {
      throw new BadRequestError("Cannot pay for a cancelled order");
    }

    const payment = await stripeService.createPaymentIntent({
      orderId: order.id,
      amount: order.total,
      currency: "usd",
      paymentMethod: paymentMethod || "card",
      cardToken,
    });

    if (payment.status === "succeeded") {
      await orderTrackingService.updateOrderStatus({
        orderId: order.id,
        status: "confirmed",
      });
    }

    success(res, {
      payment,
      order: {
        id: order.id,
        status: payment.status === "succeeded" ? "confirmed" : order.status,
      },
    });
  } catch (err: any) {
    if (err instanceof NotFoundError) {
      notFound(res, "Order");
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
    console.error("Pay order error:", err);
    error(res, 400, err.message || "Payment failed", "PAYMENT_FAILED");
  }
});

router.post("/:id/cancel", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const order = await OrderModel.findById(id);

    if (!order) {
      throw new NotFoundError("Order");
    }

    if (order.user_id !== req.user?.id && req.user?.role !== "admin") {
      throw new ForbiddenError("Access denied");
    }

    const nonCancellableStatuses = ["delivered", "cancelled"];
    if (nonCancellableStatuses.includes(order.status)) {
      throw new BadRequestError(`Cannot cancel an order with status: ${order.status}`);
    }

    await orderTrackingService.updateOrderStatus({
      orderId: order.id,
      status: "cancelled",
    });

    success(res, { order: { ...order, status: "cancelled" } });
  } catch (err) {
    if (err instanceof NotFoundError) {
      notFound(res, "Order");
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
    console.error("Cancel order error:", err);
    error(res, 500, "Failed to cancel order", "INTERNAL_ERROR");
  }
});

export default router;
