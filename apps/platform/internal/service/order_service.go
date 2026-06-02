package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/shared/sanitize"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

var (
	ErrEmptyCart       = errors.New("cannot place an order with an empty cart")
	ErrOrderNotFound   = errors.New("order not found")
	ErrInvalidStatus   = errors.New("invalid order status")
	ErrAddressReq      = errors.New("shipping address is required")
	ErrPrescriptionReq = errors.New("prescription lens orders require uploaded prescriptions before processing")
)

// Order Status values
const (
	StatusPending    = "PENDING"
	StatusPaid       = "PAID"
	StatusProcessing = "PROCESSING"
	StatusShipped    = "SHIPPED"
	StatusDelivered  = "DELIVERED"
	StatusCancelled  = "CANCELLED"
)

type ProductSnapshot struct {
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	Brand       string  `json:"brand"`
	FrameType   string  `json:"frame_type"`
	Material    string  `json:"material"`
	Gender      string  `json:"gender"`
}

type OrderItemResponse struct {
	ID              int64            `json:"id"`
	ProductID       int64            `json:"product_id"`
	Quantity        int32            `json:"quantity"`
	Price           float64          `json:"price"`
	ProductSnapshot *ProductSnapshot `json:"product_snapshot"`
}

type OrderResponse struct {
	ID              int64               `json:"id"`
	UserID          uuid.UUID           `json:"user_id"`
	UserName        string              `json:"user_name,omitempty"`
	UserEmail       string              `json:"user_email,omitempty"`
	Status          string              `json:"status"`
	TotalAmount     float64             `json:"total_amount"`
	TrackingNumber  *string             `json:"tracking_number"`
	ShippingAddress string              `json:"shipping_address"`
	Items           []OrderItemResponse `json:"items"`
	CreatedAt       time.Time           `json:"created_at"`
	UpdatedAt       time.Time           `json:"updated_at"`
}

// OrderService handles order business processes
type OrderService interface {
	CreateOrder(ctx context.Context, userID uuid.UUID, shippingAddress string) (OrderResponse, error)
	GetOrders(ctx context.Context, userID uuid.UUID, page, limit int32) ([]OrderResponse, error)
	GetOrderDetails(ctx context.Context, userID uuid.UUID, orderID int64, isAdmin bool) (OrderResponse, error)
	ListAllOrdersPaged(ctx context.Context, page, limit int32) ([]OrderResponse, error)
	UpdateOrderStatus(ctx context.Context, orderID int64, status string) (OrderResponse, error)
}

type orderService struct {
	orderRepo repository.OrderRepository
	cartRepo  repository.CartRepository
	prodRepo  repository.ProductRepository
	rxRepo    repository.PrescriptionRepository
}

// NewOrderService compiles an instance of OrderService
func NewOrderService(
	orderRepo repository.OrderRepository,
	cartRepo repository.CartRepository,
	prodRepo repository.ProductRepository,
	rxRepo repository.PrescriptionRepository,
) OrderService {
	return &orderService{
		orderRepo: orderRepo,
		cartRepo:  cartRepo,
		prodRepo:  prodRepo,
		rxRepo:    rxRepo,
	}
}

