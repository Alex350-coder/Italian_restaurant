import { Router, Response } from "express";
import { AuthRequest, requireAuth } from "../middleware/auth";
import { notificationService } from "../services/notificationService";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const unreadOnly = req.query.unread === "true";
    const notifications = await notificationService.getUserNotifications(req.user.id, unreadOnly);

    res.json({
      success: true,
      data: { notifications },
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
});

router.get("/unread-count", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const count = await notificationService.getUnreadCount(req.user.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch unread count",
    });
  }
});

router.put("/:id/read", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const notification = await notificationService.markAsRead(id);

    if (!notification) {
      res.status(404).json({
        success: false,
        error: "Notification not found",
      });
      return;
    }

    if (notification.user_id !== req.user.id) {
      res.status(403).json({
        success: false,
        error: "Access denied",
      });
      return;
    }

    res.json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark notification as read",
    });
  }
});

router.put("/read-all", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const updatedCount = await notificationService.markAllAsRead(req.user.id);

    res.json({
      success: true,
      data: { updatedCount },
    });
  } catch (error) {
    console.error("Mark all read error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mark all notifications as read",
    });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required" });
      return;
    }

    const { id } = req.params;

    // Check ownership before deleting
    const notifications = await notificationService.getUserNotifications(req.user.id);
    const ownsNotification = notifications.some((n) => n.id === id);

    if (!ownsNotification) {
      res.status(404).json({
        success: false,
        error: "Notification not found",
      });
      return;
    }

    const deleted = await notificationService.deleteNotification(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: "Notification not found",
      });
      return;
    }

    res.json({
      success: true,
      data: { deleted: true },
    });
  } catch (error) {
    console.error("Delete notification error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete notification",
    });
  }
});

export default router;
