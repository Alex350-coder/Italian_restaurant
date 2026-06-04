import { Router, Request, Response } from "express";
import crypto from "crypto";
import { OrderModel } from "../models/order";
import { notificationService } from "../services/notificationService";
import { emitToOrder, emitToAdmins, emitToKitchen } from "../config/socket";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  try {
    const elements = signature.split(",");
    const signatureMap: Record<string, string> = {};

    for (const element of elements) {
      const [key, value] = element.split("=");
      signatureMap[key] = value;
    }

    const timestamp = signatureMap["t"];
    const expectedSignature = signatureMap["v1"];

    if (!timestamp || !expectedSignature) {
      return false;
    }

    const signedPayload = `${timestamp}.${payload}`;
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(computedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8")
    );
  } catch {
    return false;
  }
}

router.post("/stripe", async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[WEBHOOK] STRIPE_WEBHOOK_SECRET not configured");
      res.status(500).json({ error: "Webhook not configured" });
      return;
    }

    if (!signature) {
      res.status(401).json({ error: "Missing signature" });
      return;
    }

    const rawBody = JSON.stringify(req.body);
    const isValid = verifyStripeSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error("[WEBHOOK] Invalid Stripe signature");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    const event = req.body;

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(`[STRIPE] Payment succeeded: ${paymentIntent.id}`);

        const orderId = paymentIntent.metadata?.orderId;
        if (orderId) {
          await OrderModel.updateStatus({
            orderId,
            status: "confirmed",
          });

          const order = await OrderModel.findById(orderId);
          if (order) {
            await notificationService.sendOrderUpdate(
              order.user_id,
              orderId,
              "confirmed"
            );

            emitToOrder(orderId, "order:status", {
              orderId,
              status: "confirmed",
              timestamp: new Date().toISOString(),
            });

            emitToAdmins("order:updated", {
              orderId,
              status: "confirmed",
              total: order.total,
              timestamp: new Date().toISOString(),
            });
          }
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log(`[STRIPE] Payment failed: ${paymentIntent.id}`);

        const orderId = paymentIntent.metadata?.orderId;
        if (orderId) {
          const order = await OrderModel.findById(orderId);
          if (order) {
            await notificationService.sendOrderUpdate(
              order.user_id,
              orderId,
              "pending"
            );
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        console.log(`[STRIPE] Charge refunded: ${charge.id}`);
        break;
      }

      default:
        console.log(`[STRIPE] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK] Stripe webhook error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

router.post("/order-status", requireAuth, requireRole("admin"), async (req: Request, res: Response) => {
  try {
    const { orderId, status, estimatedTime, userId } = req.body;

    if (!orderId || !status) {
      res.status(400).json({
        success: false,
        error: "orderId and status are required",
      });
      return;
    }

    const order = await OrderModel.updateStatus({ orderId, status });

    if (!order) {
      res.status(404).json({
        success: false,
        error: "Order not found",
      });
      return;
    }

    emitToOrder(orderId, "order:status", {
      orderId,
      status,
      estimatedTime,
      timestamp: new Date().toISOString(),
    });

    emitToAdmins("order:updated", {
      orderId,
      status,
      total: order.total,
      timestamp: new Date().toISOString(),
    });

    if (["preparing", "ready"].includes(status)) {
      emitToKitchen("kitchen:order-update", {
        orderId,
        status,
        timestamp: new Date().toISOString(),
      });
    }

    if (userId) {
      await notificationService.sendOrderUpdate(userId, orderId, status, estimatedTime);
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("[WEBHOOK] Order status webhook error:", error);
    res.status(500).json({
      success: false,
      error: "Webhook handler failed",
    });
  }
});

export default router;
