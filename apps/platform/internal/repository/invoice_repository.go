package repository

import (
	"context"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// InvoiceRepository defines data access methods for invoices
type InvoiceRepository interface {
	Create(ctx context.Context, arg sqlc.CreateInvoiceParams) (sqlc.Invoice, error)
	GetByID(ctx context.Context, id int64) (sqlc.Invoice, error)
	GetByIDAndUserID(ctx context.Context, id int64, userID uuid.UUID) (sqlc.Invoice, error)
	GetByOrderID(ctx context.Context, orderID int64) (sqlc.Invoice, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Invoice, error)
	ListAll(ctx context.Context) ([]sqlc.Invoice, error)
	UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Invoice, error)
}

type invoiceRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewInvoiceRepository instantiates invoiceRepository
func NewInvoiceRepository(pool *pgxpool.Pool, q sqlc.Querier) InvoiceRepository {
	return &invoiceRepository{
		pool: pool,
		q:    q,
	}
}

func (r *invoiceRepository) Create(ctx context.Context, arg sqlc.CreateInvoiceParams) (sqlc.Invoice, error) {
	return r.q.CreateInvoice(ctx, arg)
}

func (r *invoiceRepository) GetByID(ctx context.Context, id int64) (sqlc.Invoice, error) {
	return r.q.GetInvoiceByID(ctx, id)
}

func (r *invoiceRepository) GetByIDAndUserID(ctx context.Context, id int64, userID uuid.UUID) (sqlc.Invoice, error) {
	return r.q.GetInvoiceByIDAndUserID(ctx, sqlc.GetInvoiceByIDAndUserIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *invoiceRepository) GetByOrderID(ctx context.Context, orderID int64) (sqlc.Invoice, error) {
	return r.q.GetInvoiceByOrderID(ctx, orderID)
}

func (r *invoiceRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Invoice, error) {
	return r.q.ListInvoicesByUserID(ctx, userID)
}

func (r *invoiceRepository) ListAll(ctx context.Context) ([]sqlc.Invoice, error) {
	return r.q.ListAllInvoices(ctx)
}

func (r *invoiceRepository) UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Invoice, error) {
	return r.q.UpdateInvoiceStatus(ctx, sqlc.UpdateInvoiceStatusParams{
		ID:     id,
		Status: status,
	})
}
