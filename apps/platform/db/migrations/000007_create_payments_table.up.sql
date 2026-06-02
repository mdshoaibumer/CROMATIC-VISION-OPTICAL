CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_order_id VARCHAR(100) NOT NULL,
  provider_payment_id VARCHAR(100),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_order_pk ON payments(provider_order_id) WHERE provider_payment_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_unique ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;
