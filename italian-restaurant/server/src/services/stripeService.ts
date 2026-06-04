import { v4 as uuidv4 } from "uuid";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "refunded";

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  createdAt: Date;
}

export interface CreatePaymentInput {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod?: "card" | "cash";
  cardToken?: string;
}

export interface RefundInput {
  paymentId: string;
  reason?: string;
}

const paymentStore = new Map<string, PaymentResult>();

export const stripeService = {
  async createPaymentIntent(input: CreatePaymentInput): Promise<PaymentResult> {
    console.log(`[STRIPE MOCK] Creating payment for order ${input.orderId}`);
    console.log(`[STRIPE MOCK] Amount: ${input.amount} ${input.currency || "usd"}`);

    const shouldFail = input.amount <= 0 || input.amount > 10000;

    const result: PaymentResult = {
      paymentId: `pi_${uuidv4().replace(/-/g, "").slice(0, 24)}`,
      status: shouldFail ? "failed" : "succeeded",
      amount: input.amount,
      currency: input.currency || "usd",
      createdAt: new Date(),
    };

    paymentStore.set(result.paymentId, result);

    console.log(`[STRIPE MOCK] Payment ${result.paymentId}: ${result.status}`);
    return result;
  },

  async getPayment(paymentId: string): Promise<PaymentResult | null> {
    return paymentStore.get(paymentId) || null;
  },

  async refundPayment(input: RefundInput): Promise<PaymentResult | null> {
    console.log(`[STRIPE MOCK] Refunding payment ${input.paymentId}`);

    const payment = paymentStore.get(input.paymentId);
    if (!payment) {
      return null;
    }

    if (payment.status !== "succeeded") {
      throw new Error("Cannot refund a payment that was not successful");
    }

    const refundedPayment: PaymentResult = {
      ...payment,
      status: "refunded",
    };

    paymentStore.set(input.paymentId, refundedPayment);

    console.log(`[STRIPE MOCK] Payment ${input.paymentId} refunded`);
    return refundedPayment;
  },

  async getPaymentsByOrder(orderId: string): Promise<PaymentResult[]> {
    const payments: PaymentResult[] = [];
    paymentStore.forEach((payment) => {
      if (payment.paymentId.startsWith("pi_")) {
        payments.push(payment);
      }
    });
    return payments;
  },
};
