-- ============================================================================
-- Migration 010: Schema Hardening
-- Adds CHECK constraints, missing indexes, structured shipping, soft deletes,
-- and updated_at on invoices
-- ============================================================================

-- 1. Add CHECK constraint on orders.status
ALTER TABLE orders ADD CONSTRAINT chk_orders_status
  CHECK (status IN ('PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

-- 2. Add CHECK constraint on payments.status
ALTER TABLE payments ADD CONSTRAINT chk_payments_status
  CHECK (status IN ('PENDING', 'CAPTURED', 'PAID', 'FAILED'));

-- 3. Add CHECK constraint on prescriptions.status
ALTER TABLE prescriptions ADD CONSTRAINT chk_prescriptions_status
  CHECK (status IN ('UPLOADED', 'REVIEWED', 'APPROVED', 'REJECTED'));

-- 4. Add CHECK constraint on invoices.status
ALTER TABLE invoices ADD CONSTRAINT chk_invoices_status
  CHECK (status IN ('PENDING', 'PAID'));

-- 5. Add index on products.brand for frequent filter queries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_brand') THEN
    CREATE INDEX idx_products_brand ON products(brand);
  END IF;
END $$;

-- 6. Add index on products.gender for frequent filter queries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_gender') THEN
    CREATE INDEX idx_products_gender ON products(gender);
  END IF;
END $$;

-- 7. Add index on products.frame_type for filter queries
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_products_frame_type') THEN
    CREATE INDEX idx_products_frame_type ON products(frame_type);
  END IF;
END $$;

-- 8. Add updated_at column to invoices
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='updated_at') THEN
    ALTER TABLE invoices ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL;
  END IF;
END $$;

-- 9. Add updated_at trigger for invoices
CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- 10. Add soft delete support for users
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='deleted_at') THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 11. Add soft delete support for products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='deleted_at') THEN
    ALTER TABLE products ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 12. Convert shipping_address from TEXT to JSONB (structured address)
-- First add the new column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='shipping_address_json') THEN
    ALTER TABLE orders ADD COLUMN shipping_address_json JSONB;
  END IF;
END $$;

-- Migrate existing data (wrap text in JSON object)
UPDATE orders
SET shipping_address_json = jsonb_build_object('raw', shipping_address)
WHERE shipping_address IS NOT NULL AND shipping_address != '' AND shipping_address_json IS NULL;

-- 13. Add composite index for order listing performance
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_user_id_created_at') THEN
    CREATE INDEX idx_orders_user_id_created_at ON orders(user_id, created_at DESC);
  END IF;
END $$;

-- 14. Add index on payments.provider_order_id for webhook lookups
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_provider_order_id') THEN
    CREATE INDEX idx_payments_provider_order_id ON payments(provider_order_id);
  END IF;
END $$;
