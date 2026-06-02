ALTER TABLE order_items DROP COLUMN IF EXISTS product_snapshot;
ALTER TABLE orders DROP COLUMN IF EXISTS shipping_address;

DROP INDEX IF EXISTS idx_cart_items_cart_id;
DROP INDEX IF EXISTS idx_carts_user_id;

DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS carts;
