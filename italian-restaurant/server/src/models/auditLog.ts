import { v4 as uuidv4 } from "uuid";
import { query } from "../config/database";

export interface AuditLogEntry {
  id?: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  ip: string;
  userAgent: string;
  requestBody?: any;
  responseStatus: "success" | "failure";
  createdAt?: Date;
}

export interface AuditLogFilters {
  userId?: string;
  resource?: string;
  action?: string;
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

export interface AuditLogStats {
  totalLogs: number;
  todayLogs: number;
  failedAttempts: number;
  topResources: Array<{ resource: string; count: number }>;
  topIps: Array<{ ip: string; count: number }>;
  recentErrors: Array<{
    path: string;
    statusCode: number;
    ip: string;
    timestamp: Date;
  }>;
}

export const AuditLogModel = {
  async create(log: AuditLogEntry): Promise<void> {
    const id = uuidv4();

    await query(
      `INSERT INTO audit_logs (
        id, user_id, action, resource, resource_id,
        method, path, status_code, ip, user_agent,
        request_body, response_status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        id,
        log.userId,
        log.action,
        log.resource,
        log.resourceId || null,
        log.method,
        log.path,
        log.statusCode,
        log.ip,
        log.userAgent,
        log.requestBody ? JSON.stringify(log.requestBody) : null,
        log.responseStatus,
      ]
    );
  },

  async findByUser(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogEntry>(
      `SELECT id, user_id as "userId", action, resource, resource_id as "resourceId",
              method, path, status_code as "statusCode", ip, user_agent as "userAgent",
              request_body as "requestBody", response_status as "responseStatus",
              created_at as "createdAt"
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  },

  async findByResource(
    resource: string,
    resourceId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogEntry>(
      `SELECT id, user_id as "userId", action, resource, resource_id as "resourceId",
              method, path, status_code as "statusCode", ip, user_agent as "userAgent",
              request_body as "requestBody", response_status as "responseStatus",
              created_at as "createdAt"
       FROM audit_logs
       WHERE resource = $1 AND resource_id = $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [resource, resourceId, limit, offset]
    );
    return result.rows;
  },

  async findByDateRange(
    from: Date,
    to: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogEntry>(
      `SELECT id, user_id as "userId", action, resource, resource_id as "resourceId",
              method, path, status_code as "statusCode", ip, user_agent as "userAgent",
              request_body as "requestBody", response_status as "responseStatus",
              created_at as "createdAt"
       FROM audit_logs
       WHERE created_at BETWEEN $1 AND $2
       ORDER BY created_at DESC
       LIMIT $3 OFFSET $4`,
      [from, to, limit, offset]
    );
    return result.rows;
  },

  async findByFilters(
    filters: AuditLogFilters
  ): Promise<AuditLogEntry[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters.resource) {
      conditions.push(`resource = $${paramIndex++}`);
      params.push(filters.resource);
    }

    if (filters.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters.from) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.from);
    }

    if (filters.to) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    params.push(filters.limit);
    params.push(filters.offset);

    const result = await query<AuditLogEntry>(
      `SELECT id, user_id as "userId", action, resource, resource_id as "resourceId",
              method, path, status_code as "statusCode", ip, user_agent as "userAgent",
              request_body as "requestBody", response_status as "responseStatus",
              created_at as "createdAt"
       FROM audit_logs
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      params
    );

    return result.rows;
  },

  async getStats(): Promise<AuditLogStats> {
    const [totalResult, todayResult, failedResult, resourcesResult, ipsResult, errorsResult] =
      await Promise.all([
        query("SELECT COUNT(*) as count FROM audit_logs"),
        query(
          "SELECT COUNT(*) as count FROM audit_logs WHERE created_at >= CURRENT_DATE"
        ),
        query(
          "SELECT COUNT(*) as count FROM audit_logs WHERE response_status = 'failure'"
        ),
        query(
          `SELECT resource, COUNT(*) as count FROM audit_logs
           GROUP BY resource ORDER BY count DESC LIMIT 10`
        ),
        query(
          `SELECT ip, COUNT(*) as count FROM audit_logs
           GROUP BY ip ORDER BY count DESC LIMIT 10`
        ),
        query(
          `SELECT path, status_code, ip, created_at
           FROM audit_logs
           WHERE status_code >= 400
           ORDER BY created_at DESC LIMIT 10`
        ),
      ]);

    return {
      totalLogs: parseInt(totalResult.rows[0]?.count || "0", 10),
      todayLogs: parseInt(todayResult.rows[0]?.count || "0", 10),
      failedAttempts: parseInt(failedResult.rows[0]?.count || "0", 10),
      topResources: resourcesResult.rows.map((r) => ({
        resource: r.resource,
        count: parseInt(r.count, 10),
      })),
      topIps: ipsResult.rows.map((r) => ({
        ip: r.ip,
        count: parseInt(r.count, 10),
      })),
      recentErrors: errorsResult.rows.map((r) => ({
        path: r.path,
        statusCode: r.status_code,
        ip: r.ip,
        timestamp: r.created_at,
      })),
    };
  },

  async deleteOlderThan(days: number): Promise<number> {
    const result = await query(
      `DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '1 day' * $1`,
      [days]
    );
    return result.rowCount ?? 0;
  },
};
