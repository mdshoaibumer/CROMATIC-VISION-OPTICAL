package repository

import (
	"context"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PrescriptionRepository defines data access methods for optical prescriptions
type PrescriptionRepository interface {
	Create(ctx context.Context, arg sqlc.CreatePrescriptionParams) (sqlc.Prescription, error)
	GetByID(ctx context.Context, id int64) (sqlc.Prescription, error)
	GetByIDAndUserID(ctx context.Context, id int64, userID uuid.UUID) (sqlc.Prescription, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Prescription, error)
	ListAll(ctx context.Context) ([]sqlc.Prescription, error)
	AdminListAllPrescriptions(ctx context.Context) ([]sqlc.AdminListAllPrescriptionsRow, error)
	UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Prescription, error)
	ListByOrderID(ctx context.Context, orderID int64) ([]sqlc.Prescription, error)
	AdminGetPrescriptionByID(ctx context.Context, id int64) (sqlc.AdminGetPrescriptionByIDRow, error)
}

type prescriptionRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewPrescriptionRepository instantiates prescriptionRepository
func NewPrescriptionRepository(pool *pgxpool.Pool, q sqlc.Querier) PrescriptionRepository {
	return &prescriptionRepository{
		pool: pool,
		q:    q,
	}
}

func (r *prescriptionRepository) Create(ctx context.Context, arg sqlc.CreatePrescriptionParams) (sqlc.Prescription, error) {
	return r.q.CreatePrescription(ctx, arg)
}

func (r *prescriptionRepository) GetByID(ctx context.Context, id int64) (sqlc.Prescription, error) {
	return r.q.GetPrescriptionByID(ctx, id)
}

func (r *prescriptionRepository) GetByIDAndUserID(ctx context.Context, id int64, userID uuid.UUID) (sqlc.Prescription, error) {
	return r.q.GetPrescriptionByIDAndUserID(ctx, sqlc.GetPrescriptionByIDAndUserIDParams{
		ID:     id,
		UserID: userID,
	})
}

func (r *prescriptionRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Prescription, error) {
	return r.q.ListPrescriptionsByUserID(ctx, userID)
}

func (r *prescriptionRepository) ListAll(ctx context.Context) ([]sqlc.Prescription, error) {
	return r.q.ListAllPrescriptions(ctx)
}

func (r *prescriptionRepository) AdminListAllPrescriptions(ctx context.Context) ([]sqlc.AdminListAllPrescriptionsRow, error) {
	return r.q.AdminListAllPrescriptions(ctx)
}

func (r *prescriptionRepository) AdminGetPrescriptionByID(ctx context.Context, id int64) (sqlc.AdminGetPrescriptionByIDRow, error) {
	return r.q.AdminGetPrescriptionByID(ctx, id)
}

func (r *prescriptionRepository) UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Prescription, error) {
	return r.q.UpdatePrescriptionStatus(ctx, sqlc.UpdatePrescriptionStatusParams{
		ID:     id,
		Status: status,
	})
}

func (r *prescriptionRepository) ListByOrderID(ctx context.Context, orderID int64) ([]sqlc.Prescription, error) {
	return r.q.ListPrescriptionsByOrderID(ctx, orderID)
}
