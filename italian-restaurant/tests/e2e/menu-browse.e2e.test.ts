import { describe, it, expect, vi, beforeEach } from "vitest";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

class MenuBrowsePage {
  private allItems: MenuItem[] = [
    { id: "m1", name: "Pizza Margherita", description: "Classic tomato, mozzarella, basil", price: 12.50, category: "pizza", image_url: "https://images.example.com/margherita.jpg", is_available: true },
    { id: "m2", name: "Pizza Diavola", description: "Spicy salami pizza", price: 14.00, category: "pizza", image_url: "https://images.example.com/diavola.jpg", is_available: true },
    { id: "m3", name: "Spaghetti Carbonara", description: "Roman classic with guanciale", price: 13.50, category: "pasta", image_url: "https://images.example.com/carbonara.jpg", is_available: true },
    { id: "m4", name: "Tagliatelle al Ragù", description: "Fresh egg pasta with meat ragù", price: 14.00, category: "pasta", image_url: "https://images.example.com/bolognese.jpg", is_available: true },
    { id: "m5", name: "Tiramisù", description: "Espresso-soaked ladyfingers, mascarpone", price: 8.00, category: "desserts", image_url: "https://images.example.com/tiramisu.jpg", is_available: true },
    { id: "m6", name: "Chianti Classico", description: "Tuscan red wine", price: 22.00, category: "drinks", image_url: null, is_available: true },
    { id: "m7", name: "Risotto ai Funghi", description: "Creamy risotto with porcini", price: 15.00, category: "pasta", image_url: null, is_available: false },
  ];

  private cart: CartItem[] = [];
  private currentView: string = "menu";
  private searchQuery: string = "";
  private activeFilter: string | null = null;
  private selectedItem: MenuItem | null = null;

  async loadMenu(): Promise<MenuItem[]> {
    this.currentView = "menu";
    return this.allItems.filter((item) => item.is_available);
  }

  async filterByCategory(category: string): Promise<MenuItem[]> {
    this.activeFilter = category;
    this.currentView = "menu";
    return this.allItems.filter((item) => item.is_available && item.category === category);
  }

  async searchMenu(query: string): Promise<MenuItem[]> {
    this.searchQuery = query;
    this.currentView = "menu";
    const lowerQuery = query.toLowerCase();
    return this.allItems.filter(
      (item) =>
        item.is_available &&
        (item.name.toLowerCase().includes(lowerQuery) ||
          item.description.toLowerCase().includes(lowerQuery))
    );
  }

  async viewDishDetails(itemId: string): Promise<MenuItem | null> {
    const item = this.allItems.find((i) => i.id === itemId) || null;
    this.selectedItem = item;
    if (item) this.currentView = "details";
    return item;
  }

  async addToCart(itemId: string, quantity: number = 1): Promise<CartItem[]> {
    const item = this.allItems.find((i) => i.id === itemId);
    if (!item) throw new Error("Item not found");
    if (!item.is_available) throw new Error("Item is not available");

    const existing = this.cart.find((c) => c.menuItem.id === itemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ menuItem: item, quantity });
    }

    this.currentView = "cart";
    return this.cart;
  }

  getCart(): CartItem[] {
    return this.cart;
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }

  getCartItemCount(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  getCurrentView(): string {
    return this.currentView;
  }

  getActiveFilter(): string | null {
    return this.activeFilter;
  }

  getSelectedItem(): MenuItem | null {
    return this.selectedItem;
  }
}

