-- name: GetUserByID :one
SELECT id, name, email, phone, password_hash, role, is_active, created_at, updated_at
FROM users
WHERE id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT id, name, email, phone, password_hash, role, is_active, created_at, updated_at
FROM users
WHERE email = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO users (
  name, email, phone, password_hash, role, is_active
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING id, name, email, phone, password_hash, role, is_active, created_at, updated_at;

-- name: UpdateUser :one
UPDATE users
SET 
  name = COALESCE(sqlc.narg('name'), name),
  email = COALESCE(sqlc.narg('email'), email),
  phone = COALESCE(sqlc.narg('phone'), phone),
  password_hash = COALESCE(sqlc.narg('password_hash'), password_hash),
  role = COALESCE(sqlc.narg('role'), role),
  is_active = COALESCE(sqlc.narg('is_active'), is_active),
  updated_at = NOW()
WHERE id = $1
RETURNING id, name, email, phone, password_hash, role, is_active, created_at, updated_at;

-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
