import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";

export type NotificationType =
  | "order_update"
  | "reservation_confirm"
  | "promotion"
  | "system"
  | "payment"
  | "review";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any> | null;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export const NotificationModel = {
  async create(input: CreateNotificationInput): Promise<Notification> {
    const id = uuidv4();
    const now = new Date();

    const result = await query<Notification>(
      `INSERT INTO notifications (id, user_id, type, title, message, data, is_read, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        id,
        input.user_id,
        input.type,
        input.title,
        input.message,
        input.data ? JSON.stringify(input.data) : null,
        false,
        now,
        now,
      ]
    );

    return result.rows[0];
  },

  async findByUserId(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
    let sql = "SELECT * FROM notifications WHERE user_id = $1";
    const params: any[] = [userId];

    if (unreadOnly) {
      sql += " AND is_read = false";
    }

    sql += " ORDER BY created_at DESC LIMIT 50";

    const result = await query<Notification>(sql, params);
    return result.rows;
  },

  async findById(id: string): Promise<Notification | null> {
    const result = await query<Notification>(
      "SELECT * FROM notifications WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async markAsRead(id: string): Promise<Notification | null> {
    const result = await query<Notification>(
      `UPDATE notifications SET is_read = true, updated_at = $1
       WHERE id = $2
       RETURNING *`,
      [new Date(), id]
    );
    return result.rows[0] || null;
  },

  async markAllAsRead(userId: string): Promise<number> {
    const result = await query(
      `UPDATE notifications SET is_read = true, updated_at = $1
       WHERE user_id = $2 AND is_read = false`,
      [new Date(), userId]
    );
    return result.rowCount || 0;
  },

  async delete(id: string): Promise<boolean> {
    const result = await query(
      "DELETE FROM notifications WHERE id = $1",
      [id]
    );
    return (result.rowCount || 0) > 0;
  },

  async deleteByUserId(userId: string): Promise<number> {
    const result = await query(
      "DELETE FROM notifications WHERE user_id = $1",
      [userId]
    );
    return result.rowCount || 0;
  },

  async getUnreadCount(userId: string): Promise<number> {
    const result = await query<{ count: string }>(
      "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false",
      [userId]
    );
    return parseInt(result.rows[0]?.count || "0", 10);
  },

  async deleteOlderThan(days: number): Promise<number> {
    const result = await query(
      "DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '1 day' * $1",
      [days]
    );
    return result.rowCount || 0;
  },
};
