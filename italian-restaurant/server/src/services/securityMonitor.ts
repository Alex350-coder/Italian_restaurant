import { Request, Response, NextFunction } from "express";
import { query } from "../config/database";

export type SecurityEventType =
  | "brute_force_attempt"
  | "sql_injection_attempt"
  | "xss_attempt"
  | "rate_limit_exceeded"
  | "suspicious_activity"
  | "unauthorized_access"
  | "privilege_escalation"
  | "session_hijack_attempt"
  | "credential_stuffing"
  | "api_abuse";

export type Severity = "low" | "medium" | "high" | "critical";

interface SecurityEvent {
  type: SecurityEventType;
  details: string;
  severity: Severity;
  ip: string;
  userId?: string;
  userAgent?: string;
  path?: string;
  method?: string;
}

interface AlertThreshold {
  type: SecurityEventType;
  count: number;
  windowMs: number;
  action: "log" | "alert" | "block";
}

const ALERT_THRESHOLDS: AlertThreshold[] = [
  { type: "brute_force_attempt", count: 5, windowMs: 15 * 60 * 1000, action: "alert" },
  { type: "sql_injection_attempt", count: 1, windowMs: 60 * 60 * 1000, action: "alert" },
  { type: "xss_attempt", count: 1, windowMs: 60 * 60 * 1000, action: "alert" },
  { type: "rate_limit_exceeded", count: 10, windowMs: 15 * 60 * 1000, action: "alert" },
  { type: "suspicious_activity", count: 3, windowMs: 30 * 60 * 1000, action: "alert" },
  { type: "unauthorized_access", count: 5, windowMs: 15 * 60 * 1000, action: "alert" },
  { type: "privilege_escalation", count: 1, windowMs: 60 * 60 * 1000, action: "block" },
  { type: "session_hijack_attempt", count: 1, windowMs: 60 * 60 * 1000, action: "block" },
  { type: "credential_stuffing", count: 3, windowMs: 15 * 60 * 1000, action: "block" },
  { type: "api_abuse", count: 20, windowMs: 15 * 60 * 1000, action: "alert" },
];

const eventCounts = new Map<string, { count: number; firstAt: number }>();

function getClientIp(req: any): string {
  return (
    req.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"
  );
}

