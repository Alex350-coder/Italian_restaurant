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

interface ShippingInfo {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface OrderConfirmation {
  orderId: string;
  status: string;
  total: number;
  estimatedDelivery: string;
}

class OrderFlowPage {
  private cart: CartItem[] = [];
  private currentStep: string = "menu";

  async browseMenu(): Promise<MenuItem[]> {
    this.currentStep = "menu";
    return [
      { id: "m1", name: "Pizza Margherita", description: "Classic", price: 12.50, category: "pizza", image_url: null, is_available: true },
      { id: "m2", name: "Spaghetti Carbonara", description: "Roman classic", price: 13.50, category: "pasta", image_url: null, is_available: true },
      { id: "m3", name: "Tiramisù", description: "Classic dessert", price: 8.00, category: "desserts", image_url: null, is_available: true },
    ];
  }

  async addToCart(menuItemId: string, quantity: number): Promise<CartItem[]> {
    const items = await this.browseMenu();
    const item = items.find((i) => i.id === menuItemId);
    if (!item) throw new Error("Item not found");

    const existing = this.cart.find((c) => c.menuItem.id === menuItemId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.cart.push({ menuItem: item, quantity });
    }

    this.currentStep = "cart";
    return this.cart;
  }

  getCart(): CartItem[] {
    return this.cart;
  }

  getCartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  }

  async proceedToCheckout(): Promise<string> {
    if (this.cart.length === 0) throw new Error("Cart is empty");
    this.currentStep = "checkout";
    return "checkout";
  }

  async fillShippingInfo(info: ShippingInfo): Promise<boolean> {
    if (!info.name || !info.address || !info.city || !info.postalCode || !info.phone) {
      throw new Error("All shipping fields are required");
    }
    this.currentStep = "payment";
    return true;
  }

  async completePayment(paymentMethodId: string): Promise<OrderConfirmation> {
    if (!paymentMethodId) throw new Error("Payment method required");

    this.currentStep = "confirmation";
    return {
      orderId: `ord-${Date.now()}`,
      status: "confirmed",
      total: this.getCartTotal(),
      estimatedDelivery: "30-45 minutes",
    };
  }

  async trackOrder(orderId: string): Promise<{ status: string; estimatedTime: string }> {
    return {
      status: "preparing",
      estimatedTime: "25 minutes",
    };
  }

  getCurrentStep(): string {
    return this.currentStep;
  }
}

describe("Order Flow E2E", () => {
  let orderPage: OrderFlowPage;

  beforeEach(() => {
    vi.clearAllMocks();
    orderPage = new OrderFlowPage();
  });

  it("should browse the menu and display items", async () => {
    const items = await orderPage.browseMenu();

    expect(items).toHaveLength(3);
    expect(items[0].name).toBe("Pizza Margherita");
    expect(items[1].name).toBe("Spaghetti Carbonara");
    expect(items[2].name).toBe("Tiramisù");
    expect(orderPage.getCurrentStep()).toBe("menu");
  });

  it("should add items to cart", async () => {
    await orderPage.addToCart("m1", 2);
    const cart = orderPage.getCart();

    expect(cart).toHaveLength(1);
    expect(cart[0].menuItem.name).toBe("Pizza Margherita");
    expect(cart[0].quantity).toBe(2);
    expect(orderPage.getCurrentStep()).toBe("cart");
  });

  it("should calculate cart total correctly", async () => {
    await orderPage.addToCart("m1", 2);
    await orderPage.addToCart("m3", 1);

    const total = orderPage.getCartTotal();

    expect(total).toBe(12.50 * 2 + 8.00);
  });

  it("should increase quantity when adding same item twice", async () => {
    await orderPage.addToCart("m1", 1);
    await orderPage.addToCart("m1", 3);

    const cart = orderPage.getCart();

    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(4);
  });

  it("should proceed to checkout from cart", async () => {
    await orderPage.addToCart("m1", 1);

    const step = await orderPage.proceedToCheckout();

    expect(step).toBe("checkout");
    expect(orderPage.getCurrentStep()).toBe("checkout");
  });

  it("should fail to checkout with empty cart", async () => {
    await expect(orderPage.proceedToCheckout()).rejects.toThrow("Cart is empty");
  });

  it("should fill shipping information", async () => {
    await orderPage.addToCart("m1", 1);
    await orderPage.proceedToCheckout();

    const result = await orderPage.fillShippingInfo({
      name: "Mario Rossi",
      address: "Via Roma 1",
      city: "Roma",
      postalCode: "00100",
      phone: "+39 333 1234567",
    });

    expect(result).toBe(true);
    expect(orderPage.getCurrentStep()).toBe("payment");
  });

  it("should fail with incomplete shipping info", async () => {
    await orderPage.addToCart("m1", 1);
    await orderPage.proceedToCheckout();

    await expect(
      orderPage.fillShippingInfo({
        name: "Mario",
        address: "",
        city: "",
        postalCode: "",
        phone: "",
      })
    ).rejects.toThrow("All shipping fields are required");
  });

  it("should complete payment and show confirmation", async () => {
    await orderPage.addToCart("m1", 2);
    await orderPage.addToCart("m2", 1);
    await orderPage.proceedToCheckout();
    await orderPage.fillShippingInfo({
      name: "Mario Rossi",
      address: "Via Roma 1",
      city: "Roma",
      postalCode: "00100",
      phone: "+39 333 1234567",
    });

    const confirmation = await orderPage.completePayment("pm_card_visa");

    expect(confirmation.orderId).toBeDefined();
    expect(confirmation.status).toBe("confirmed");
    expect(confirmation.total).toBe(12.50 * 2 + 13.50);
    expect(confirmation.estimatedDelivery).toBe("30-45 minutes");
    expect(orderPage.getCurrentStep()).toBe("confirmation");
  });

  it("should track order status after completion", async () => {
    const tracking = await orderPage.trackOrder("ord-123");

    expect(tracking.status).toBe("preparing");
    expect(tracking.estimatedTime).toBe("25 minutes");
  });

  it("should handle complete flow with single item", async () => {
    await orderPage.addToCart("m3", 1);
    await orderPage.proceedToCheckout();
    await orderPage.fillShippingInfo({
      name: "Luca Bianchi",
      address: "Via Napoli 42",
      city: "Napoli",
      postalCode: "80100",
      phone: "+39 333 9876543",
    });

    const confirmation = await orderPage.completePayment("pm_card_mastercard");

    expect(confirmation.total).toBe(8.00);
    expect(confirmation.status).toBe("confirmed");
  });
});
