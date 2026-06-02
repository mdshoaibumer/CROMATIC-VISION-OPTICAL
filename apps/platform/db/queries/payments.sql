-- name: CreatePayment :one
INSERT INTO payments (
  order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at;

-- name: GetPaymentByID :one
SELECT id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at
FROM payments
WHERE id = $1 LIMIT 1;

-- name: GetPaymentByProviderOrderID :one
SELECT id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at
FROM payments
WHERE provider_order_id = $1 LIMIT 1;

-- name: GetPaymentByProviderPaymentID :one
SELECT id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at
FROM payments
WHERE provider_payment_id = $1 LIMIT 1;

-- name: UpdatePaymentStatus :one
UPDATE payments
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at;

-- name: UpdatePaymentStatusAndPaymentID :one
UPDATE payments
SET status = $2, provider_payment_id = $3, updated_at = NOW()
WHERE id = $1
RETURNING id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at;

-- name: ListPaymentsByUserID :many
SELECT id, order_id, user_id, provider, provider_order_id, provider_payment_id, amount, status, created_at, updated_at
FROM payments
WHERE user_id = $1
ORDER BY created_at DESC;
