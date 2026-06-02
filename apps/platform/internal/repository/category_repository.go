package repository

import (
	"context"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
)

// CategoryRepository defines standard CRUD signatures for categories
type CategoryRepository interface {
	Create(ctx context.Context, arg sqlc.CreateCategoryParams) (sqlc.Category, error)
	Update(ctx context.Context, arg sqlc.UpdateCategoryParams) (sqlc.Category, error)
	Delete(ctx context.Context, id int64) error
	GetByID(ctx context.Context, id int64) (sqlc.Category, error)
	GetBySlug(ctx context.Context, slug string) (sqlc.Category, error)
	List(ctx context.Context) ([]sqlc.Category, error)
}

type categoryRepository struct {
	q sqlc.Querier
}

// NewCategoryRepository creates a category repository instance
func NewCategoryRepository(q sqlc.Querier) CategoryRepository {
	return &categoryRepository{q: q}
}

func (r *categoryRepository) Create(ctx context.Context, arg sqlc.CreateCategoryParams) (sqlc.Category, error) {
	return r.q.CreateCategory(ctx, arg)
}

func (r *categoryRepository) Update(ctx context.Context, arg sqlc.UpdateCategoryParams) (sqlc.Category, error) {
	return r.q.UpdateCategory(ctx, arg)
}

func (r *categoryRepository) Delete(ctx context.Context, id int64) error {
	return r.q.DeleteCategory(ctx, id)
}

func (r *categoryRepository) GetByID(ctx context.Context, id int64) (sqlc.Category, error) {
	return r.q.GetCategoryByID(ctx, id)
}

func (r *categoryRepository) GetBySlug(ctx context.Context, slug string) (sqlc.Category, error) {
	return r.q.GetCategoryBySlug(ctx, slug)
}

func (r *categoryRepository) List(ctx context.Context) ([]sqlc.Category, error) {
	return r.q.ListCategories(ctx)
}
