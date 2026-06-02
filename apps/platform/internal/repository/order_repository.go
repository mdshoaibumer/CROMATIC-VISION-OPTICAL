package repository

import (
	"context"
	"fmt"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type OrderItemTxParam struct {
	ProductID       int64
	Quantity        int32
	Price           float64
	ProductSnapshot []byte
}

// OrderRepository handles persistence of orders and order items
type OrderRepository interface {
	Create(ctx context.Context, arg sqlc.CreateOrderParams) (sqlc.Order, error)
	CreateItem(ctx context.Context, arg sqlc.CreateOrderItemParams) (sqlc.OrderItem, error)
	GetByID(ctx context.Context, id int64) (sqlc.Order, error)
	ListByUserID(ctx context.Context, userID uuid.UUID, limit, offset int32) ([]sqlc.Order, error)
	ListAllPaged(ctx context.Context, limit, offset int32) ([]sqlc.Order, error)
	AdminListOrdersPaged(ctx context.Context, limit, offset int32) ([]sqlc.AdminListOrdersPagedRow, error)
	ListOrderItems(ctx context.Context, orderID int64) ([]sqlc.OrderItem, error)
	UpdateStatus(ctx context.Context, orderID int64, status string) (sqlc.Order, error)
	CreateOrderWithTx(ctx context.Context, userID uuid.UUID, totalAmount float64, trackingNum string, shippingAddress string, items []OrderItemTxParam) (sqlc.Order, []sqlc.OrderItem, error)
	AdminGetOrderDetails(ctx context.Context, orderID int64) (sqlc.AdminGetOrderDetailsRow, error)
}

type orderRepository struct {
	pool *pgxpool.Pool
	q    sqlc.Querier
}

// NewOrderRepository compiles a standard order repository instance
func NewOrderRepository(pool *pgxpool.Pool, q sqlc.Querier) OrderRepository {
	return &orderRepository{
		pool: pool,
		q:    q,
	}
}

func (r *orderRepository) Create(ctx context.Context, arg sqlc.CreateOrderParams) (sqlc.Order, error) {
	return r.q.CreateOrder(ctx, arg)
}

func (r *orderRepository) CreateItem(ctx context.Context, arg sqlc.CreateOrderItemParams) (sqlc.OrderItem, error) {
	return r.q.CreateOrderItem(ctx, arg)
}

func (r *orderRepository) GetByID(ctx context.Context, id int64) (sqlc.Order, error) {
	return r.q.GetOrderByID(ctx, id)
}

func (r *orderRepository) ListByUserID(ctx context.Context, userID uuid.UUID, limit, offset int32) ([]sqlc.Order, error) {
	return r.q.ListOrdersByUserIDPaged(ctx, sqlc.ListOrdersByUserIDPagedParams{
		UserID: userID,
		Limit:  limit,
		Offset: offset,
	})
}

func (r *orderRepository) ListAllPaged(ctx context.Context, limit, offset int32) ([]sqlc.Order, error) {
	return r.q.ListOrdersPaged(ctx, sqlc.ListOrdersPagedParams{
		Limit:  limit,
		Offset: offset,
	})
}

func (r *orderRepository) AdminListOrdersPaged(ctx context.Context, limit, offset int32) ([]sqlc.AdminListOrdersPagedRow, error) {
	return r.q.AdminListOrdersPaged(ctx, sqlc.AdminListOrdersPagedParams{
		Limit:  limit,
		Offset: offset,
	})
}

func (r *orderRepository) AdminGetOrderDetails(ctx context.Context, orderID int64) (sqlc.AdminGetOrderDetailsRow, error) {
	return r.q.AdminGetOrderDetails(ctx, orderID)
}

func (r *orderRepository) ListOrderItems(ctx context.Context, orderID int64) ([]sqlc.OrderItem, error) {
	return r.q.ListOrderItemsByOrderID(ctx, orderID)
}

func (r *orderRepository) UpdateStatus(ctx context.Context, orderID int64, status string) (sqlc.Order, error) {
	return r.q.UpdateOrderStatus(ctx, sqlc.UpdateOrderStatusParams{
		ID:     orderID,
		Status: status,
	})
}

func (r *orderRepository) CreateOrderWithTx(
	ctx context.Context,
	userID uuid.UUID,
	totalAmount float64,
	trackingNum string,
	shippingAddress string,
	items []OrderItemTxParam,
) (sqlc.Order, []sqlc.OrderItem, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return sqlc.Order{}, nil, err
	}
	defer tx.Rollback(ctx)

	qtx := r.q.(*sqlc.Queries).WithTx(tx)

	// 1. Decrement product stocks first to verify stock and block race conditions
	for _, item := range items {
		rowsAffected, err := qtx.DecrementProductStock(ctx, sqlc.DecrementProductStockParams{
			ID:    item.ProductID,
			Stock: item.Quantity,
		})
		if err != nil {
			return sqlc.Order{}, nil, err
		}
		if rowsAffected == 0 {
			return sqlc.Order{}, nil, fmt.Errorf("insufficient stock for product ID: %d", item.ProductID)
		}
	}

	// 2. Write primary order card
	orderRecord, err := qtx.CreateOrder(ctx, sqlc.CreateOrderParams{
		UserID:          userID,
		Status:          "PENDING",
		TotalAmount:     totalAmount,
		TrackingNumber:  &trackingNum,
		ShippingAddress: shippingAddress,
	})
	if err != nil {
		return sqlc.Order{}, nil, err
	}

	// 3. Write detailed purchase rows
	itemRecords := make([]sqlc.OrderItem, len(items))
	for idx, item := range items {
		itemRecord, err := qtx.CreateOrderItem(ctx, sqlc.CreateOrderItemParams{
			OrderID:         orderRecord.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			Price:           item.Price,
			ProductSnapshot: item.ProductSnapshot,
		})
		if err != nil {
			return sqlc.Order{}, nil, err
		}
		itemRecords[idx] = itemRecord
	}

	// 4. Get cart to clear it
	cart, err := qtx.GetCartByUserID(ctx, userID)
	if err == nil {
		_ = qtx.ClearCartItems(ctx, cart.ID)
	}

	if err := tx.Commit(ctx); err != nil {
		return sqlc.Order{}, nil, err
	}

	return orderRecord, itemRecords, nil
}
