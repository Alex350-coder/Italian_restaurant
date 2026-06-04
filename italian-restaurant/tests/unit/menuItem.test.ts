import { describe, it, expect, vi, beforeEach } from "vitest";
import { MenuItemModel, MenuItem } from "../../server/src/models/menuItem";

vi.mock("../../server/src/config/database", () => ({
  query: vi.fn(),
}));

import { query } from "../../server/src/config/database";

const mockQuery = vi.mocked(query);

function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: "item-uuid-1",
    name: "Pizza Margherita",
    description: "Classic tomato, mozzarella, basil",
    price: 12.5,
    category: "pizza",
    image_url: "https://images.example.com/margherita.jpg",
    is_available: true,
    is_deleted: false,
    created_at: new Date("2026-01-01"),
    updated_at: new Date("2026-01-01"),
    ...overrides,
  };
}

describe("MenuItemModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a menu item and return the full object", async () => {
      const input = {
        name: "Pizza Margherita",
        description: "Classic tomato, mozzarella, basil",
        price: 12.5,
        category: "pizza",
        image_url: "https://images.example.com/margherita.jpg",
      };

      const createdItem = makeMenuItem();
      mockQuery.mockResolvedValueOnce({
        rows: [createdItem],
        rowCount: 1,
        oid: 0,
        command: "INSERT",
      });

      const result = await MenuItemModel.create(input);

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("INSERT INTO menu_items");
      expect(params[1]).toBe("Pizza Margherita");
      expect(params[2]).toBe("Classic tomato, mozzarella, basil");
      expect(params[3]).toBe(12.5);
      expect(params[4]).toBe("pizza");
      expect(params[5]).toBe("https://images.example.com/margherita.jpg");
      expect(result.id).toBe("item-uuid-1");
      expect(result.is_available).toBe(true);
      expect(result.is_deleted).toBe(false);
    });

    it("should default is_available to true when not provided", async () => {
      const input = {
        name: "Test Item",
        description: "Test",
        price: 5.0,
        category: "test",
      };

      const createdItem = makeMenuItem({ name: "Test Item" });
      mockQuery.mockResolvedValueOnce({
        rows: [createdItem],
        rowCount: 1,
        oid: 0,
        command: "INSERT",
      });

      await MenuItemModel.create(input);

      const params = mockQuery.mock.calls[0][1];
      expect(params[6]).toBe(true);
    });

    it("should set image_url to null when not provided", async () => {
      const input = {
        name: "No Image Item",
        description: "No image",
        price: 5.0,
        category: "test",
      };

      const createdItem = makeMenuItem({ image_url: null, name: "No Image Item" });
      mockQuery.mockResolvedValueOnce({
        rows: [createdItem],
        rowCount: 1,
        oid: 0,
        command: "INSERT",
      });

      await MenuItemModel.create(input);

      const params = mockQuery.mock.calls[0][1];
      expect(params[5]).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return all non-deleted menu items when no filters are provided", async () => {
      const items = [
        makeMenuItem({ id: "1", name: "Margherita", category: "pizza" }),
        makeMenuItem({ id: "2", name: "Carbonara", category: "pasta" }),
        makeMenuItem({ id: "3", name: "Tiramisu", category: "desserts" }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: items,
        rowCount: 3,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.findAll();

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("is_deleted = false");
      expect(sql).toContain("ORDER BY category, name");
      expect(params).toEqual([]);
      expect(result).toHaveLength(3);
    });

    it("should filter by category when provided", async () => {
      const pizzaItems = [
        makeMenuItem({ id: "1", name: "Margherita", category: "pizza" }),
        makeMenuItem({ id: "2", name: "Diavola", category: "pizza" }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: pizzaItems,
        rowCount: 2,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.findAll({ category: "pizza" });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("category = $1");
      expect(params).toEqual(["pizza"]);
      expect(result).toHaveLength(2);
      expect(result.every((item) => item.category === "pizza")).toBe(true);
    });

    it("should filter by is_available when provided", async () => {
      const availableItems = [
        makeMenuItem({ id: "1", is_available: true }),
        makeMenuItem({ id: "2", is_available: true }),
      ];

      mockQuery.mockResolvedValueOnce({
        rows: availableItems,
        rowCount: 2,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.findAll({ is_available: true });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("is_available = $1");
      expect(params).toEqual([true]);
      expect(result).toHaveLength(2);
    });

    it("should return empty array when no items match", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.findAll({ category: "nonexistent" });

      expect(result).toEqual([]);
    });

    it("should combine multiple filters", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      await MenuItemModel.findAll({ category: "pizza", is_available: true });

      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("category = $1");
      expect(sql).toContain("is_available = $2");
      expect(params).toEqual(["pizza", true]);
    });
  });

  describe("findById", () => {
    it("should return the menu item when found", async () => {
      const item = makeMenuItem();
      mockQuery.mockResolvedValueOnce({
        rows: [item],
        rowCount: 1,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.findById("item-uuid-1");

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("SELECT * FROM menu_items WHERE id = $1");
      expect(sql).toContain("is_deleted = false");
      expect(params[0]).toBe("item-uuid-1");
      expect(result).toEqual(item);
    });

    it("should return null when item is not found", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.findById("nonexistent-id");

      expect(result).toBeNull();
    });

    it("should exclude soft-deleted items", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      await MenuItemModel.findById("deleted-item-id");

      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("is_deleted = false");
    });
  });

  describe("update", () => {
    it("should update specified fields of a menu item", async () => {
      const existingItem = makeMenuItem();
      const updatedItem = makeMenuItem({ name: "Pizza Quattro Stagioni", price: 15.0 });

      mockQuery
        .mockResolvedValueOnce({
          rows: [existingItem],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [updatedItem],
          rowCount: 1,
          oid: 0,
          command: "UPDATE",
        });

      const result = await MenuItemModel.update("item-uuid-1", {
        name: "Pizza Quattro Stagioni",
        price: 15.0,
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result?.name).toBe("Pizza Quattro Stagioni");
      expect(result?.price).toBe(15.0);
    });

    it("should return null when item does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "SELECT",
      });

      const result = await MenuItemModel.update("nonexistent-id", {
        name: "Updated",
      });

      expect(result).toBeNull();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should update only provided fields", async () => {
      const existingItem = makeMenuItem();
      const updatedItem = makeMenuItem({ description: "Updated description" });

      mockQuery
        .mockResolvedValueOnce({
          rows: [existingItem],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [updatedItem],
          rowCount: 1,
          oid: 0,
          command: "UPDATE",
        });

      await MenuItemModel.update("item-uuid-1", {
        description: "Updated description",
      });

      const [updateSql] = mockQuery.mock.calls[1];
      expect(updateSql).toContain("description = $1");
      expect(updateSql).not.toContain("name = $");
      expect(updateSql).not.toContain("price = $");
    });

    it("should always update the updated_at timestamp", async () => {
      const existingItem = makeMenuItem();
      const updatedItem = makeMenuItem({ name: "New Name" });

      mockQuery
        .mockResolvedValueOnce({
          rows: [existingItem],
          rowCount: 1,
          oid: 0,
          command: "SELECT",
        })
        .mockResolvedValueOnce({
          rows: [updatedItem],
          rowCount: 1,
          oid: 0,
          command: "UPDATE",
        });

      await MenuItemModel.update("item-uuid-1", { name: "New Name" });

      const [updateSql] = mockQuery.mock.calls[1];
      expect(updateSql).toContain("updated_at");
    });
  });

  describe("delete (soft delete)", () => {
    it("should mark the item as deleted", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
        oid: 0,
        command: "UPDATE",
      });

      const result = await MenuItemModel.delete("item-uuid-1");

      expect(mockQuery).toHaveBeenCalledTimes(1);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("is_deleted = true");
      expect(sql).toContain("is_deleted = false");
      expect(params[1]).toBe("item-uuid-1");
      expect(result).toBe(true);
    });

    it("should return false when item does not exist", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "UPDATE",
      });

      const result = await MenuItemModel.delete("nonexistent-id");

      expect(result).toBe(false);
    });

    it("should not affect already deleted items", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        oid: 0,
        command: "UPDATE",
      });

      const result = await MenuItemModel.delete("already-deleted-id");

      expect(result).toBe(false);
      const [sql] = mockQuery.mock.calls[0];
      expect(sql).toContain("is_deleted = false");
    });
  });
});
