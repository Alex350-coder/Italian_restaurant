import { Router, Response } from "express";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";
import { auditLogEndpoint, auditStatsEndpoint } from "../middleware/auditLog";
import {
  banIp,
  unbanIp,
  getBlacklistedIps,
  getFailedAttemptsStats,
} from "../middleware/ipBlacklist";
import { AuditLogModel } from "../models/auditLog";
import {
  getSecurityEvents,
  getSecurityStats,
  recordSecurityEvent,
} from "../services/securityMonitor";
import { cleanupExpiredSessions } from "../middleware/sessionManager";
import { query } from "../config/database";

const router = Router();

router.get(
  "/audit-logs",
  requireAuth,
  requireRole("admin"),
  auditLogEndpoint
);

router.get(
  "/audit-logs/stats",
  requireAuth,
  requireRole("admin"),
  auditStatsEndpoint
);

router.post(
  "/blacklist",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ip, reason } = req.body;

      if (!ip || typeof ip !== "string") {
        res.status(400).json({
          success: false,
          error: "IP address is required",
        });
        return;
      }

      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$|^[a-fA-F0-9:]+$/;
      if (!ipRegex.test(ip)) {
        res.status(400).json({
          success: false,
          error: "Invalid IP address format",
        });
        return;
      }

      await banIp(ip, reason || "Manual ban by admin");

      res.json({
        success: true,
        data: { message: `IP ${ip} has been banned` },
      });
    } catch (error) {
      console.error("Ban IP error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to ban IP address",
      });
    }
  }
);

router.delete(
  "/blacklist/:ip",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { ip } = req.params;

      const removed = await unbanIp(ip);

      if (removed) {
        res.json({
          success: true,
          data: { message: `IP ${ip} has been unbanned` },
        });
      } else {
        res.status(404).json({
          success: false,
          error: "IP not found in blacklist",
        });
      }
    } catch (error) {
      console.error("Unban IP error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to unban IP address",
      });
    }
  }
);

router.get(
  "/blacklist",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const blacklist = await getBlacklistedIps();

      res.json({
        success: true,
        data: blacklist,
      });
    } catch (error) {
      console.error("Get blacklist error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve blacklist",
      });
    }
  }
);

router.get(
  "/stats",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const failedStats = getFailedAttemptsStats();
      const auditStats = await AuditLogModel.getStats();

      res.json({
        success: true,
        data: {
          failedAttempts: failedStats,
          auditLogs: auditStats,
        },
      });
    } catch (error) {
      console.error("Security stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve security stats",
      });
    }
  }
);

router.get(
  "/events",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        type,
        severity,
        ip,
        userId,
        from,
        to,
        page = "1",
        limit = "50",
      } = req.query as Record<string, string>;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const result = await getSecurityEvents({
        type: type as any,
        severity: severity as any,
        ip,
        userId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
        limit: parseInt(limit),
        offset,
      });

      res.json({
        success: true,
        data: result.events,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
        },
      });
    } catch (error) {
      console.error("Get security events error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve security events",
      });
    }
  }
);

router.get(
  "/security-stats",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const stats = await getSecurityStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error("Security monitor stats error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve security statistics",
      });
    }
  }
);

router.post(
  "/report",
  requireAuth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const { type, details } = req.body;

      if (!type || !details) {
        res.status(400).json({
          success: false,
          error: "Type and details are required",
        });
        return;
      }

      const ip =
        (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
        req.ip ||
        "unknown";

      await recordSecurityEvent({
        type: "suspicious_activity",
        details: `User reported: ${details}`,
        severity: "medium",
        ip,
        userId: req.user.id,
        userAgent: req.headers["user-agent"],
        path: req.path,
        method: req.method,
      });

      res.json({
        success: true,
        data: { message: "Security event reported" },
      });
    } catch (error) {
      console.error("Report security event error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to report security event",
      });
    }
  }
);

router.post(
  "/cleanup-sessions",
  requireAuth,
  requireRole("admin"),
  async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
      const cleaned = await cleanupExpiredSessions();

      res.json({
        success: true,
        data: {
          message: `Cleaned up ${cleaned} expired sessions`,
          cleaned,
        },
      });
    } catch (error) {
      console.error("Cleanup sessions error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to cleanup sessions",
      });
    }
  }
);

router.get(
  "/login-history/:userId",
  requireAuth,
  requireRole("admin"),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const limit = Math.min(parseInt((req.query.limit as string) || "50", 10), 100);

      const result = await query(
        `SELECT id, ip_address as "ip", user_agent as "userAgent",
                success, failure_reason as "failureReason",
                created_at as "timestamp"
         FROM login_history
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      res.json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      console.error("Get user login history error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to retrieve login history",
      });
    }
  }
);

export default router;
