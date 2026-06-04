import { describe, it, expect, vi, beforeEach } from "vitest";

interface SeedResult {
  users: number;
  menuItems: number;
  orders: number;
  reservations: number;
}

class SeedService {
  private queryFn: any;

  constructor(queryFn: any) {
    this.queryFn = queryFn;
  }

  async seedAdmin(): Promise<boolean> {
    const existing = await this.queryFn(
      "SELECT id FROM users WHERE email = $1",
      ["admin@trattoria.it"]
    );

    if (existing.rows.length > 0) {
      return false;
    }

    await this.queryFn(
      "INSERT INTO users (email, password_hash, name, phone, role) VALUES ($1, $2, $3, $4, $5)",
      ["admin@trattoria.it", "$2a$12$hashedadmin", "Chef Giuseppe", "+39 333 7654321", "admin"]
    );

    return true;
  }

  async seedMenuItems(): Promise<number> {
    const items = [
      { name: "Pizza Margherita", price: 12.50, category: "pizza" },
      { name: "Pizza Diavola", price: 14.00, category: "pizza" },
      { name: "Spaghetti Carbonara", price: 13.50, category: "pasta" },
      { name: "Tagliatelle al Ragù", price: 14.00, category: "pasta" },
      { name: "Tiramisù", price: 8.00, category: "desserts" },
      { name: "Panna Cotta", price: 7.50, category: "desserts" },
      { name: "Chianti Classico", price: 22.00, category: "drinks" },
      { name: "Acqua Minerale", price: 4.00, category: "drinks" },
    ];

    const existingCount = await this.queryFn("SELECT COUNT(*) as count FROM menu_items");
    const count = parseInt(existingCount.rows[0].count);

    if (count >= items.length) {
      return 0;
    }

    let inserted = 0;
    for (const item of items) {
      const existing = await this.queryFn(
        "SELECT id FROM menu_items WHERE name = $1",
        [item.name]
      );

      if (existing.rows.length === 0) {
        await this.queryFn(
          "INSERT INTO menu_items (name, description, price, category, is_available) VALUES ($1, $2, $3, $4, true)",
          [item.name, `Delicious ${item.name}`, item.price, item.category]
        );
        inserted++;
      }
    }

    return inserted;
  }

  async seedSampleOrders(): Promise<number> {
    const existingCount = await this.queryFn("SELECT COUNT(*) as count FROM orders");
    const count = parseInt(existingCount.rows[0].count);

    if (count > 0) {
      return 0;
    }

    const customer = await this.queryFn(
      "SELECT id FROM users WHERE email = $1",
      ["mario.rossi@example.com"]
    );

    if (customer.rows.length === 0) {
      return 0;
    }

    const userId = customer.rows[0].id;
    const menuItem = await this.queryFn("SELECT id FROM menu_items LIMIT 1");

    if (menuItem.rows.length === 0) {
      return 0;
    }

    await this.queryFn(
      "INSERT INTO orders (user_id, status, total, notes) VALUES ($1, $2, $3, $4)",
      [userId, "pending", 25.00, "Sample order"]
    );

    return 1;
  }

  async runSeed(): Promise<SeedResult> {
    const adminCreated = await this.seedAdmin();
    const menuItemsInserted = await this.seedMenuItems();
    const ordersInserted = await this.seedSampleOrders();

    return {
      users: adminCreated ? 1 : 0,
      menuItems: menuItemsInserted,
      orders: ordersInserted,
      reservations: 0,
    };
  }
}

