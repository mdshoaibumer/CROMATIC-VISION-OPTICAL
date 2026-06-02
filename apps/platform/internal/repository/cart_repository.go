package repository

import (
	"context"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// CartRepository defines data access methods for shopping carts
type CartRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (sqlc.Cart, error)
	Create(ctx context.Context, userID uuid.UUID) (sqlc.Cart, error)
	GetItemByProduct(ctx context.Context, cartID int64, productID int64) (sqlc.CartItem, error)
	CreateItem(ctx context.Context, arg sqlc.CreateCartItemParams) (sqlc.CartItem, error)
	UpdateItemQuantity(ctx context.Context, arg sqlc.UpdateCartItemQuantityParams) (sqlc.CartItem, error)
	DeleteItem(ctx context.Context, arg sqlc.DeleteCartItemParams) error
	ClearCart(ctx context.Context, cartID int64) error
	GetItemByID(ctx context.Context, id int64) (sqlc.CartItem, error)
	ListItemsDetailed(ctx context.Context, cartID int64) ([]sqlc.ListCartItemsDetailedRow, error)
}

type cartRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewCartRepository instantiates cartRepository
func NewCartRepository(pool *pgxpool.Pool, q sqlc.Querier) CartRepository {
	return &cartRepository{
		pool: pool,
		q:    q,
	}
}

func (r *cartRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (sqlc.Cart, error) {
	return r.q.GetCartByUserID(ctx, userID)
}

func (r *cartRepository) Create(ctx context.Context, userID uuid.UUID) (sqlc.Cart, error) {
	return r.q.CreateCart(ctx, userID)
}

func (r *cartRepository) GetItemByProduct(ctx context.Context, cartID int64, productID int64) (sqlc.CartItem, error) {
	return r.q.GetCartItemByProduct(ctx, sqlc.GetCartItemByProductParams{
		CartID:    cartID,
		ProductID: productID,
	})
}

func (r *cartRepository) CreateItem(ctx context.Context, arg sqlc.CreateCartItemParams) (sqlc.CartItem, error) {
	return r.q.CreateCartItem(ctx, arg)
}

func (r *cartRepository) UpdateItemQuantity(ctx context.Context, arg sqlc.UpdateCartItemQuantityParams) (sqlc.CartItem, error) {
	return r.q.UpdateCartItemQuantity(ctx, arg)
}

func (r *cartRepository) DeleteItem(ctx context.Context, arg sqlc.DeleteCartItemParams) error {
	return r.q.DeleteCartItem(ctx, arg)
}

func (r *cartRepository) ClearCart(ctx context.Context, cartID int64) error {
	return r.q.ClearCartItems(ctx, cartID)
}

func (r *cartRepository) GetItemByID(ctx context.Context, id int64) (sqlc.CartItem, error) {
	return r.q.GetCartItemByID(ctx, id)
}

func (r *cartRepository) ListItemsDetailed(ctx context.Context, cartID int64) ([]sqlc.ListCartItemsDetailedRow, error) {
	return r.q.ListCartItemsDetailed(ctx, cartID)
}
