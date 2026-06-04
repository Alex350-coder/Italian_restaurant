-- 004_create_reservations.sql
-- Create reservations table for table bookings

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE reservation_status AS ENUM (
    'pending',
    'confirmed',
    'seated',
    'completed',
    'cancelled',
    'no_show'
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    party_size INTEGER NOT NULL CHECK (party_size > 0 AND party_size <= 20),
    status reservation_status NOT NULL DEFAULT 'pending',
    special_requests TEXT,
    table_number INTEGER,
    confirmation_code VARCHAR(10) NOT NULL,
    confirmed_at TIMESTAMPTZ,
    seated_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_reservation_date_future CHECK (reservation_date >= CURRENT_DATE)
);

CREATE UNIQUE INDEX idx_reservations_confirmation_code ON reservations (confirmation_code);
CREATE INDEX idx_reservations_user_id ON reservations (user_id);
CREATE INDEX idx_reservations_date ON reservations (reservation_date);
CREATE INDEX idx_reservations_status ON reservations (status);
CREATE INDEX idx_reservations_date_time ON reservations (reservation_date, reservation_time);
CREATE INDEX idx_reservations_created_at ON reservations (created_at DESC);

CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_reservations_updated_at();

COMMIT;
