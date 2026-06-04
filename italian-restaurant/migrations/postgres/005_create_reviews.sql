-- 005_create_reviews.sql
-- Create reviews table for customer feedback

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    comment TEXT,
    is_anonymous BOOLEAN NOT NULL DEFAULT false,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    owner_reply TEXT,
    owner_replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_user_id ON reviews (user_id);
CREATE INDEX idx_reviews_order_id ON reviews (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX idx_reviews_menu_item_id ON reviews (menu_item_id) WHERE menu_item_id IS NOT NULL;
CREATE INDEX idx_reviews_rating ON reviews (rating);
CREATE INDEX idx_reviews_is_approved ON reviews (is_approved) WHERE is_approved = true;
CREATE INDEX idx_reviews_created_at ON reviews (created_at DESC);

-- Prevent duplicate reviews per user per order
CREATE UNIQUE INDEX idx_reviews_user_order_unique
    ON reviews (user_id, order_id)
    WHERE order_id IS NOT NULL;

CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

COMMIT;
