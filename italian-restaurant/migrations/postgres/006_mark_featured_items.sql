-- 006_mark_featured_items.sql
-- Mark popular items as featured for the homepage

BEGIN;

-- Mark 5 popular items as featured
UPDATE menu_items 
SET is_featured = true, updated_at = NOW()
WHERE name IN (
    'Spaghetti Carbonara',
    'Margherita DOP',
    'Ossobuco alla Milanese',
    'Tiramisù della Casa',
    'Risotto ai Funghi Porcini'
);

-- Verify the update
SELECT COUNT(*) as featured_items_count FROM menu_items WHERE is_featured = true;

COMMIT;
