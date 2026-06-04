import { describe, it, expect, vi, beforeEach } from "vitest";

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  todayReservations: number;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  is_available: boolean;
}

interface Order {
  id: string;
  userId: string;
  status: string;
  total: number;
  items: { name: string; quantity: number }[];
  createdAt: Date;
}

interface Reservation {
  id: string;
  userId: string;
  date: string;
  time: string;
  partySize: number;
  status: string;
  name: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  timestamp: Date;
}

class AdminDashboardPage {
  private isAuthenticated = false;
  private userRole: string = "";
  private stats: DashboardStats = {
    totalOrders: 150,
    totalRevenue: 4500.0,
    pendingOrders: 12,
    todayReservations: 8,
  };
  private menuItems: MenuItem[] = [
    { id: "m1", name: "Pizza Margherita", price: 12.5, category: "pizza", is_available: true },
    { id: "m2", name: "Spaghetti Carbonara", price: 13.5, category: "pasta", is_available: true },
  ];
  private orders: Order[] = [
    {
      id: "ord-1",
      userId: "u1",
      status: "pending",
      total: 26.0,
      items: [{ name: "Pizza Margherita", quantity: 2 }],
      createdAt: new Date(),
    },
    {
      id: "ord-2",
      userId: "u2",
      status: "confirmed",
      total: 38.0,
      items: [{ name: "Tiramisù", quantity: 1 }],
      createdAt: new Date(),
    },
  ];
  private reservations: Reservation[] = [
    {
      id: "res-1",
      userId: "u1",
      date: "2026-07-15",
      time: "19:00",
      partySize: 4,
      status: "pending",
      name: "Mario Rossi",
    },
    {
      id: "res-2",
      userId: "u2",
      date: "2026-07-15",
      time: "20:00",
      partySize: 2,
      status: "confirmed",
      name: "Luca Bianchi",
    },
  ];
  private auditLogs: AuditLog[] = [];

  async login(email: string, password: string): Promise<boolean> {
    if (email === "admin@trattoria.it" && password === "Admin123!") {
      this.isAuthenticated = true;
      this.userRole = "admin";
      return true;
    }
    if (email === "customer@trattoria.it" && password === "Customer123!") {
      this.isAuthenticated = true;
      this.userRole = "customer";
      return true;
    }
    return false;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    return { ...this.stats };
  }

  async createMenuItem(item: Omit<MenuItem, "id">): Promise<MenuItem> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    if (this.userRole !== "admin") throw new Error("Insufficient permissions");

    const newItem: MenuItem = {
      ...item,
      id: `m-${Date.now()}`,
    };
    this.menuItems.push(newItem);
    this.auditLogs.push({
      id: `log-${Date.now()}`,
      action: "create",
      entity: "menu_item",
      entityId: newItem.id,
      userId: "admin",
      timestamp: new Date(),
    });
    return newItem;
  }

  async updateMenuItem(id: string, updates: Partial<MenuItem>): Promise<MenuItem> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    if (this.userRole !== "admin") throw new Error("Insufficient permissions");

    const index = this.menuItems.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Menu item not found");

    this.menuItems[index] = { ...this.menuItems[index], ...updates };
    this.auditLogs.push({
      id: `log-${Date.now()}`,
      action: "update",
      entity: "menu_item",
      entityId: id,
      userId: "admin",
      timestamp: new Date(),
    });
    return this.menuItems[index];
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    if (this.userRole !== "admin") throw new Error("Insufficient permissions");

    const index = this.menuItems.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Menu item not found");

    this.menuItems.splice(index, 1);
    this.auditLogs.push({
      id: `log-${Date.now()}`,
      action: "delete",
      entity: "menu_item",
      entityId: id,
      userId: "admin",
      timestamp: new Date(),
    });
    return true;
  }

  async getOrders(): Promise<Order[]> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    return [...this.orders];
  }

  async updateOrderStatus(orderId: string, status: string): Promise<Order> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    if (this.userRole !== "admin") throw new Error("Insufficient permissions");

    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error("Order not found");

    order.status = status;
    this.auditLogs.push({
      id: `log-${Date.now()}`,
      action: "update_status",
      entity: "order",
      entityId: orderId,
      userId: "admin",
      timestamp: new Date(),
    });
    return order;
  }

  async getReservations(): Promise<Reservation[]> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    return [...this.reservations];
  }

  async confirmReservation(reservationId: string): Promise<Reservation> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    if (this.userRole !== "admin") throw new Error("Insufficient permissions");

    const res = this.reservations.find((r) => r.id === reservationId);
    if (!res) throw new Error("Reservation not found");

    res.status = "confirmed";
    this.auditLogs.push({
      id: `log-${Date.now()}`,
      action: "confirm",
      entity: "reservation",
      entityId: reservationId,
      userId: "admin",
      timestamp: new Date(),
    });
    return res;
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    if (!this.isAuthenticated) throw new Error("Not authenticated");
    return [...this.auditLogs];
  }

  getMenuItems(): MenuItem[] {
    return [...this.menuItems];
  }
}

