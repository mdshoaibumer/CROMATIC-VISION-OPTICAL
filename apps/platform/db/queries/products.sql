-- name: CreateCategory :one
INSERT INTO categories (name, slug, description)
VALUES ($1, $2, $3)
RETURNING id, name, slug, description, created_at, updated_at;

-- name: UpdateCategory :one
UPDATE categories
SET name = COALESCE(sqlc.narg('name'), name),
    slug = COALESCE(sqlc.narg('slug'), slug),
    description = COALESCE(sqlc.narg('description'), description),
    updated_at = NOW()
WHERE id = $1
RETURNING id, name, slug, description, created_at, updated_at;

-- name: DeleteCategory :exec
DELETE FROM categories WHERE id = $1;

-- name: GetCategoryByID :one
SELECT id, name, slug, description, created_at, updated_at 
FROM categories 
WHERE id = $1 LIMIT 1;

-- name: GetCategoryBySlug :one
SELECT id, name, slug, description, created_at, updated_at 
FROM categories 
WHERE slug = $1 LIMIT 1;

-- name: ListCategories :many
SELECT id, name, slug, description, created_at, updated_at 
FROM categories 
ORDER BY name ASC;

-- name: CreateProduct :one
INSERT INTO products (
  category_id, name, slug, description, price, sale_price, brand, frame_type, material, gender, stock, status
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
)
RETURNING id, category_id, name, slug, description, price, sale_price, brand, frame_type, material, gender, stock, status, created_at, updated_at;

-- name: UpdateProduct :one
UPDATE products
SET category_id = COALESCE(sqlc.narg('category_id'), category_id),
    name = COALESCE(sqlc.narg('name'), name),
    slug = COALESCE(sqlc.narg('slug'), slug),
    description = COALESCE(sqlc.narg('description'), description),
    price = COALESCE(sqlc.narg('price'), price),
    sale_price = COALESCE(sqlc.narg('sale_price'), sale_price),
    brand = COALESCE(sqlc.narg('brand'), brand),
    frame_type = COALESCE(sqlc.narg('frame_type'), frame_type),
    material = COALESCE(sqlc.narg('material'), material),
    gender = COALESCE(sqlc.narg('gender'), gender),
    stock = COALESCE(sqlc.narg('stock'), stock),
    status = COALESCE(sqlc.narg('status'), status),
    updated_at = NOW()
WHERE id = $1
RETURNING id, category_id, name, slug, description, price, sale_price, brand, frame_type, material, gender, stock, status, created_at, updated_at;

-- name: DeleteProduct :exec
DELETE FROM products WHERE id = $1;

-- name: GetProductByID :one
SELECT id, category_id, name, slug, description, price, sale_price, brand, frame_type, material, gender, stock, status, created_at, updated_at
FROM products 
WHERE id = $1 LIMIT 1;

-- name: GetProductBySlug :one
SELECT id, category_id, name, slug, description, price, sale_price, brand, frame_type, material, gender, stock, status, created_at, updated_at
FROM products 
WHERE slug = $1 LIMIT 1;

-- name: ListProductsLimited :many
SELECT id, category_id, name, slug, description, price, sale_price, brand, frame_type, material, gender, stock, status, created_at, updated_at
FROM products
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: CreateProductImage :one
INSERT INTO product_images (product_id, image_url, object_key, is_primary)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: DeleteProductImagesByProductID :exec
DELETE FROM product_images WHERE product_id = $1;

-- name: ListProductImagesByProductID :many
SELECT * 
FROM product_images 
WHERE product_id = $1 
ORDER BY is_primary DESC, id ASC;

-- name: GetProductImageByID :one
SELECT *
FROM product_images
WHERE id = $1 LIMIT 1;

-- name: DeleteProductImageByID :exec
DELETE FROM product_images
WHERE id = $1 AND product_id = $2;

-- name: ClearPrimaryProductImage :exec
UPDATE product_images
SET is_primary = false
WHERE product_id = $1;
