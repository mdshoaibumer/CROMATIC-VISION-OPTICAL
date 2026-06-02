-- name: GetCartByUserID :one
SELECT id, user_id, created_at, updated_at
FROM carts
WHERE user_id = $1 LIMIT 1;

-- name: CreateCart :one
INSERT INTO carts (user_id)
VALUES ($1)
RETURNING id, user_id, created_at, updated_at;

-- name: GetCartItemByProduct :one
SELECT id, cart_id, product_id, quantity, created_at, updated_at
FROM cart_items
WHERE cart_id = $1 AND product_id = $2 LIMIT 1;

-- name: CreateCartItem :one
INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES ($1, $2, $3)
RETURNING id, cart_id, product_id, quantity, created_at, updated_at;

-- name: UpdateCartItemQuantity :one
UPDATE cart_items
SET quantity = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, cart_id, product_id, quantity, created_at, updated_at;

-- name: DeleteCartItem :exec
DELETE FROM cart_items
WHERE id = $1 AND cart_id = $2;

-- name: ClearCartItems :exec
DELETE FROM cart_items
WHERE cart_id = $1;

-- name: GetCartItemByID :one
SELECT id, cart_id, product_id, quantity, created_at, updated_at
FROM cart_items
WHERE id = $1 LIMIT 1;

-- name: ListCartItemsDetailed :many
SELECT 
    ci.id, 
    ci.cart_id, 
    ci.product_id, 
    ci.quantity, 
    ci.created_at, 
    ci.updated_at,
    p.name AS product_name,
    p.price AS product_price,
    p.sale_price AS product_sale_price,
    p.slug AS product_slug,
    p.brand AS product_brand,
    p.stock AS product_stock
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.cart_id = $1
ORDER BY ci.created_at ASC;
