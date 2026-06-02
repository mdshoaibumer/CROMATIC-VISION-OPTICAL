-- name: CreatePrescription :one
INSERT INTO prescriptions (
  order_id, user_id, prescription_type, file_url, object_key, notes, status
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
)
RETURNING id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at;

-- name: GetPrescriptionByID :one
SELECT id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at
FROM prescriptions
WHERE id = $1 LIMIT 1;

-- name: GetPrescriptionByIDAndUserID :one
SELECT id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at
FROM prescriptions
WHERE id = $1 AND user_id = $2 LIMIT 1;

-- name: ListPrescriptionsByUserID :many
SELECT id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at
FROM prescriptions
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: ListAllPrescriptions :many
SELECT id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at
FROM prescriptions
ORDER BY created_at DESC;

-- name: UpdatePrescriptionStatus :one
UPDATE prescriptions
SET status = $2, updated_at = NOW()
WHERE id = $1
RETURNING id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at;

-- name: ListPrescriptionsByOrderID :many
SELECT id, order_id, user_id, prescription_type, file_url, object_key, notes, status, created_at, updated_at
FROM prescriptions
WHERE order_id = $1
ORDER BY created_at DESC;

-- name: AdminListAllPrescriptions :many
SELECT p.id, p.order_id, p.user_id, p.prescription_type, p.file_url, p.object_key, p.notes, p.status, p.created_at, p.updated_at, u.name as user_name, u.email as user_email
FROM prescriptions p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- name: AdminGetPrescriptionByID :one
SELECT p.id, p.order_id, p.user_id, p.prescription_type, p.file_url, p.object_key, p.notes, p.status, p.created_at, p.updated_at, u.name as user_name, u.email as user_email
FROM prescriptions p
JOIN users u ON p.user_id = u.id
WHERE p.id = $1 LIMIT 1;