func (s *orderService) CreateOrder(ctx context.Context, userID uuid.UUID, shippingAddress string) (OrderResponse, error) {
	shippingAddress = sanitize.Text(strings.TrimSpace(shippingAddress))
	if shippingAddress == "" {
		return OrderResponse{}, ErrAddressReq
	}

	// 1. Get user cart properties
	cart, err := s.cartRepo.GetByUserID(ctx, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return OrderResponse{}, ErrEmptyCart
		}
		return OrderResponse{}, err
	}

	// 2. Fetch cart items
	cartItems, err := s.cartRepo.ListItemsDetailed(ctx, cart.ID)
	if err != nil {
		return OrderResponse{}, err
	}
	if len(cartItems) == 0 {
		return OrderResponse{}, ErrEmptyCart
	}

	// 3. Prepare parameters for transaction execution
	var totalAmount float64
	txItems := make([]repository.OrderItemTxParam, len(cartItems))

	for i, ci := range cartItems {
		p, err := s.prodRepo.GetByID(ctx, ci.ProductID)
		if err != nil {
			return OrderResponse{}, err
		}

		if p.Stock < ci.Quantity {
			return OrderResponse{}, fmt.Errorf("insufficient stock for product %s: available %d, requested %d", p.Name, p.Stock, ci.Quantity)
		}

		price := p.Price
		if p.SalePrice != nil {
			price = *p.SalePrice
		}

		subtotal := price * float64(ci.Quantity)
		totalAmount += subtotal

		snapStruct := ProductSnapshot{
			ID:          p.ID,
			Name:        p.Name,
			Slug:        p.Slug,
			Description: p.Description,
			Price:       price,
			Brand:       p.Brand,
			FrameType:   p.FrameType,
			Material:    p.Material,
			Gender:      p.Gender,
		}

		snapBytes, err := json.Marshal(snapStruct)
		if err != nil {
			return OrderResponse{}, err
		}

		txItems[i] = repository.OrderItemTxParam{
			ProductID:       p.ID,
			Quantity:        ci.Quantity,
			Price:           price,
			ProductSnapshot: snapBytes,
		}
	}

	// Generate a tracking number
	trackingNum := s.generateTrackingNo()

	// 4. Delegate Postgres transaction flow to Repository layer
	orderRecord, itemRecords, err := s.orderRepo.CreateOrderWithTx(ctx, userID, totalAmount, trackingNum, shippingAddress, txItems)
	if err != nil {
		if strings.Contains(err.Error(), "stock") || strings.Contains(err.Error(), "insufficient") {
			return OrderResponse{}, ErrOutOfStock
		}
		return OrderResponse{}, err
	}

	// Assemble final checkout response object
	return s.buildResponse(orderRecord, itemRecords), nil
}

func (s *orderService) GetOrders(ctx context.Context, userID uuid.UUID, page, limit int32) ([]OrderResponse, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	ordersList, err := s.orderRepo.ListByUserID(ctx, userID, limit, offset)
	if err != nil {
		return nil, err
	}

	responses := make([]OrderResponse, len(ordersList))
	for i, ord := range ordersList {
		items, err := s.orderRepo.ListOrderItems(ctx, ord.ID)
		if err != nil {
			return nil, err
		}
		responses[i] = s.buildResponse(ord, items)
	}

	return responses, nil
}

func (s *orderService) GetOrderDetails(ctx context.Context, userID uuid.UUID, orderID int64, isAdmin bool) (OrderResponse, error) {
	if isAdmin {
		order, err := s.orderRepo.AdminGetOrderDetails(ctx, orderID)
		if err != nil {
			if errors.Is(err, pgx.ErrNoRows) {
				return OrderResponse{}, ErrOrderNotFound
			}
			return OrderResponse{}, err
		}

		items, err := s.orderRepo.ListOrderItems(ctx, order.ID)
		if err != nil {
			return OrderResponse{}, err
		}

		return s.buildAdminOrderDetailsResponse(order, items), nil
	}

	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return OrderResponse{}, ErrOrderNotFound
		}
		return OrderResponse{}, err
	}

	// Customer can only read their own orders
	if order.UserID != userID {
		return OrderResponse{}, errors.New("unauthorized access to specified order details")
	}

	items, err := s.orderRepo.ListOrderItems(ctx, order.ID)
	if err != nil {
		return OrderResponse{}, err
	}

	return s.buildResponse(order, items), nil
}

func (s *orderService) ListAllOrdersPaged(ctx context.Context, page, limit int32) ([]OrderResponse, error) {
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = 20
	}
	offset := (page - 1) * limit

	ordersList, err := s.orderRepo.AdminListOrdersPaged(ctx, limit, offset)
	if err != nil {
		return nil, err
	}

	responses := make([]OrderResponse, len(ordersList))
	for i, ord := range ordersList {
		items, err := s.orderRepo.ListOrderItems(ctx, ord.ID)
		if err != nil {
			return nil, err
		}
		responses[i] = s.buildAdminListPagedResponse(ord, items)
	}

	return responses, nil
}

