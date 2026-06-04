import { OrderModel, OrderStatus } from "../models/order";
import { query } from "../config/database";
import { notificationService } from "./notificationService";
import { emitToOrder, emitToAdmins, emitToKitchen } from "../config/socket";

interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
  estimatedTime?: string;
  kitchenNotes?: string;
}

interface KitchenDisplayData {
  orderId: string;
  customerName: string;
  items: { name: string; quantity: number; notes?: string }[];
  status: OrderStatus;
  priority: "normal" | "rush";
  createdAt: Date;
  estimatedReadyTime?: Date;
}

const PREPARATION_TIMES: Record<string, number> = {
  appetizer: 10,
  pasta: 15,
  pizza: 12,
  main: 20,
  dessert: 8,
  drink: 3,
};

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "delivered"];

export const orderTrackingService = {
  async updateOrderStatus(update: OrderStatusUpdate): Promise<boolean> {
    const order = await OrderModel.findById(update.orderId);

    if (!order) {
      return false;
    }

    const currentStatusIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
    const newStatusIndex = STATUS_FLOW.indexOf(update.status);

    if (update.status !== "cancelled" && newStatusIndex <= currentStatusIndex) {
      console.warn(
        `[ORDER TRACKING] Invalid status transition: ${order.status} -> ${update.status}`
      );
    }

    const updated = await OrderModel.updateStatus({
      orderId: update.orderId,
      status: update.status,
    });

    if (!updated) {
      return false;
    }

    emitToOrder(update.orderId, "order:status", {
      orderId: update.orderId,
      status: update.status,
      estimatedTime: update.estimatedTime,
      timestamp: new Date().toISOString(),
    });

    emitToAdmins("order:updated", {
      orderId: update.orderId,
      status: update.status,
      total: updated.total,
      timestamp: new Date().toISOString(),
    });

    if (["preparing", "ready"].includes(update.status)) {
      emitToKitchen("kitchen:order-update", {
        orderId: update.orderId,
        status: update.status,
        kitchenNotes: update.kitchenNotes,
        timestamp: new Date().toISOString(),
      });
    }

    await notificationService.sendOrderUpdate(
      order.user_id,
      update.orderId,
      update.status,
      update.estimatedTime
    );

    return true;
  },

  async handleNewOrder(orderId: string): Promise<void> {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return;
    }

    const userResult = await query<{ name: string }>(
      "SELECT name FROM users WHERE id = $1",
      [order.user_id]
    );

    const customerName = userResult.rows[0]?.name || "Unknown";

    emitToAdmins("order:new", {
      orderId: order.id,
      customerName,
      total: order.total,
      itemCount: order.items.length,
      status: order.status,
      createdAt: order.created_at.toISOString(),
    });

    emitToKitchen("kitchen:new-order", {
      orderId: order.id,
      customerName,
      items: order.items.map((item) => ({
        name: item.menu_item_id,
        quantity: item.quantity,
      })),
      status: order.status,
      priority: "normal",
      createdAt: order.created_at.toISOString(),
    });

    await notificationService.sendNewOrderToAdmin(
      orderId,
      customerName,
      order.total,
      order.items.length
    );
  },

  async calculateEstimatedTime(orderId: string): Promise<string> {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return "Unknown";
    }

    let totalMinutes = 5;

    for (const item of order.items) {
      totalMinutes += 5;
    }

    const queueResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM orders
       WHERE status IN ('confirmed', 'preparing')
       AND created_at > NOW() - INTERVAL '1 hour'`
    );

    const queueLength = parseInt(queueResult.rows[0]?.count || "0", 10);
    totalMinutes += queueLength * 3;

    if (totalMinutes <= 15) return "10-15 minutes";
    if (totalMinutes <= 25) return "15-25 minutes";
    if (totalMinutes <= 35) return "25-35 minutes";
    return "35-45 minutes";
  },

  async getKitchenDisplayData(): Promise<KitchenDisplayData[]> {
    const ordersResult = await query<any>(
      `SELECT o.*, u.name as customer_name
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.status IN ('confirmed', 'preparing')
       ORDER BY o.created_at ASC`
    );

    const displayData: KitchenDisplayData[] = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await query<{ name: string; quantity: number }>(
        `SELECT mi.name, oi.quantity
         FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = $1`,
        [order.id]
      );

      displayData.push({
        orderId: order.id,
        customerName: order.customer_name,
        items: itemsResult.rows,
        status: order.status,
        priority: "normal",
        createdAt: order.created_at,
        estimatedReadyTime: undefined,
      });
    }

    return displayData;
  },

  async getOrderTrackingInfo(orderId: string) {
    const order = await OrderModel.findById(orderId);

    if (!order) {
      return null;
    }

    const currentStatusIndex = STATUS_FLOW.indexOf(order.status as OrderStatus);
    const estimatedTime = await this.calculateEstimatedTime(orderId);

    return {
      orderId: order.id,
      status: order.status,
      total: order.total,
      items: order.items,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      estimatedTime: ["pending", "confirmed", "preparing"].includes(order.status)
        ? estimatedTime
        : null,
      progress: {
        current: currentStatusIndex + 1,
        total: STATUS_FLOW.length,
        percentage: Math.round(((currentStatusIndex + 1) / STATUS_FLOW.length) * 100),
      },
      timeline: STATUS_FLOW.map((status, index) => ({
        status,
        completed: index <= currentStatusIndex,
        current: index === currentStatusIndex,
      })),
    };
  },
};
