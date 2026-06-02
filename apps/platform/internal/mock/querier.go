package mock

import (
	"context"
	"fmt"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// LiveMockQuerier implements sqlc.Querier with in-memory storage for auth flows
type LiveMockQuerier struct {
	userRepo *UserRepository
}

func NewLiveMockQuerier(userRepo *UserRepository) *LiveMockQuerier {
	return &LiveMockQuerier{userRepo: userRepo}
}

func (q *LiveMockQuerier) CreateUser(_ context.Context, arg sqlc.CreateUserParams) (sqlc.User, error) {
	u := sqlc.User{
		ID:           uuid.New(),
		Name:         arg.Name,
		Email:        arg.Email,
		Phone:        arg.Phone,
		PasswordHash: arg.PasswordHash,
		Role:         arg.Role,
		IsActive:     arg.IsActive,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	q.userRepo.AddUser(u)
	return u, nil
}

func (q *LiveMockQuerier) GetUserByEmail(ctx context.Context, email string) (sqlc.User, error) {
	u, err := q.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return sqlc.User{}, pgx.ErrNoRows
	}
	return u, nil
}

func (q *LiveMockQuerier) GetUserByID(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
	return q.userRepo.GetByID(ctx, id)
}

func (q *LiveMockQuerier) UpdateUser(_ context.Context, arg sqlc.UpdateUserParams) (sqlc.User, error) {
	q.userRepo.mu.Lock()
	defer q.userRepo.mu.Unlock()
	for i, u := range q.userRepo.users {
		if u.ID == arg.ID {
			if arg.Name != nil {
				q.userRepo.users[i].Name = *arg.Name
			}
			if arg.Email != nil {
				q.userRepo.users[i].Email = *arg.Email
			}
			if arg.Phone != nil {
				q.userRepo.users[i].Phone = arg.Phone
			}
			q.userRepo.users[i].UpdatedAt = time.Now()
			return q.userRepo.users[i], nil
		}
	}
	return sqlc.User{}, fmt.Errorf("user not found")
}

func (q *LiveMockQuerier) DeleteUser(_ context.Context, id uuid.UUID) error {
	q.userRepo.mu.Lock()
	defer q.userRepo.mu.Unlock()
	for i, u := range q.userRepo.users {
		if u.ID == id {
			q.userRepo.users = append(q.userRepo.users[:i], q.userRepo.users[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("user not found")
}

// ─── No-op stubs for Querier interface satisfaction ──────────────────────────
// These are never called by AuthHandler but must exist to satisfy the interface.

func (q *LiveMockQuerier) AdminGetOrderDetails(_ context.Context, _ int64) (sqlc.AdminGetOrderDetailsRow, error) {
	return sqlc.AdminGetOrderDetailsRow{}, fmt.Errorf("not implemented in dev mode")
}
func (q *LiveMockQuerier) AdminGetPrescriptionByID(_ context.Context, _ int64) (sqlc.AdminGetPrescriptionByIDRow, error) {
	return sqlc.AdminGetPrescriptionByIDRow{}, fmt.Errorf("not implemented in dev mode")
}
func (q *LiveMockQuerier) AdminListAllPrescriptions(_ context.Context) ([]sqlc.AdminListAllPrescriptionsRow, error) {
	return nil, fmt.Errorf("not implemented in dev mode")
}
func (q *LiveMockQuerier) AdminListOrdersPaged(_ context.Context, _ sqlc.AdminListOrdersPagedParams) ([]sqlc.AdminListOrdersPagedRow, error) {
	return nil, fmt.Errorf("not implemented in dev mode")
}
func (q *LiveMockQuerier) ClearCartItems(_ context.Context, _ int64) error {
	return nil
}
func (q *LiveMockQuerier) ClearPrimaryProductImage(_ context.Context, _ int64) error {
	return nil
}
func (q *LiveMockQuerier) CreateCart(_ context.Context, _ uuid.UUID) (sqlc.Cart, error) {
	return sqlc.Cart{}, nil
}
func (q *LiveMockQuerier) CreateCartItem(_ context.Context, _ sqlc.CreateCartItemParams) (sqlc.CartItem, error) {
	return sqlc.CartItem{}, nil
}
func (q *LiveMockQuerier) CreateCategory(_ context.Context, _ sqlc.CreateCategoryParams) (sqlc.Category, error) {
	return sqlc.Category{}, nil
}
func (q *LiveMockQuerier) CreateInvoice(_ context.Context, _ sqlc.CreateInvoiceParams) (sqlc.Invoice, error) {
	return sqlc.Invoice{}, nil
}
func (q *LiveMockQuerier) CreateOrder(_ context.Context, _ sqlc.CreateOrderParams) (sqlc.Order, error) {
	return sqlc.Order{}, nil
}
func (q *LiveMockQuerier) CreateOrderItem(_ context.Context, _ sqlc.CreateOrderItemParams) (sqlc.OrderItem, error) {
	return sqlc.OrderItem{}, nil
}
func (q *LiveMockQuerier) CreatePayment(_ context.Context, _ sqlc.CreatePaymentParams) (sqlc.Payment, error) {
	return sqlc.Payment{}, nil
}
func (q *LiveMockQuerier) CreatePrescription(_ context.Context, _ sqlc.CreatePrescriptionParams) (sqlc.Prescription, error) {
	return sqlc.Prescription{}, nil
}
func (q *LiveMockQuerier) CreateProduct(_ context.Context, _ sqlc.CreateProductParams) (sqlc.Product, error) {
	return sqlc.Product{}, nil
}
func (q *LiveMockQuerier) CreateProductImage(_ context.Context, _ sqlc.CreateProductImageParams) (sqlc.ProductImage, error) {
	return sqlc.ProductImage{}, nil
}
func (q *LiveMockQuerier) DecrementProductStock(_ context.Context, _ sqlc.DecrementProductStockParams) (int64, error) {
	return 1, nil
}
func (q *LiveMockQuerier) DeleteCartItem(_ context.Context, _ sqlc.DeleteCartItemParams) error {
	return nil
}
func (q *LiveMockQuerier) DeleteCategory(_ context.Context, _ int64) error { return nil }
func (q *LiveMockQuerier) DeleteProduct(_ context.Context, _ int64) error  { return nil }
func (q *LiveMockQuerier) DeleteProductImageByID(_ context.Context, _ sqlc.DeleteProductImageByIDParams) error {
	return nil
}
func (q *LiveMockQuerier) DeleteProductImagesByProductID(_ context.Context, _ int64) error {
	return nil
}
func (q *LiveMockQuerier) GetCartByUserID(_ context.Context, _ uuid.UUID) (sqlc.Cart, error) {
	return sqlc.Cart{}, nil
}
func (q *LiveMockQuerier) GetCartItemByID(_ context.Context, _ int64) (sqlc.CartItem, error) {
	return sqlc.CartItem{}, nil
}
func (q *LiveMockQuerier) GetCartItemByProduct(_ context.Context, _ sqlc.GetCartItemByProductParams) (sqlc.CartItem, error) {
	return sqlc.CartItem{}, nil
}
func (q *LiveMockQuerier) GetCategoryByID(_ context.Context, _ int64) (sqlc.Category, error) {
	return sqlc.Category{}, nil
}
func (q *LiveMockQuerier) GetCategoryBySlug(_ context.Context, _ string) (sqlc.Category, error) {
	return sqlc.Category{}, nil
}
func (q *LiveMockQuerier) GetInvoiceByID(_ context.Context, _ int64) (sqlc.Invoice, error) {
	return sqlc.Invoice{}, nil
}
func (q *LiveMockQuerier) GetInvoiceByIDAndUserID(_ context.Context, _ sqlc.GetInvoiceByIDAndUserIDParams) (sqlc.Invoice, error) {
	return sqlc.Invoice{}, nil
}
func (q *LiveMockQuerier) GetInvoiceByOrderID(_ context.Context, _ int64) (sqlc.Invoice, error) {
	return sqlc.Invoice{}, nil
}
func (q *LiveMockQuerier) GetOrderByID(_ context.Context, _ int64) (sqlc.Order, error) {
	return sqlc.Order{}, nil
}
func (q *LiveMockQuerier) GetPaymentByID(_ context.Context, _ int64) (sqlc.Payment, error) {
	return sqlc.Payment{}, nil
}
func (q *LiveMockQuerier) GetPaymentByProviderOrderID(_ context.Context, _ string) (sqlc.Payment, error) {
	return sqlc.Payment{}, nil
}
func (q *LiveMockQuerier) GetPaymentByProviderPaymentID(_ context.Context, _ *string) (sqlc.Payment, error) {
	return sqlc.Payment{}, nil
}
func (q *LiveMockQuerier) GetPrescriptionByID(_ context.Context, _ int64) (sqlc.Prescription, error) {
	return sqlc.Prescription{}, nil
}
func (q *LiveMockQuerier) GetPrescriptionByIDAndUserID(_ context.Context, _ sqlc.GetPrescriptionByIDAndUserIDParams) (sqlc.Prescription, error) {
	return sqlc.Prescription{}, nil
}
func (q *LiveMockQuerier) GetProductByID(_ context.Context, _ int64) (sqlc.Product, error) {
	return sqlc.Product{}, nil
}
func (q *LiveMockQuerier) GetProductBySlug(_ context.Context, _ string) (sqlc.Product, error) {
	return sqlc.Product{}, nil
}
func (q *LiveMockQuerier) GetProductImageByID(_ context.Context, _ int64) (sqlc.ProductImage, error) {
	return sqlc.ProductImage{}, nil
}
func (q *LiveMockQuerier) ListAllInvoices(_ context.Context) ([]sqlc.Invoice, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListAllPrescriptions(_ context.Context) ([]sqlc.Prescription, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListCartItemsDetailed(_ context.Context, _ int64) ([]sqlc.ListCartItemsDetailedRow, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListCategories(_ context.Context) ([]sqlc.Category, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListInvoicesByUserID(_ context.Context, _ uuid.UUID) ([]sqlc.Invoice, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListOrderItemsByOrderID(_ context.Context, _ int64) ([]sqlc.OrderItem, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListOrdersByUserID(_ context.Context, _ uuid.UUID) ([]sqlc.Order, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListOrdersByUserIDPaged(_ context.Context, _ sqlc.ListOrdersByUserIDPagedParams) ([]sqlc.Order, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListOrdersPaged(_ context.Context, _ sqlc.ListOrdersPagedParams) ([]sqlc.Order, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListPaymentsByUserID(_ context.Context, _ uuid.UUID) ([]sqlc.Payment, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListPrescriptionsByOrderID(_ context.Context, _ int64) ([]sqlc.Prescription, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListPrescriptionsByUserID(_ context.Context, _ uuid.UUID) ([]sqlc.Prescription, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListProductImagesByProductID(_ context.Context, _ int64) ([]sqlc.ProductImage, error) {
	return nil, nil
}
func (q *LiveMockQuerier) ListProductsLimited(_ context.Context, _ sqlc.ListProductsLimitedParams) ([]sqlc.Product, error) {
	return nil, nil
}
func (q *LiveMockQuerier) UpdateCartItemQuantity(_ context.Context, _ sqlc.UpdateCartItemQuantityParams) (sqlc.CartItem, error) {
	return sqlc.CartItem{}, nil
}
func (q *LiveMockQuerier) UpdateCategory(_ context.Context, _ sqlc.UpdateCategoryParams) (sqlc.Category, error) {
	return sqlc.Category{}, nil
}
func (q *LiveMockQuerier) UpdateInvoiceStatus(_ context.Context, _ sqlc.UpdateInvoiceStatusParams) (sqlc.Invoice, error) {
	return sqlc.Invoice{}, nil
}
func (q *LiveMockQuerier) UpdateOrderStatus(_ context.Context, _ sqlc.UpdateOrderStatusParams) (sqlc.Order, error) {
	return sqlc.Order{}, nil
}
func (q *LiveMockQuerier) UpdatePaymentStatus(_ context.Context, _ sqlc.UpdatePaymentStatusParams) (sqlc.Payment, error) {
	return sqlc.Payment{}, nil
}
func (q *LiveMockQuerier) UpdatePaymentStatusAndPaymentID(_ context.Context, _ sqlc.UpdatePaymentStatusAndPaymentIDParams) (sqlc.Payment, error) {
	return sqlc.Payment{}, nil
}
func (q *LiveMockQuerier) UpdatePrescriptionStatus(_ context.Context, _ sqlc.UpdatePrescriptionStatusParams) (sqlc.Prescription, error) {
	return sqlc.Prescription{}, nil
}
func (q *LiveMockQuerier) UpdateProduct(_ context.Context, _ sqlc.UpdateProductParams) (sqlc.Product, error) {
	return sqlc.Product{}, nil
}

// Verify interface compliance
var _ sqlc.Querier = (*LiveMockQuerier)(nil)
