package repository

import (
	"context"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository outlines data access for Users
type UserRepository interface {
	GetByID(ctx context.Context, id uuid.UUID) (sqlc.User, error)
}

type userRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewUserRepository constructs a new instance of userRepository
func NewUserRepository(pool *pgxpool.Pool, q sqlc.Querier) UserRepository {
	return &userRepository{
		pool: pool,
		q:    q,
	}
}

// GetByID retrieves a single User record from the database using their unique ID
func (r *userRepository) GetByID(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
	return r.q.GetUserByID(ctx, id)
}