describe("SeedService", () => {
  let mockQuery: any;
  let seedService: SeedService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery = vi.fn();
    seedService = new SeedService(mockQuery);
  });

  describe("seedAdmin", () => {
    it("should create admin user when none exists", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await seedService.seedAdmin();

      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery.mock.calls[0][0]).toContain("SELECT id FROM users");
      expect(mockQuery.mock.calls[1][0]).toContain("INSERT INTO users");
      expect(mockQuery.mock.calls[1][1][4]).toBe("admin");
    });

    it("should skip when admin already exists", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: "existing-admin" }] });

      const result = await seedService.seedAdmin();

      expect(result).toBe(false);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it("should use correct admin email", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });

      await seedService.seedAdmin();

      expect(mockQuery.mock.calls[0][1][0]).toBe("admin@trattoria.it");
    });
  });

  describe("seedMenuItems", () => {
    it("should insert menu items when none exist", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValue({ rows: [] });

      const result = await seedService.seedMenuItems();

      expect(result).toBe(8);
    });

    it("should skip existing items", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "8" }] });

      const result = await seedService.seedMenuItems();

      expect(result).toBe(0);
    });

    it("should not duplicate items by name", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ id: "existing-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "existing-2" }] })
        .mockResolvedValue({ rows: [] });

      const result = await seedService.seedMenuItems();

      expect(result).toBe(6);
    });

    it("should create items with correct categories", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValue({ rows: [] });

      await seedService.seedMenuItems();

      const insertCalls = mockQuery.mock.calls.filter(
        (call: any) => call[0].includes("INSERT INTO menu_items")
      );

      const categories = insertCalls.map((call: any) => call[1][3]);
      expect(categories).toContain("pizza");
      expect(categories).toContain("pasta");
      expect(categories).toContain("desserts");
      expect(categories).toContain("drinks");
    });
  });

  describe("seedSampleOrders", () => {
    it("should create sample orders when none exist", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ id: "customer-1" }] })
        .mockResolvedValueOnce({ rows: [{ id: "menu-item-1" }] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await seedService.seedSampleOrders();

      expect(result).toBe(1);
    });

    it("should skip when orders already exist", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ count: "5" }] });

      const result = await seedService.seedSampleOrders();

      expect(result).toBe(0);
    });

    it("should skip when no customer exists", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await seedService.seedSampleOrders();

      expect(result).toBe(0);
    });

    it("should skip when no menu items exist", async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: "0" }] })
        .mockResolvedValueOnce({ rows: [{ id: "customer-1" }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await seedService.seedSampleOrders();

      expect(result).toBe(0);
    });
  });

  describe("runSeed", () => {
    it("should run all seed steps and return summary", async () => {
      mockQuery.mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes("SELECT id FROM users WHERE email")) {
          if (params?.[0] === "mario.rossi@example.com") {
            return { rows: [{ id: "customer-1" }] };
          }
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO users")) {
          return { rowCount: 1 };
        }
        if (sql.includes("SELECT COUNT(*) as count FROM menu_items")) {
          return { rows: [{ count: "0" }] };
        }
        if (sql.includes("SELECT id FROM menu_items WHERE name")) {
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO menu_items")) {
          return { rowCount: 1 };
        }
        if (sql.includes("SELECT COUNT(*) as count FROM orders")) {
          return { rows: [{ count: "0" }] };
        }
        if (sql.includes("SELECT id FROM menu_items LIMIT")) {
          return { rows: [{ id: "menu-1" }] };
        }
        if (sql.includes("INSERT INTO orders")) {
          return { rowCount: 1 };
        }
        return { rows: [] };
      });

      const result = await seedService.runSeed();

      expect(result).toEqual({
        users: 1,
        menuItems: 8,
        orders: 1,
        reservations: 0,
      });
    });

    it("should handle already seeded database", async () => {
      mockQuery.mockImplementation(async (sql: string) => {
        if (sql.includes("SELECT id FROM users WHERE email")) {
          return { rows: [{ id: "existing-admin" }] };
        }
        if (sql.includes("SELECT COUNT(*) as count FROM menu_items")) {
          return { rows: [{ count: "8" }] };
        }
        if (sql.includes("SELECT COUNT(*) as count FROM orders")) {
          return { rows: [{ count: "5" }] };
        }
        return { rows: [] };
      });

      const result = await seedService.runSeed();

      expect(result).toEqual({
        users: 0,
        menuItems: 0,
        orders: 0,
        reservations: 0,
      });
    });

    it("should handle partial seeding", async () => {
      mockQuery.mockImplementation(async (sql: string, params?: any[]) => {
        if (sql.includes("SELECT id FROM users WHERE email")) {
          if (params?.[0] === "mario.rossi@example.com") {
            return { rows: [{ id: "customer-1" }] };
          }
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO users")) {
          return { rowCount: 1 };
        }
        if (sql.includes("SELECT COUNT(*) as count FROM menu_items")) {
          return { rows: [{ count: "0" }] };
        }
        if (sql.includes("SELECT id FROM menu_items WHERE name")) {
          return { rows: [] };
        }
        if (sql.includes("INSERT INTO menu_items")) {
          return { rowCount: 1 };
        }
        if (sql.includes("SELECT COUNT(*) as count FROM orders")) {
          return { rows: [{ count: "0" }] };
        }
        if (sql.includes("SELECT id FROM menu_items LIMIT")) {
          return { rows: [{ id: "menu-1" }] };
        }
        if (sql.includes("INSERT INTO orders")) {
          return { rowCount: 1 };
        }
        return { rows: [] };
      });

      const result = await seedService.runSeed();

      expect(result.users).toBe(1);
      expect(result.menuItems).toBe(8);
      expect(result.reservations).toBe(0);
    });
  });
});
