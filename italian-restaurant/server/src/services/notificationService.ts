import { NotificationModel, NotificationType, CreateNotificationInput } from "../models/notification";
import { emitToUser, emitToAdmins } from "../config/socket";

interface CreateNotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  pushToAdmin?: boolean;
}

export const notificationService = {
  async create(payload: CreateNotificationPayload): Promise<void> {
    const notification = await NotificationModel.create({
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      data: payload.data,
    });

    emitToUser(payload.userId, "notification:new", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      createdAt: notification.created_at,
    });

    if (payload.pushToAdmin) {
      emitToAdmins("notification:admin", {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        userId: payload.userId,
        createdAt: notification.created_at,
      });
    }
  },

  async sendOrderUpdate(
    userId: string,
    orderId: string,
    status: string,
    estimatedTime?: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      confirmed: "Your order has been confirmed and is being prepared.",
      preparing: "Your order is now being prepared in the kitchen.",
      ready: "Your order is ready for pickup!",
      delivered: "Your order has been delivered. Enjoy your meal!",
      cancelled: "Your order has been cancelled.",
    };

    const title = `Order #${orderId.slice(0, 8).toUpperCase()} - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
    const message = statusMessages[status] || `Your order status has been updated to ${status}.`;

    await this.create({
      userId,
      type: "order_update",
      title,
      message,
      data: { orderId, status, estimatedTime },
      pushToAdmin: false,
    });
  },

  async sendReservationConfirmation(
    userId: string,
    reservationId: string,
    date: string,
    time: string,
    partySize: number
  ): Promise<void> {
    await this.create({
      userId,
      type: "reservation_confirm",
      title: "Reservation Confirmed",
      message: `Your reservation for ${partySize} guests on ${date} at ${time} has been confirmed.`,
      data: { reservationId, date, time, partySize },
    });
  },

  async sendReservationUpdate(
    userId: string,
    reservationId: string,
    status: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      confirmed: "Your reservation has been confirmed.",
      cancelled: "Your reservation has been cancelled.",
      completed: "Your reservation has been marked as completed.",
    };

    await this.create({
      userId,
      type: "reservation_confirm",
      title: `Reservation ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: statusMessages[status] || `Your reservation status has been updated to ${status}.`,
      data: { reservationId, status },
    });
  },

  async sendNewOrderToAdmin(
    orderId: string,
    customerName: string,
    total: number,
    itemCount: number
  ): Promise<void> {
    emitToAdmins("order:new", {
      orderId,
      customerName,
      total,
      itemCount,
      createdAt: new Date().toISOString(),
    });
  },

  async sendPromotion(
    userId: string,
    title: string,
    message: string,
    promoCode?: string
  ): Promise<void> {
    await this.create({
      userId,
      type: "promotion",
      title,
      message,
      data: promoCode ? { promoCode } : undefined,
    });
  },

  async sendSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.create({
      userId,
      type: "system",
      title,
      message,
      data,
    });
  },

  async getUserNotifications(userId: string, unreadOnly?: boolean) {
    return NotificationModel.findByUserId(userId, unreadOnly);
  },

  async markAsRead(notificationId: string) {
    return NotificationModel.markAsRead(notificationId);
  },

  async markAllAsRead(userId: string) {
    return NotificationModel.markAllAsRead(userId);
  },

  async deleteNotification(notificationId: string) {
    return NotificationModel.delete(notificationId);
  },

  async getUnreadCount(userId: string) {
    return NotificationModel.getUnreadCount(userId);
  },
};
