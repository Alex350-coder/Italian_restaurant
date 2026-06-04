-- 005_add_reservation_contact_fields.sql
-- Add contact info columns to reservations table

BEGIN;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS email VARCHAR(254) NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS notes TEXT;

COMMIT;