func (s *orderService) UpdateOrderStatus(ctx context.Context, orderID int64, status string) (OrderResponse, error) {
	status = strings.ToUpper(status)
	validStatuses := map[string]bool{
		StatusPending:    true,
		StatusPaid:       true,
		StatusProcessing: true,
		StatusShipped:    true,
		StatusDelivered:  true,
		StatusCancelled:  true,
	}

	if !validStatuses[status] {
		return OrderResponse{}, ErrInvalidStatus
	}

	// Check if order exists
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return OrderResponse{}, ErrOrderNotFound
		}
		return OrderResponse{}, err
	}

	// Fetch existing items for validations and response formatting
	items, err := s.orderRepo.ListOrderItems(ctx, order.ID)
	if err != nil {
		return OrderResponse{}, err
	}

	// Enforce prescription lens rules if status is moving beyond pending states to processing states
	if status == StatusProcessing || status == StatusShipped || status == StatusDelivered {
		isLensOrder := false
		for _, item := range items {
			details, err := s.prodRepo.GetDetailsByID(ctx, item.ProductID)
			if err == nil {
				nameLower := strings.ToLower(details.Name)
				descLower := strings.ToLower(details.Description)
				frameLower := strings.ToLower(details.FrameType)
				catLower := ""
				if details.CategoryName != nil {
					catLower = strings.ToLower(*details.CategoryName)
				}

				if strings.Contains(nameLower, "lens") || strings.Contains(nameLower, "prescription") ||
					strings.Contains(descLower, "lens") || strings.Contains(descLower, "prescription") ||
					strings.Contains(frameLower, "lens") || strings.Contains(frameLower, "prescription") ||
					strings.Contains(catLower, "lens") || strings.Contains(catLower, "prescription") {
					isLensOrder = true
					break
				}
			}
		}

		if isLensOrder {
			rxs, err := s.rxRepo.ListByOrderID(ctx, orderID)
			if err != nil {
				return OrderResponse{}, err
			}

			hasUploadedRx := false
			for _, rx := range rxs {
				st := strings.ToUpper(rx.Status)
				if st == "UPLOADED" || st == "REVIEWED" || st == "APPROVED" {
					hasUploadedRx = true
					break
				}
			}

			if !hasUploadedRx {
				return OrderResponse{}, ErrPrescriptionReq
			}
		}
	}

	// Update in DB
	updatedOrder, err := s.orderRepo.UpdateStatus(ctx, orderID, status)
	if err != nil {
		return OrderResponse{}, err
	}

	return s.buildResponse(updatedOrder, items), nil
}

// Helpers
func (s *orderService) generateTrackingNo() string {
	now := time.Now()
	code := rand.Intn(900000) + 100000 // 6-digit random number
	return fmt.Sprintf("TRK-%s-%d", now.Format("20060102"), code)
}

func (s *orderService) buildResponse(order sqlc.Order, items []sqlc.OrderItem) OrderResponse {
	itemResponses := make([]OrderItemResponse, len(items))
	for idx, item := range items {
		var snapshot ProductSnapshot
		if len(item.ProductSnapshot) > 0 {
			_ = json.Unmarshal(item.ProductSnapshot, &snapshot)
		}

		itemResponses[idx] = OrderItemResponse{
			ID:              item.ID,
			ProductID:       item.ProductID,
			Quantity:        item.Quantity,
			Price:           item.Price,
			ProductSnapshot: &snapshot,
		}
	}

	if len(itemResponses) == 0 {
		itemResponses = []OrderItemResponse{}
	}

	return OrderResponse{
		ID:              order.ID,
		UserID:          order.UserID,
		Status:          order.Status,
		TotalAmount:     order.TotalAmount,
		TrackingNumber:  order.TrackingNumber,
		ShippingAddress: order.ShippingAddress,
		Items:           itemResponses,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}
}

func (s *orderService) buildAdminListPagedResponse(order sqlc.AdminListOrdersPagedRow, items []sqlc.OrderItem) OrderResponse {
	resp := s.buildResponse(sqlc.Order{
		ID:              order.ID,
		UserID:          order.UserID,
		Status:          order.Status,
		TotalAmount:     order.TotalAmount,
		TrackingNumber:  order.TrackingNumber,
		ShippingAddress: order.ShippingAddress,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}, items)
	resp.UserName = order.UserName
	resp.UserEmail = order.UserEmail
	return resp
}

func (s *orderService) buildAdminOrderDetailsResponse(order sqlc.AdminGetOrderDetailsRow, items []sqlc.OrderItem) OrderResponse {
	resp := s.buildResponse(sqlc.Order{
		ID:              order.ID,
		UserID:          order.UserID,
		Status:          order.Status,
		TotalAmount:     order.TotalAmount,
		TrackingNumber:  order.TrackingNumber,
		ShippingAddress: order.ShippingAddress,
		CreatedAt:       order.CreatedAt,
		UpdatedAt:       order.UpdatedAt,
	}, items)
	resp.UserName = order.UserName
	resp.UserEmail = order.UserEmail
	return resp
}
