-- name: CreateInvoice :one
INSERT INTO invoices (
  order_id, invoice_number, invoice_url, status
) VALUES (
  $1, $2, $3, $4
)
RETURNING id, order_id, invoice_number, invoice_url, status, created_at;

-- name: GetInvoiceByID :one
SELECT id, order_id, invoice_number, invoice_url, status, created_at
FROM invoices
WHERE id = $1 LIMIT 1;

-- name: GetInvoiceByIDAndUserID :one
SELECT i.id, i.order_id, i.invoice_number, i.invoice_url, i.status, i.created_at
FROM invoices i
JOIN orders o ON i.order_id = o.id
WHERE i.id = $1 AND o.user_id = $2 LIMIT 1;

-- name: GetInvoiceByOrderID :one
SELECT id, order_id, invoice_number, invoice_url, status, created_at
FROM invoices
WHERE order_id = $1 LIMIT 1;

-- name: ListInvoicesByUserID :many
SELECT i.id, i.order_id, i.invoice_number, i.invoice_url, i.status, i.created_at
FROM invoices i
JOIN orders o ON i.order_id = o.id
WHERE o.user_id = $1
ORDER BY i.created_at DESC;

-- name: ListAllInvoices :many
SELECT id, order_id, invoice_number, invoice_url, status, created_at
FROM invoices
ORDER BY created_at DESC;

-- name: UpdateInvoiceStatus :one
UPDATE invoices
SET status = $2
WHERE id = $1
RETURNING id, order_id, invoice_number, invoice_url, status, created_at;
