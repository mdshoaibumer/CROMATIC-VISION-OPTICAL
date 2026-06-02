DROP TRIGGER IF EXISTS set_updated_at_payments ON payments;
DROP TRIGGER IF EXISTS set_updated_at_prescriptions ON prescriptions;
DROP TRIGGER IF EXISTS set_updated_at_cart_items ON cart_items;
DROP TRIGGER IF EXISTS set_updated_at_carts ON carts;
DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
DROP TRIGGER IF EXISTS set_updated_at_products ON products;
DROP TRIGGER IF EXISTS set_updated_at_categories ON categories;
DROP TRIGGER IF EXISTS set_updated_at_users ON users;

DROP FUNCTION IF EXISTS trigger_set_updated_at();
