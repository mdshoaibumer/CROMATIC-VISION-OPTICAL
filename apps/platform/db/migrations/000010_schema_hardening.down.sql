-- Rollback Migration 010: Schema Hardening

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_provider_order_id') THEN
    DROP INDEX idx_payments_provider_order_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_id_created_at') THEN
    DROP INDEX idx_orders_user_id_created_at;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_address_json') THEN
    ALTER TABLE orders DROP COLUMN shipping_address_json;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='deleted_at') THEN
    ALTER TABLE products DROP COLUMN deleted_at;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
    ALTER TABLE users DROP COLUMN deleted_at;
  END IF;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_invoices ON invoices;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='updated_at') THEN
    ALTER TABLE invoices DROP COLUMN updated_at;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_frame_type') THEN
    DROP INDEX idx_products_frame_type;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_gender') THEN
    DROP INDEX idx_products_gender;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_brand') THEN
    DROP INDEX idx_products_brand;
  END IF;
END $$;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS chk_invoices_status;
ALTER TABLE prescriptions DROP CONSTRAINT IF EXISTS chk_prescriptions_status;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payments_status;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS chk_orders_status;