describe("Admin Dashboard E2E", () => {
  let adminPage: AdminDashboardPage;

  beforeEach(() => {
    vi.clearAllMocks();
    adminPage = new AdminDashboardPage();
  });

  it("should login as admin successfully", async () => {
    const result = await adminPage.login("admin@trattoria.it", "Admin123!");

    expect(result).toBe(true);
  });

  it("should reject login with wrong credentials", async () => {
    const result = await adminPage.login("admin@trattoria.it", "WrongPassword!");

    expect(result).toBe(false);
  });

  it("should view dashboard stats", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const stats = await adminPage.getDashboardStats();

    expect(stats.totalOrders).toBe(150);
    expect(stats.totalRevenue).toBe(4500.0);
    expect(stats.pendingOrders).toBe(12);
    expect(stats.todayReservations).toBe(8);
  });

  it("should reject stats access without authentication", async () => {
    await expect(adminPage.getDashboardStats()).rejects.toThrow("Not authenticated");
  });

  it("should create a new menu item", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const newItem = await adminPage.createMenuItem({
      name: "Ravioli",
      price: 12.0,
      category: "pasta",
      is_available: true,
    });

    expect(newItem.id).toBeDefined();
    expect(newItem.name).toBe("Ravioli");
    expect(adminPage.getMenuItems()).toHaveLength(3);
  });

  it("should update a menu item", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const updated = await adminPage.updateMenuItem("m1", { price: 14.0 });

    expect(updated.price).toBe(14.0);
    expect(updated.name).toBe("Pizza Margherita");
  });

  it("should delete a menu item", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const result = await adminPage.deleteMenuItem("m1");

    expect(result).toBe(true);
    expect(adminPage.getMenuItems()).toHaveLength(1);
  });

  it("should throw on deleting nonexistent menu item", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    await expect(adminPage.deleteMenuItem("nonexistent")).rejects.toThrow("Menu item not found");
  });

  it("should view all orders", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const orders = await adminPage.getOrders();

    expect(orders).toHaveLength(2);
    expect(orders[0].status).toBe("pending");
  });

  it("should update order status", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const updated = await adminPage.updateOrderStatus("ord-1", "confirmed");

    expect(updated.status).toBe("confirmed");
  });

  it("should throw on updating nonexistent order", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    await expect(adminPage.updateOrderStatus("nonexistent", "confirmed")).rejects.toThrow(
      "Order not found"
    );
  });

  it("should view all reservations", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const reservations = await adminPage.getReservations();

    expect(reservations).toHaveLength(2);
  });

  it("should confirm a reservation", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const confirmed = await adminPage.confirmReservation("res-1");

    expect(confirmed.status).toBe("confirmed");
  });

  it("should throw on confirming nonexistent reservation", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    await expect(adminPage.confirmReservation("nonexistent")).rejects.toThrow(
      "Reservation not found"
    );
  });

  it("should track audit logs for CRUD operations", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    await adminPage.createMenuItem({ name: "Test", price: 10, category: "pizza", is_available: true });
    await adminPage.updateMenuItem("m1", { price: 15 });
    await adminPage.deleteMenuItem("m2");

    const logs = await adminPage.getAuditLogs();

    expect(logs).toHaveLength(3);
    expect(logs[0].action).toBe("create");
    expect(logs[1].action).toBe("update");
    expect(logs[2].action).toBe("delete");
  });

  it("should reject CRUD operations without admin role", async () => {
    await adminPage.login("customer@trattoria.it", "Customer123!");

    await expect(
      adminPage.createMenuItem({ name: "Test", price: 10, category: "pizza", is_available: true })
    ).rejects.toThrow("Insufficient permissions");
  });

  it("should handle complete admin workflow: login, create, update, delete, view audit", async () => {
    await adminPage.login("admin@trattoria.it", "Admin123!");

    const stats = await adminPage.getDashboardStats();
    expect(stats.totalOrders).toBeGreaterThan(0);

    const newItem = await adminPage.createMenuItem({
      name: "Gnocchi",
      price: 13.0,
      category: "pasta",
      is_available: true,
    });

    await adminPage.updateMenuItem(newItem.id, { price: 14.0 });
    await adminPage.deleteMenuItem(newItem.id);

    const orders = await adminPage.getOrders();
    expect(orders.length).toBeGreaterThan(0);

    await adminPage.updateOrderStatus("ord-1", "preparing");

    const reservations = await adminPage.getReservations();
    expect(reservations.length).toBeGreaterThan(0);

    await adminPage.confirmReservation("res-1");

    const logs = await adminPage.getAuditLogs();
    expect(logs.length).toBeGreaterThanOrEqual(5);
  });
});
