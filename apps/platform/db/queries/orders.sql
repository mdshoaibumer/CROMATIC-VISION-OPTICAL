-- name: GetOrderByID :one
SELECT *
FROM orders
WHERE id = $1 LIMIT 1;

-- name: CreateOrder :one
INSERT INTO orders (
  user_id, status, total_amount, tracking_number, shipping_address
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: CreateOrderItem :one
INSERT INTO order_items (
  order_id, product_id, quantity, price, product_snapshot
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING id, order_id, product_id, quantity, price, product_snapshot;

-- name: ListOrdersByUserID :many
SELECT *
FROM orders
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: ListOrdersByUserIDPaged :many
SELECT *
FROM orders
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListOrdersPaged :many
SELECT *
FROM orders
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListOrderItemsByOrderID :many
SELECT id, order_id, product_id, quantity, price, product_snapshot
FROM order_items
WHERE order_id = $1
ORDER BY id ASC;

-- name: UpdateOrderStatus :one
UPDATE orders
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DecrementProductStock :execrows
UPDATE products
SET stock = stock - $2, updated_at = NOW()
WHERE id = $1 AND stock >= $2;

-- name: AdminGetOrderDetails :one
SELECT o.id, o.user_id, o.status, o.total_amount, o.tracking_number, o.shipping_address, o.created_at, o.updated_at, u.name as user_name, u.email as user_email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.id = $1 LIMIT 1;
-- name: AdminListOrdersPaged :many  
SELECT o.id, o.user_id, o.status, o.total_amount, o.tracking_number, o.shipping_address, o.created_at, o.updated_at, u.name as user_name, u.email as user_email  
FROM orders o  
JOIN users u ON o.user_id = u.id  
ORDER BY o.created_at DESC  
LIMIT $1 OFFSET $2; 
