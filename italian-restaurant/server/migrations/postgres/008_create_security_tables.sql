-- Migration 008: Create security tables
-- Login history, security events, password history

BEGIN;

-- ============================================================
-- LOGIN HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  failure_reason VARCHAR(100),
  location VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_ip ON login_history(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at);
CREATE INDEX IF NOT EXISTS idx_login_history_success ON login_history(success);
CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON login_history(user_id, created_at DESC);

-- ============================================================
-- SECURITY EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  details TEXT NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  ip_address INET NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_agent TEXT,
  path VARCHAR(2048),
  method VARCHAR(10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type_created ON security_events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_severity_created ON security_events(severity, created_at DESC);

-- ============================================================
-- PASSWORD HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id);
CREATE INDEX IF NOT EXISTS idx_password_history_user_created ON password_history(user_id, created_at DESC);

-- ============================================================
-- ACTIVE SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_jti VARCHAR(36) NOT NULL,
  ip_address INET NOT NULL,
  user_agent TEXT NOT NULL,
  device VARCHAR(50) NOT NULL,
  browser VARCHAR(50) NOT NULL,
  os VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token_jti ON active_sessions(token_jti);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_expires ON active_sessions(user_id, expires_at);

-- ============================================================
-- Cleanup function for expired sessions
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM active_sessions WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Auto-cleanup trigger (runs on insert)
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM active_sessions WHERE expires_at <= NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cleanup_sessions_on_insert ON active_sessions;
CREATE TRIGGER cleanup_sessions_on_insert
  AFTER INSERT ON active_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_cleanup_expired_sessions();

-- ============================================================
-- Partition security_events by month (optional, for production)
-- ============================================================
-- For high-traffic production, consider partitioning security_events:
-- CREATE TABLE security_events_y2026m01 PARTITION OF security_events
--   FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

COMMIT;
