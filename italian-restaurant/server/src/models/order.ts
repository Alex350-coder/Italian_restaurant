import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../config/database";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

export interface Order {
  id: string;
  user_id: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  user_id: string;
  items: { menu_item_id: string; quantity: number }[];
  notes?: string;
}

export interface UpdateOrderStatusInput {
  orderId: string;
  status: OrderStatus;
}

export const OrderModel = {
  async findById(id: string): Promise<OrderWithItems | null> {
    const orderResult = await query<Order>(
      "SELECT * FROM orders WHERE id = $1",
      [id]
    );

    if (!orderResult.rows[0]) return null;

    const itemsResult = await query<OrderItem & { name: string }>(
      `SELECT oi.*, mi.name FROM order_items oi
       JOIN menu_items mi ON oi.menu_item_id = mi.id
       WHERE oi.order_id = $1`,
      [id]
    );

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows,
    };
  },

  async findByUserId(userId: string): Promise<OrderWithItems[]> {
    const ordersResult = await query<Order>(
      "SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const orders: OrderWithItems[] = [];

    for (const order of ordersResult.rows) {
      const itemsResult = await query<OrderItem & { name: string }>(
        `SELECT oi.*, mi.name FROM order_items oi
         JOIN menu_items mi ON oi.menu_item_id = mi.id
         WHERE oi.order_id = $1`,
        [order.id]
      );
      orders.push({
        ...order,
        items: itemsResult.rows,
      });
    }

    return orders;
  },

  async create(input: CreateOrderInput): Promise<OrderWithItems> {
    return transaction(async (client) => {
      const orderId = uuidv4();
      const now = new Date();

      const menuItemsResult = await client.query(
        "SELECT id, price FROM menu_items WHERE id = ANY($1) AND is_available = true",
        [input.items.map((i) => i.menu_item_id)]
      );

      const menuItemMap = new Map(
        menuItemsResult.rows.map((m) => [m.id, m.price])
      );

      let total = 0;
      const orderItems: OrderItem[] = [];

      for (const item of input.items) {
        const price = menuItemMap.get(item.menu_item_id);
        if (price === undefined) {
          throw new Error(`Menu item ${item.menu_item_id} not found or unavailable`);
        }

        const totalPrice = price * item.quantity;
        total += totalPrice;

        orderItems.push({
          id: uuidv4(),
          order_id: orderId,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: price,
          total_price: totalPrice,
        });
      }

      const orderResult = await client.query<Order>(
        `INSERT INTO orders (id, user_id, status, subtotal, total, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [orderId, input.user_id, "pending", total, total, input.notes || null, now, now]
      );

      for (const orderItem of orderItems) {
        await client.query(
          `INSERT INTO order_items (id, order_id, menu_item_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            orderItem.id,
            orderItem.order_id,
            orderItem.menu_item_id,
            orderItem.quantity,
            orderItem.unit_price,
            orderItem.total_price,
          ]
        );
      }

      return {
        ...orderResult.rows[0],
        items: orderItems,
      };
    });
  },

  async updateStatus(input: UpdateOrderStatusInput): Promise<Order | null> {
    const result = await query<Order>(
      `UPDATE orders SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [input.status, new Date(), input.orderId]
    );
    return result.rows[0] || null;
  },

  async calculateTotal(orderId: string): Promise<number> {
    const result = await query<{ total: number }>(
      "SELECT COALESCE(SUM(total_price), 0) as total FROM order_items WHERE order_id = $1",
      [orderId]
    );
    return result.rows[0]?.total || 0;
  },
};