export async function recordSecurityEvent(event: SecurityEvent): Promise<void> {
  try {
    await query(
      `INSERT INTO security_events (id, type, details, severity, ip_address, user_id, user_agent, path, method, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
      [
        crypto.randomUUID(),
        event.type,
        event.details,
        event.severity,
        event.ip,
        event.userId || null,
        event.userAgent || null,
        event.path || null,
        event.method || null,
      ]
    );
  } catch (error) {
    console.error("Failed to record security event:", error);
  }

  checkThresholds(event);
}

function checkThresholds(event: SecurityEvent): void {
  const threshold = ALERT_THRESHOLDS.find((t) => t.type === event.type);
  if (!threshold) return;

  const key = `${event.type}:${event.ip}`;
  const now = Date.now();
  const existing = eventCounts.get(key);

  if (!existing || now - existing.firstAt > threshold.windowMs) {
    eventCounts.set(key, { count: 1, firstAt: now });
    return;
  }

  existing.count++;

  if (existing.count >= threshold.count) {
    triggerAlert(event, threshold);
    eventCounts.set(key, { count: 0, firstAt: now });
  }
}

function triggerAlert(event: SecurityEvent, threshold: AlertThreshold): void {
  const message = `[SECURITY ${threshold.action.toUpperCase()}] ${event.type}: ${event.details} from IP ${event.ip}`;

  if (threshold.action === "block") {
    console.error(`🚨 ${message}`);
  } else {
    console.warn(`⚠️  ${message}`);
  }

  if (event.severity === "critical" || threshold.action === "block") {
    console.error(`🔴 CRITICAL SECURITY ALERT: ${message}`);
  }
}

export async function detectSqlInjection(
  input: string,
  ip: string,
  userId?: string,
  path?: string
): Promise<boolean> {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|TRUNCATE)\b)/gi,
    /(--|;|\/\*|\*\/|xp_|sp_)/gi,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
    /('\s*(OR|AND)\s+')/gi,
    /(\bWAITFOR\b\s+\bDELAY\b)/gi,
    /(\bBENCHMARK\s*\()/gi,
    /(\bSLEEP\s*\()/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.test(input)) {
      await recordSecurityEvent({
        type: "sql_injection_attempt",
        details: `SQL injection pattern detected: ${input.substring(0, 200)}`,
        severity: "high",
        ip,
        userId,
        path,
      });
      return true;
    }
  }
  return false;
}

export async function detectXss(
  input: string,
  ip: string,
  userId?: string,
  path?: string
): Promise<boolean> {
  const patterns = [
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /expression\s*\(/gi,
    /<iframe\b[^>]*>/gi,
    /<object\b[^>]*>/gi,
    /<embed\b[^>]*>/gi,
  ];

  for (const pattern of patterns) {
    if (pattern.test(input)) {
      await recordSecurityEvent({
        type: "xss_attempt",
        details: `XSS pattern detected: ${input.substring(0, 200)}`,
        severity: "high",
        ip,
        userId,
        path,
      });
      return true;
    }
  }
  return false;
}

export async function detectBruteForce(
  ip: string,
  email: string
): Promise<boolean> {
  const now = Date.now();
  const key = `brute:${ip}:${email}`;
  const existing = eventCounts.get(key);

  if (existing && now - existing.firstAt < 15 * 60 * 1000) {
    existing.count++;
    if (existing.count >= 5) {
      await recordSecurityEvent({
        type: "brute_force_attempt",
        details: `${existing.count} failed login attempts for ${email}`,
        severity: "medium",
        ip,
      });
      return true;
    }
  } else {
    eventCounts.set(key, { count: 1, firstAt: now });
  }

  return false;
}

export async function getSecurityEvents(
  filters: {
    type?: SecurityEventType;
    severity?: Severity;
    ip?: string;
    userId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ events: any[]; total: number }> {
  try {
    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
    }
    if (filters.severity) {
      whereClause += ` AND severity = $${paramIndex++}`;
      params.push(filters.severity);
    }
    if (filters.ip) {
      whereClause += ` AND ip_address = $${paramIndex++}`;
      params.push(filters.ip);
    }
    if (filters.userId) {
      whereClause += ` AND user_id = $${paramIndex++}`;
      params.push(filters.userId);
    }
    if (filters.from) {
      whereClause += ` AND created_at >= $${paramIndex++}`;
      params.push(filters.from);
    }
    if (filters.to) {
      whereClause += ` AND created_at <= $${paramIndex++}`;
      params.push(filters.to);
    }

    const countResult = await query(
      `SELECT COUNT(*) as total FROM security_events ${whereClause}`,
      params
    );

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const eventsResult = await query(
      `SELECT * FROM security_events ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return {
      events: eventsResult.rows,
      total: parseInt(countResult.rows[0].total, 10),
    };
  } catch (error) {
    console.error("Failed to get security events:", error);
    return { events: [], total: 0 };
  }
}

export async function getSecurityStats(): Promise<{
  totalEvents: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  recentBruteForce: number;
  recentSqlInjection: number;
  recentXss: number;
  topAttackers: Array<{ ip: string; count: number }>;
}> {
  try {
    const stats = await query(
      `SELECT
         COUNT(*) as "totalEvents",
         COUNT(*) FILTER (WHERE severity = 'critical') as "criticalCount",
         COUNT(*) FILTER (WHERE severity = 'high') as "highCount",
         COUNT(*) FILTER (WHERE severity = 'medium') as "mediumCount",
         COUNT(*) FILTER (WHERE severity = 'low') as "lowCount",
         COUNT(*) FILTER (WHERE type = 'brute_force_attempt' AND created_at > NOW() - INTERVAL '1 hour') as "recentBruteForce",
         COUNT(*) FILTER (WHERE type = 'sql_injection_attempt' AND created_at > NOW() - INTERVAL '1 hour') as "recentSqlInjection",
         COUNT(*) FILTER (WHERE type = 'xss_attempt' AND created_at > NOW() - INTERVAL '1 hour') as "recentXss"
       FROM security_events
       WHERE created_at > NOW() - INTERVAL '24 hours'`
    );

    const topAttackers = await query(
      `SELECT ip_address as ip, COUNT(*) as count
       FROM security_events
       WHERE created_at > NOW() - INTERVAL '24 hours'
       GROUP BY ip_address
       ORDER BY count DESC
       LIMIT 10`
    );

    const row = stats.rows[0];
    return {
      totalEvents: parseInt(row.totalEvents, 10),
      criticalCount: parseInt(row.criticalCount, 10),
      highCount: parseInt(row.highCount, 10),
      mediumCount: parseInt(row.mediumCount, 10),
      lowCount: parseInt(row.lowCount, 10),
      recentBruteForce: parseInt(row.recentBruteForce, 10),
      recentSqlInjection: parseInt(row.recentSqlInjection, 10),
      recentXss: parseInt(row.recentXss, 10),
      topAttackers: topAttackers.rows,
    };
  } catch (error) {
    console.error("Failed to get security stats:", error);
    return {
      totalEvents: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      recentBruteForce: 0,
      recentSqlInjection: 0,
      recentXss: 0,
      topAttackers: [],
    };
  }
}

export function securityMonitorMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const ip = getClientIp(req);
  const body = req.body;
  const queryParams = req.query;
  const routeParams = req.params;

  const allInput = JSON.stringify({ body, query: queryParams, params: routeParams });

  detectSqlInjection(allInput, ip, undefined, req.originalUrl).catch(() => {});
  detectXss(allInput, ip, undefined, req.originalUrl).catch(() => {});

  next();
}