describe("Menu Browsing E2E", () => {
  let menuPage: MenuBrowsePage;

  beforeEach(() => {
    vi.clearAllMocks();
    menuPage = new MenuBrowsePage();
  });

  it("should load menu page and display available items", async () => {
    const items = await menuPage.loadMenu();

    expect(items.length).toBe(6);
    expect(items.every((i) => i.is_available)).toBe(true);
    expect(menuPage.getCurrentView()).toBe("menu");
  });

  it("should not display unavailable items", async () => {
    const items = await menuPage.loadMenu();

    const unavailable = items.find((i) => i.name === "Risotto ai Funghi");
    expect(unavailable).toBeUndefined();
  });

  it("should filter by pizza category", async () => {
    const items = await menuPage.filterByCategory("pizza");

    expect(items).toHaveLength(2);
    expect(items.every((i) => i.category === "pizza")).toBe(true);
    expect(menuPage.getActiveFilter()).toBe("pizza");
  });

  it("should filter by pasta category", async () => {
    const items = await menuPage.filterByCategory("pasta");

    expect(items).toHaveLength(2);
    expect(items.every((i) => i.category === "pasta")).toBe(true);
  });

  it("should filter by desserts category", async () => {
    const items = await menuPage.filterByCategory("desserts");

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Tiramisù");
  });

  it("should return empty array for nonexistent category", async () => {
    const items = await menuPage.filterByCategory("appetizers");

    expect(items).toHaveLength(0);
  });

  it("should search for dish by name", async () => {
    const items = await menuPage.searchMenu("carbonara");

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Spaghetti Carbonara");
  });

  it("should search for dish by description", async () => {
    const items = await menuPage.searchMenu("spicy");

    expect(items).toHaveLength(1);
    expect(items[0].name).toBe("Pizza Diavola");
  });

  it("should return multiple results for partial match", async () => {
    const items = await menuPage.searchMenu("pizza");

    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.every((i) => i.name.toLowerCase().includes("pizza") || i.description.toLowerCase().includes("pizza"))).toBe(true);
  });

  it("should return empty array when no items match search", async () => {
    const items = await menuPage.searchMenu("sushi");

    expect(items).toHaveLength(0);
  });

  it("should view dish details", async () => {
    const item = await menuPage.viewDishDetails("m1");

    expect(item).not.toBeNull();
    expect(item!.name).toBe("Pizza Margherita");
    expect(item!.price).toBe(12.50);
    expect(menuPage.getCurrentView()).toBe("details");
  });

  it("should return null for nonexistent item details", async () => {
    const item = await menuPage.viewDishDetails("nonexistent");

    expect(item).toBeNull();
    expect(menuPage.getCurrentView()).toBe("menu");
  });

  it("should add item to cart", async () => {
    const cart = await menuPage.addToCart("m1", 1);

    expect(cart).toHaveLength(1);
    expect(cart[0].menuItem.name).toBe("Pizza Margherita");
    expect(cart[0].quantity).toBe(1);
    expect(menuPage.getCurrentView()).toBe("cart");
  });

  it("should add item with default quantity of 1", async () => {
    const cart = await menuPage.addToCart("m3");

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(1);
  });

  it("should increase quantity when adding same item again", async () => {
    await menuPage.addToCart("m1", 2);
    const cart = await menuPage.addToCart("m1", 3);

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(5);
  });

  it("should calculate cart total correctly", async () => {
    await menuPage.addToCart("m1", 2);
    await menuPage.addToCart("m5", 1);

    const total = menuPage.getCartTotal();

    expect(total).toBe(12.50 * 2 + 8.00);
  });

  it("should track cart item count", async () => {
    await menuPage.addToCart("m1", 2);
    await menuPage.addToCart("m3", 1);

    expect(menuPage.getCartItemCount()).toBe(3);
  });

  it("should throw error when adding unavailable item to cart", async () => {
    await expect(menuPage.addToCart("m7", 1)).rejects.toThrow("Item is not available");
  });

  it("should throw error when adding nonexistent item to cart", async () => {
    await expect(menuPage.addToCart("nonexistent", 1)).rejects.toThrow("Item not found");
  });

  it("should track selected item after viewing details", async () => {
    await menuPage.viewDishDetails("m2");

    const selected = menuPage.getSelectedItem();

    expect(selected).not.toBeNull();
    expect(selected!.id).toBe("m2");
    expect(selected!.name).toBe("Pizza Diavola");
  });

  it("should handle complete browse-add-view flow", async () => {
    const allItems = await menuPage.loadMenu();
    expect(allItems.length).toBeGreaterThan(0);

    const filtered = await menuPage.filterByCategory("pizza");
    expect(filtered.length).toBeGreaterThan(0);

    const details = await menuPage.viewDishDetails(filtered[0].id);
    expect(details).not.toBeNull();

    const cart = await menuPage.addToCart(filtered[0].id, 2);
    expect(cart).toHaveLength(1);
    expect(menuPage.getCartTotal()).toBe(filtered[0].price * 2);
  });
});
