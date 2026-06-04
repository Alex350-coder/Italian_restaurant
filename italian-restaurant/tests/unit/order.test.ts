import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrderModel, Order, OrderItem, OrderWithItems } from "../../server/src/models/order";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
  transaction: vi.fn((cb: Function) => {
    const mockClient = {
      query: vi.fn(),
    };
    return cb(mockClient);
  }),
}));

import { query, transaction } from "../../server/src/config/database";

const mockQuery = vi.mocked(query);
const mockTransaction = vi.mocked(transaction);

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-uuid-1",
    user_id: "user-uuid-1",
    status: "pending",
    total: 25.0,
    notes: "Extra napkins please",
    created_at: new Date("2026-06-01"),
    updated_at: new Date("2026-06-01"),
    ...overrides,
  };
}

function makeOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  return {
    id: "item-uuid-1",
    order_id: "order-uuid-1",
    menu_item_id: "menu-item-uuid-1",
    quantity: 2,
    unit_price: 12.5,
    subtotal: 25.0,
    ...overrides,
  };
}

describe("OrderModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create an order with items inside a transaction", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [
            { id: "menu-1", price: 12.5 },
            { id: "menu-2", price: 8.0 },
          ],
          rowCount: 2,
        })
        .mockResolvedValueOnce({
          rows: [
            makeOrder({ id: "new-order-id", total: 33.0, user_id: "user-1" }),
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockTransaction.mockImplementationOnce(async (cb: Function) => cb(mockClient));

      const result = await OrderModel.create({
        user_id: "user-1",
        items: [
          { menu_item_id: "menu-1", quantity: 2 },
          { menu_item_id: "menu-2", quantity: 1 },
        ],
        notes: "Please hurry",
      });

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(4);

      const menuQuery = mockClient.query.mock.calls[0][0] as string;
      expect(menuQuery).toContain("SELECT id, price FROM menu_items");
      expect(menuQuery).toContain("is_available = true");
      expect(menuQuery).toContain("is_deleted = false");

      const insertOrderSql = mockClient.query.mock.calls[1][0] as string;
      expect(insertOrderSql).toContain("INSERT INTO orders");

      const insertItem1 = mockClient.query.mock.calls[2][0] as string;
      expect(insertItem1).toContain("INSERT INTO order_items");

      expect(result.total).toBe(33.0);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].quantity).toBe(2);
    });

    it("should compute correct total from items", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: "menu-1", price: 15.0 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [makeOrder({ total: 45.0 })],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockTransaction.mockImplementationOnce(async (cb: Function) => cb(mockClient));

      const result = await OrderModel.create({
        user_id: "user-1",
        items: [{ menu_item_id: "menu-1", quantity: 3 }],
      });

      expect(result.total).toBe(45.0);
    });

    it("should throw when a menu item is not found or unavailable", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockClient.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      mockTransaction.mockImplementationOnce(async (cb: Function) => cb(mockClient));

      await expect(
        OrderModel.create({
          user_id: "user-1",
          items: [{ menu_item_id: "nonexistent-menu", quantity: 1 }],
        })
      ).rejects.toThrow("Menu item nonexistent-menu not found or unavailable");
    });

    it("should include notes when provided", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: "menu-1", price: 10.0 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [makeOrder({ notes: "No onions" })],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockTransaction.mockImplementationOnce(async (cb: Function) => cb(mockClient));

      const result = await OrderModel.create({
        user_id: "user-1",
        items: [{ menu_item_id: "menu-1", quantity: 1 }],
        notes: "No onions",
      });

      expect(result.notes).toBe("No onions");
    });

    it("should default status to pending", async () => {
      const mockClient = {
        query: vi.fn(),
      };

      mockClient.query
        .mockResolvedValueOnce({
          rows: [{ id: "menu-1", price: 10.0 }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [makeOrder({ status: "pending" })],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rowCount: 1 });

      mockTransaction.mockImplementationOnce(async (cb: Function) => cb(mockClient));

      const result = await OrderModel.create({
        user_id: "user-1",
        items: [{ menu_item_id: "menu-1", quantity: 1 }],
      });

      expect(result.status).toBe("pending");
    });
  });

  describe("findById", () => {
    it("should return the order with its items", async () => {
      const order = makeOrder();
      const items = [
        makeOrderItem({ order_id: "order-uuid-1" }),
        makeOrderItem({ id: "item-2", order_id: "order-uuid-1", quantity: 1, subtotal: 12.5 }),
      ];

      mockQuery
        .mockResolvedValueOnce({
          rows: [order],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: items,
          rowCount: 2,
          oid: 0,
          command: "SELECT",
        });

      const result = await OrderModel.findById("order-uuid-1");

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result).not.toBeNull();
      expect(result!.id).toBe("order-uuid-1");
      expect(result!.items).toHaveLength(2);
      expect(result!.items[0].order_id).toBe("order-uuid-1");
    });

    it("should return null when order does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await OrderModel.findById("nonexistent-order");

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should return empty items array when order has no items", async () => {
      const order = makeOrder();

      mockQuery
        .mockResolvedValueOnce({
          rows: [order],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
          oid: 0,
          command: "SELECT",
        });

      const result = await OrderModel.findById("order-uuid-1");

      expect(result!.items).toEqual([]);
    });
  });

  describe("findByUserId", () => {
    it("should return all orders for the given user with their items", async () => {
      const orders = [
        makeOrder({ id: "order-1", user_id: "user-1" }),
        makeOrder({ id: "order-2", user_id: "user-1", status: "confirmed" }),
      ];

      mockQuery
        .mockResolvedValueOnce({
          rows: orders,
          rowCount: 2,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [makeOrderItem({ order_id: "order-1" })],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [makeOrderItem({ order_id: "order-2", id: "item-3" })],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        });

      const result = await OrderModel.findByUserId("user-1");

      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledTimes(3);
      expect(result[0].items).toHaveLength(1);
      expect(result[1].items).toHaveLength(1);
    });

    it("should return empty array when user has no orders", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await OrderModel.findByUserId("user-no-orders");

      expect(result).toEqual([]);
    });

    it("should query orders ordered by created_at DESC", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      await OrderModel.findByUserId("user-1");

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("ORDER BY created_at DESC");
    });
  });

  describe("updateStatus", () => {
    it("should update the order status", async () => {
      const updatedOrder = makeOrder({ status: "confirmed" });

      mockQuery.mockResolvedValueOnce({
        rows: [updatedOrder],
        rowCount: 1,
        oid: 0,
        command: "UPDATE",
      });

      const result = await OrderModel.updateStatus({
        orderId: "order-uuid-1",
        status: "confirmed",
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("UPDATE orders SET status =");
      expect(params[0]).toBe("confirmed");
      expect(params[2]).toBe("order-uuid-1");
      expect(result?.status).toBe("confirmed");
    });

    it("should return null when order does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "UPDATE",
      });

      const result = await OrderModel.updateStatus({
        orderId: "nonexistent",
        status: "delivered",
      });

      expect(result).toBeNull();
    });

    it("should allow transitioning through all statuses", async () => {
      const statuses = ["confirmed", "preparing", "ready", "delivered"] as const;

      for (const status of statuses) {
        mockQuery.mockResolvedValueOnce({
          rows: [makeOrder({ status })],
          rowCount: 1,
          oid: 0,
          command: "UPDATE",
        });

        const result = await OrderModel.updateStatus({
          orderId: "order-uuid-1",
          status,
        });

        expect(result?.status).toBe(status);
      }
    });
  });

  describe("calculateTotal", () => {
    it("should compute the correct total from order items", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 33.5 }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await OrderModel.calculateTotal("order-uuid-1");

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("SUM(subtotal)");
      expect(params[0]).toBe("order-uuid-1");
      expect(result).toBe(33.5);
    });

    it("should return 0 when order has no items", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: 0 }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await OrderModel.calculateTotal("empty-order");

      expect(result).toBe(0);
    });

    it("should handle null total gracefully", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: null }],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await OrderModel.calculateTotal("order-uuid-1");

      expect(result).toBe(0);
    });
  });
});
