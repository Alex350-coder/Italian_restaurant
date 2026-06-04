import { describe, it, expect, vi, beforeEach } from "vitest";

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

interface PaymentConfirmation {
  id: string;
  status: string;
  amount_received: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

class StripeService {
  private stripe: any;

  constructor() {
    this.stripe = {
      paymentIntents: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
      webhooks: {
        constructEvent: vi.fn(),
      },
    };
  }

  async createPaymentIntent(amount: number, orderId: string, metadata: Record<string, string> = {}): Promise<PaymentIntent> {
    if (amount <= 0) {
      throw new Error("Payment amount must be greater than zero");
    }

    const result = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "eur",
      metadata: { orderId, ...metadata },
    });

    return {
      id: result.id,
      amount: result.amount,
      currency: result.currency,
      status: result.status,
      client_secret: result.client_secret,
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentConfirmation> {
    const result = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: result.id,
      status: result.status,
      amount_received: result.amount_received,
    };
  }

  handleWebhook(payload: string | Buffer, signature: string): WebhookEvent {
    const event = this.stripe.webhooks.constructEvent(payload, signature, "whsec_test_secret");
    return event;
  }
}

describe("StripeService", () => {
  let stripeService: StripeService;

  beforeEach(() => {
    vi.clearAllMocks();
    stripeService = new StripeService();
  });

  describe("createPaymentIntent", () => {
    it("should create a payment intent with correct amount", async () => {
      stripeService["stripe"].paymentIntents.create.mockResolvedValueOnce({
        id: "pi_123456",
        amount: 2500,
        currency: "eur",
        status: "requires_payment_method",
        client_secret: "pi_123456_secret",
      });

      const result = await stripeService.createPaymentIntent(25.00, "order-123");

      expect(result.id).toBe("pi_123456");
      expect(result.amount).toBe(2500);
      expect(result.currency).toBe("eur");
      expect(result.status).toBe("requires_payment_method");
      expect(result.client_secret).toBe("pi_123456_secret");
      expect(stripeService["stripe"].paymentIntents.create).toHaveBeenCalledWith({
        amount: 2500,
        currency: "eur",
        metadata: { orderId: "order-123" },
      });
    });

    it("should convert euros to cents correctly", async () => {
      stripeService["stripe"].paymentIntents.create.mockResolvedValueOnce({
        id: "pi_789",
        amount: 1450,
        currency: "eur",
        status: "requires_payment_method",
        client_secret: "pi_789_secret",
      });

      const result = await stripeService.createPaymentIntent(14.50, "order-456");

      expect(result.amount).toBe(1450);
      const callArgs = stripeService["stripe"].paymentIntents.create.mock.calls[0][0];
      expect(callArgs.amount).toBe(1450);
    });

    it("should throw when amount is zero or negative", async () => {
      await expect(stripeService.createPaymentIntent(0, "order-1")).rejects.toThrow(
        "Payment amount must be greater than zero"
      );
      await expect(stripeService.createPaymentIntent(-10, "order-1")).rejects.toThrow(
        "Payment amount must be greater than zero"
      );
    });

    it("should include order metadata", async () => {
      stripeService["stripe"].paymentIntents.create.mockResolvedValueOnce({
        id: "pi_meta",
        amount: 1000,
        currency: "eur",
        status: "requires_payment_method",
        client_secret: "secret",
      });

      await stripeService.createPaymentIntent(10.00, "order-meta", { customer_email: "test@example.com" });

      const callArgs = stripeService["stripe"].paymentIntents.create.mock.calls[0][0];
      expect(callArgs.metadata.orderId).toBe("order-meta");
      expect(callArgs.metadata.customer_email).toBe("test@example.com");
    });

    it("should handle Stripe API errors", async () => {
      stripeService["stripe"].paymentIntents.create.mockRejectedValueOnce(
        new Error("Amount must be at least 50 cents")
      );

      await expect(stripeService.createPaymentIntent(0.30, "order-small")).rejects.toThrow(
        "Amount must be at least 50 cents"
      );
    });
  });

  describe("confirmPayment", () => {
    it("should confirm payment and return status", async () => {
      stripeService["stripe"].paymentIntents.retrieve.mockResolvedValueOnce({
        id: "pi_123456",
        status: "succeeded",
        amount_received: 2500,
      });

      const result = await stripeService.confirmPayment("pi_123456");

      expect(result.id).toBe("pi_123456");
      expect(result.status).toBe("succeeded");
      expect(result.amount_received).toBe(2500);
      expect(stripeService["stripe"].paymentIntents.retrieve).toHaveBeenCalledWith("pi_123456");
    });

    it("should handle failed payment confirmation", async () => {
      stripeService["stripe"].paymentIntents.retrieve.mockResolvedValueOnce({
        id: "pi_failed",
        status: "requires_payment_method",
        amount_received: 0,
      });

      const result = await stripeService.confirmPayment("pi_failed");

      expect(result.status).toBe("requires_payment_method");
      expect(result.amount_received).toBe(0);
    });

    it("should handle pending payment status", async () => {
      stripeService["stripe"].paymentIntents.retrieve.mockResolvedValueOnce({
        id: "pi_pending",
        status: "processing",
        amount_received: 0,
      });

      const result = await stripeService.confirmPayment("pi_pending");

      expect(result.status).toBe("processing");
    });

    it("should throw when Stripe API returns error", async () => {
      stripeService["stripe"].paymentIntents.retrieve.mockRejectedValueOnce(
        new Error("No such payment_intent: pi_invalid")
      );

      await expect(stripeService.confirmPayment("pi_invalid")).rejects.toThrow(
        "No such payment_intent: pi_invalid"
      );
    });
  });

  describe("handleWebhook", () => {
    it("should process payment_intent.succeeded event", () => {
      const mockEvent: WebhookEvent = {
        id: "evt_123",
        type: "payment_intent.succeeded",
        data: {
          object: {
            id: "pi_123456",
            amount: 2500,
            status: "succeeded",
          },
        },
      };

      stripeService["stripe"].webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const result = stripeService.handleWebhook(
        JSON.stringify({ type: "payment_intent.succeeded" }),
        "sig_test"
      );

      expect(result.type).toBe("payment_intent.succeeded");
      expect(result.data.object.id).toBe("pi_123456");
      expect(stripeService["stripe"].webhooks.constructEvent).toHaveBeenCalled();
    });

    it("should process payment_intent.payment_failed event", () => {
      const mockEvent: WebhookEvent = {
        id: "evt_456",
        type: "payment_intent.payment_failed",
        data: {
          object: {
            id: "pi_failed",
            status: "failed",
          },
        },
      };

      stripeService["stripe"].webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const result = stripeService.handleWebhook(
        JSON.stringify({ type: "payment_intent.payment_failed" }),
        "sig_test"
      );

      expect(result.type).toBe("payment_intent.payment_failed");
    });

    it("should throw when webhook signature is invalid", () => {
      stripeService["stripe"].webhooks.constructEvent.mockImplementationOnce(() => {
        throw new Error("Webhook signature verification failed");
      });

      expect(() =>
        stripeService.handleWebhook("invalid-payload", "bad-signature")
      ).toThrow("Webhook signature verification failed");
    });

    it("should return the full event object", () => {
      const mockEvent: WebhookEvent = {
        id: "evt_789",
        type: "charge.refunded",
        data: {
          object: { id: "ch_123", amount_refunded: 2500 },
        },
      };

      stripeService["stripe"].webhooks.constructEvent.mockReturnValueOnce(mockEvent);

      const result = stripeService.handleWebhook("payload", "sig");

      expect(result.id).toBe("evt_789");
      expect(result.data.object.amount_refunded).toBe(2500);
    });
  });

  describe("payment failure handling", () => {
    it("should handle declined card errors from Stripe", async () => {
      stripeService["stripe"].paymentIntents.create.mockRejectedValueOnce({
        type: "card_error",
        message: "Your card was declined.",
        code: "card_declined",
      });

      await expect(stripeService.createPaymentIntent(10.00, "order-declined")).rejects.toMatchObject({
        message: "Your card was declined.",
        code: "card_declined",
      });
    });

    it("should handle insufficient funds errors", async () => {
      stripeService["stripe"].paymentIntents.create.mockRejectedValueOnce({
        type: "card_error",
        message: "Your card has insufficient funds.",
        code: "insufficient_funds",
      });

      await expect(stripeService.createPaymentIntent(100.00, "order-iff")).rejects.toMatchObject({
        message: "Your card has insufficient funds.",
      });
    });

    it("should handle expired card errors", async () => {
      stripeService["stripe"].paymentIntents.create.mockRejectedValueOnce({
        type: "card_error",
        message: "Your card has expired.",
        code: "expired_card",
      });

      await expect(stripeService.createPaymentIntent(10.00, "order-exp")).rejects.toMatchObject({
        message: "Your card has expired.",
      });
    });
  });
});
