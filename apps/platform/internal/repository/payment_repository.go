package repository

import (
	"context"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PaymentRepository defines data access methods for payments
type PaymentRepository interface {
	Create(ctx context.Context, arg sqlc.CreatePaymentParams) (sqlc.Payment, error)
	GetByID(ctx context.Context, id int64) (sqlc.Payment, error)
	GetByProviderOrderID(ctx context.Context, providerOrderID string) (sqlc.Payment, error)
	GetByProviderPaymentID(ctx context.Context, providerPaymentID *string) (sqlc.Payment, error)
	UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Payment, error)
	UpdateStatusAndPaymentID(ctx context.Context, id int64, status string, providerPaymentID *string) (sqlc.Payment, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Payment, error)
	ProcessPaymentCapture(ctx context.Context, providerOrderID string, providerPaymentID string) (sqlc.Payment, error)
}

type paymentRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewPaymentRepository instantiates paymentRepository
func NewPaymentRepository(pool *pgxpool.Pool, q sqlc.Querier) PaymentRepository {
	return &paymentRepository{
		pool: pool,
		q:    q,
	}
}

func (r *paymentRepository) Create(ctx context.Context, arg sqlc.CreatePaymentParams) (sqlc.Payment, error) {
	return r.q.CreatePayment(ctx, arg)
}

func (r *paymentRepository) GetByID(ctx context.Context, id int64) (sqlc.Payment, error) {
	return r.q.GetPaymentByID(ctx, id)
}

func (r *paymentRepository) GetByProviderOrderID(ctx context.Context, providerOrderID string) (sqlc.Payment, error) {
	return r.q.GetPaymentByProviderOrderID(ctx, providerOrderID)
}

func (r *paymentRepository) GetByProviderPaymentID(ctx context.Context, providerPaymentID *string) (sqlc.Payment, error) {
	return r.q.GetPaymentByProviderPaymentID(ctx, providerPaymentID)
}

func (r *paymentRepository) UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Payment, error) {
	return r.q.UpdatePaymentStatus(ctx, sqlc.UpdatePaymentStatusParams{
		ID:     id,
		Status: status,
	})
}

func (r *paymentRepository) UpdateStatusAndPaymentID(ctx context.Context, id int64, status string, providerPaymentID *string) (sqlc.Payment, error) {
	return r.q.UpdatePaymentStatusAndPaymentID(ctx, sqlc.UpdatePaymentStatusAndPaymentIDParams{
		ID:                id,
		Status:            status,
		ProviderPaymentID: providerPaymentID,
	})
}

func (r *paymentRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Payment, error) {
	return r.q.ListPaymentsByUserID(ctx, userID)
}

func (r *paymentRepository) ProcessPaymentCapture(ctx context.Context, providerOrderID string, providerPaymentID string) (sqlc.Payment, error) {
	if r.pool == nil {
		pay, err := r.q.GetPaymentByProviderOrderID(ctx, providerOrderID)
		if err != nil {
			return sqlc.Payment{}, err
		}
		if pay.Status == "CAPTURED" {
			return pay, nil
		}
		pay, err = r.q.UpdatePaymentStatusAndPaymentID(ctx, sqlc.UpdatePaymentStatusAndPaymentIDParams{
			ID:                pay.ID,
			Status:            "CAPTURED",
			ProviderPaymentID: &providerPaymentID,
		})
		if err != nil {
			return sqlc.Payment{}, err
		}
		_, err = r.q.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
			ID:     pay.OrderID,
			Status: "PAID",
		})
		return pay, err
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return sqlc.Payment{}, err
	}
	defer tx.Rollback(ctx)

	qtx := r.q.(*sqlc.Queries).WithTx(tx)

	pay, err := qtx.GetPaymentByProviderOrderID(ctx, providerOrderID)
	if err != nil {
		return sqlc.Payment{}, err
	}

	if pay.Status == "CAPTURED" {
		return pay, nil
	}

	pay, err = qtx.UpdatePaymentStatusAndPaymentID(ctx, sqlc.UpdatePaymentStatusAndPaymentIDParams{
		ID:                pay.ID,
		Status:            "CAPTURED",
		ProviderPaymentID: &providerPaymentID,
	})
	if err != nil {
		return sqlc.Payment{}, err
	}

	_, err = qtx.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		ID:     pay.OrderID,
		Status: "PAID",
	})
	if err != nil {
		return sqlc.Payment{}, err
	}

	err = tx.Commit(ctx)
	if err != nil {
		return sqlc.Payment{}, err
	}

	return pay, nil
}

