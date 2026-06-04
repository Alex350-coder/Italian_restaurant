-- 002_create_menu.sql
-- Create menu_items table for restaurant menu

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE menu_category AS ENUM (
    'appetizers',
    'pasta',
    'pizza',
    'risotto',
    'meat',
    'seafood',
    'salads',
    'desserts',
    'beverages',
    'wine'
);

CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category menu_category NOT NULL,
    image_url VARCHAR(500),
    ingredients TEXT[],
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    preparation_time_minutes INTEGER CHECK (preparation_time_minutes > 0),
    calories INTEGER CHECK (calories >= 0),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_menu_items_category ON menu_items (category);
CREATE INDEX idx_menu_items_is_available ON menu_items (is_available) WHERE is_available = true;
CREATE INDEX idx_menu_items_is_featured ON menu_items (is_featured) WHERE is_featured = true;
CREATE INDEX idx_menu_items_price ON menu_items (price);
CREATE INDEX idx_menu_items_sort_order ON menu_items (sort_order);
CREATE INDEX idx_menu_items_created_at ON menu_items (created_at DESC);

CREATE OR REPLACE FUNCTION update_menu_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_menu_items_updated_at();

COMMIT;
