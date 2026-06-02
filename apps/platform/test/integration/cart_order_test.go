package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"testing"
	"time"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// -- MOCK CART REPOSITORY --

type MockCartRepository struct {
	carts      map[uuid.UUID]sqlc.Cart
	cartItems  map[int64][]sqlc.CartItem
	nextID     int64
	nextItemID int64
	prodRepo   repository.ProductRepository
}

func NewMockCartRepository(prodRepo repository.ProductRepository) *MockCartRepository {
	return &MockCartRepository{
		carts:     make(map[uuid.UUID]sqlc.Cart),
		cartItems: make(map[int64][]sqlc.CartItem),
		prodRepo:  prodRepo,
	}
}

func (m *MockCartRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (sqlc.Cart, error) {
	cart, ok := m.carts[userID]
	if !ok {
		return sqlc.Cart{}, pgx.ErrNoRows
	}
	return cart, nil
}

func (m *MockCartRepository) Create(ctx context.Context, userID uuid.UUID) (sqlc.Cart, error) {
	m.nextID++
	cart := sqlc.Cart{
		ID:        m.nextID,
		UserID:    userID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.carts[userID] = cart
	m.cartItems[m.nextID] = []sqlc.CartItem{}
	return cart, nil
}

func (m *MockCartRepository) GetItemByProduct(ctx context.Context, cartID int64, productID int64) (sqlc.CartItem, error) {
	items := m.cartItems[cartID]
	for _, item := range items {
		if item.ProductID == productID {
			return item, nil
		}
	}
	return sqlc.CartItem{}, pgx.ErrNoRows
}

func (m *MockCartRepository) CreateItem(ctx context.Context, arg sqlc.CreateCartItemParams) (sqlc.CartItem, error) {
	m.nextItemID++
	item := sqlc.CartItem{
		ID:        m.nextItemID,
		CartID:    arg.CartID,
		ProductID: arg.ProductID,
		Quantity:  arg.Quantity,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.cartItems[arg.CartID] = append(m.cartItems[arg.CartID], item)
	return item, nil
}

func (m *MockCartRepository) UpdateItemQuantity(ctx context.Context, arg sqlc.UpdateCartItemQuantityParams) (sqlc.CartItem, error) {
	items, ok := m.cartItems[arg.ID] // wait, arg.ID is item ID!
	_ = items
	_ = ok

	// Search and replace based on item ID across all carts
	var updated sqlc.CartItem
	found := false
	for cartID, list := range m.cartItems {
		for i, item := range list {
			if item.ID == arg.ID {
				list[i].Quantity = arg.Quantity
				list[i].UpdatedAt = time.Now()
				updated = list[i]
				m.cartItems[cartID] = list
				found = true
				break
			}
		}
		if found {
			break
		}
	}

	if !found {
		return sqlc.CartItem{}, pgx.ErrNoRows
	}
	return updated, nil
}

func (m *MockCartRepository) DeleteItem(ctx context.Context, arg sqlc.DeleteCartItemParams) error {
	list := m.cartItems[arg.CartID]
	var newList []sqlc.CartItem
	found := false
	for _, item := range list {
		if item.ID == arg.ID {
			found = true
			continue
		}
		newList = append(newList, item)
	}
	m.cartItems[arg.CartID] = newList
	if !found {
		return pgx.ErrNoRows
	}
	return nil
}

func (m *MockCartRepository) ClearCart(ctx context.Context, cartID int64) error {
	m.cartItems[cartID] = []sqlc.CartItem{}
	return nil
}

func (m *MockCartRepository) GetItemByID(ctx context.Context, id int64) (sqlc.CartItem, error) {
	for _, list := range m.cartItems {
		for _, item := range list {
			if item.ID == id {
				return item, nil
			}
		}
	}
	return sqlc.CartItem{}, pgx.ErrNoRows
}

func (m *MockCartRepository) ListItemsDetailed(ctx context.Context, cartID int64) ([]sqlc.ListCartItemsDetailedRow, error) {
	items := m.cartItems[cartID]
	var rows []sqlc.ListCartItemsDetailedRow
	for _, item := range items {
		p, err := m.prodRepo.GetByID(ctx, item.ProductID)
		if err != nil {
			return nil, err
		}
		rows = append(rows, sqlc.ListCartItemsDetailedRow{
			ID:               item.ID,
			CartID:           item.CartID,
			ProductID:        item.ProductID,
			Quantity:         item.Quantity,
			CreatedAt:        item.CreatedAt,
			UpdatedAt:        item.UpdatedAt,
			ProductName:      p.Name,
			ProductPrice:     p.Price,
			ProductSalePrice: p.SalePrice,
			ProductSlug:      p.Slug,
			ProductBrand:     p.Brand,
			ProductStock:     p.Stock,
		})
	}
	return rows, nil
}

// -- MOCK ORDER REPOSITORY --

type MockOrderRepository struct {
	orders     map[int64]sqlc.Order
	orderItems map[int64][]sqlc.OrderItem
	nextID     int64
	nextItemID int64
	prodRepo   repository.ProductRepository
	cartRepo   *MockCartRepository
}

func NewMockOrderRepository(prodRepo repository.ProductRepository, cartRepo *MockCartRepository) *MockOrderRepository {
	return &MockOrderRepository{
		orders:     make(map[int64]sqlc.Order),
		orderItems: make(map[int64][]sqlc.OrderItem),
		prodRepo:   prodRepo,
		cartRepo:   cartRepo,
	}
}

func (m *MockOrderRepository) Create(ctx context.Context, arg sqlc.CreateOrderParams) (sqlc.Order, error) {
	m.nextID++
	order := sqlc.Order{
		ID:              m.nextID,
		UserID:          arg.UserID,
		Status:          arg.Status,
		TotalAmount:     arg.TotalAmount,
		TrackingNumber:  arg.TrackingNumber,
		ShippingAddress: arg.ShippingAddress,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
	m.orders[m.nextID] = order
	return order, nil
}

func (m *MockOrderRepository) CreateItem(ctx context.Context, arg sqlc.CreateOrderItemParams) (sqlc.OrderItem, error) {
	m.nextItemID++
	item := sqlc.OrderItem{
		ID:              m.nextItemID,
		OrderID:         arg.OrderID,
		ProductID:       arg.ProductID,
		Quantity:        arg.Quantity,
		Price:           arg.Price,
		ProductSnapshot: arg.ProductSnapshot,
	}
	m.orderItems[arg.OrderID] = append(m.orderItems[arg.OrderID], item)
	return item, nil
}

func (m *MockOrderRepository) GetByID(ctx context.Context, id int64) (sqlc.Order, error) {
	order, ok := m.orders[id]
	if !ok {
		return sqlc.Order{}, pgx.ErrNoRows
	}
	return order, nil
}

func (m *MockOrderRepository) ListByUserID(ctx context.Context, userID uuid.UUID, limit, offset int32) ([]sqlc.Order, error) {
	var list []sqlc.Order
	for _, o := range m.orders {
		if o.UserID == userID {
			list = append(list, o)
		}
	}
	// Apply paging roughly
	start := int(offset)
	if start > len(list) {
		start = len(list)
	}
	end := start + int(limit)
	if end > len(list) {
		end = len(list)
	}
	return list[start:end], nil
}

func (m *MockOrderRepository) ListAllPaged(ctx context.Context, limit, offset int32) ([]sqlc.Order, error) {
	var list []sqlc.Order
	for _, o := range m.orders {
		list = append(list, o)
	}
	start := int(offset)
	if start > len(list) {
		start = len(list)
	}
	end := start + int(limit)
	if end > len(list) {
		end = len(list)
	}
	return list[start:end], nil
}

func (m *MockOrderRepository) ListOrderItems(ctx context.Context, orderID int64) ([]sqlc.OrderItem, error) {
	return m.orderItems[orderID], nil
}

func (m *MockOrderRepository) UpdateStatus(ctx context.Context, orderID int64, status string) (sqlc.Order, error) {
	o, ok := m.orders[orderID]
	if !ok {
		return sqlc.Order{}, pgx.ErrNoRows
	}
	o.Status = status
	o.UpdatedAt = time.Now()
	m.orders[orderID] = o
	return o, nil
}

func (m *MockOrderRepository) CreateOrderWithTx(
	ctx context.Context,
	userID uuid.UUID,
	totalAmount float64,
	trackingNum string,
	shippingAddress string,
	items []repository.OrderItemTxParam,
) (sqlc.Order, []sqlc.OrderItem, error) {
	// Simulate stock checking and decrement atomically in-memory
	for _, it := range items {
		p, err := m.prodRepo.GetByID(ctx, it.ProductID)
		if err != nil {
			return sqlc.Order{}, nil, err
		}
		if p.Stock < it.Quantity {
			return sqlc.Order{}, nil, fmt.Errorf("insufficient stock for product ID: %d", it.ProductID)
		}
		// update mock stock
		newStock := p.Stock - it.Quantity
		_, _ = m.prodRepo.Update(ctx, sqlc.UpdateProductParams{
			ID:    p.ID,
			Stock: &newStock,
		})
	}

	o, err := m.Create(ctx, sqlc.CreateOrderParams{
		UserID:          userID,
		Status:          "PENDING",
		TotalAmount:     totalAmount,
		TrackingNumber:  &trackingNum,
		ShippingAddress: shippingAddress,
	})
	if err != nil {
		return sqlc.Order{}, nil, err
	}

	var results []sqlc.OrderItem
	for _, it := range items {
		itemRecord, err := m.CreateItem(ctx, sqlc.CreateOrderItemParams{
			OrderID:         o.ID,
			ProductID:       it.ProductID,
			Quantity:        it.Quantity,
			Price:           it.Price,
			ProductSnapshot: it.ProductSnapshot,
		})
		if err != nil {
			return sqlc.Order{}, nil, err
		}
		results = append(results, itemRecord)
	}

	// Empty cart
	cart, err := m.cartRepo.GetByUserID(ctx, userID)
	if err == nil {
		_ = m.cartRepo.ClearCart(ctx, cart.ID)
	}

	return o, results, nil
}

// -- MOCK PRESCRIPTION REPOSITORY --

func (m *MockOrderRepository) AdminListOrdersPaged(ctx context.Context, limit, offset int32) ([]sqlc.AdminListOrdersPagedRow, error) {
	var list []sqlc.AdminListOrdersPagedRow
	for _, o := range m.orders {
		list = append(list, sqlc.AdminListOrdersPagedRow{
			ID:              o.ID,
			UserID:          o.UserID,
			Status:          o.Status,
			TotalAmount:     o.TotalAmount,
			TrackingNumber:  o.TrackingNumber,
			ShippingAddress: o.ShippingAddress,
			CreatedAt:       o.CreatedAt,
			UpdatedAt:       o.UpdatedAt,
		})
	}
	return list, nil
}

func (m *MockOrderRepository) AdminGetOrderDetails(ctx context.Context, orderID int64) (sqlc.AdminGetOrderDetailsRow, error) {
	o, ok := m.orders[orderID]
	if !ok {
		return sqlc.AdminGetOrderDetailsRow{}, pgx.ErrNoRows
	}
	return sqlc.AdminGetOrderDetailsRow{
		ID:              o.ID,
		UserID:          o.UserID,
		Status:          o.Status,
		TotalAmount:     o.TotalAmount,
		TrackingNumber:  o.TrackingNumber,
		ShippingAddress: o.ShippingAddress,
		CreatedAt:       o.CreatedAt,
		UpdatedAt:       o.UpdatedAt,
	}, nil
}

// -- MOCK PRESCRIPTION REPOSITORY --

type MockPrescriptionRepository struct {
	prescriptions map[int64]sqlc.Prescription
	nextID        int64
}

func NewMockPrescriptionRepository() *MockPrescriptionRepository {
	return &MockPrescriptionRepository{
		prescriptions: make(map[int64]sqlc.Prescription),
	}
}

func (m *MockPrescriptionRepository) Create(ctx context.Context, arg sqlc.CreatePrescriptionParams) (sqlc.Prescription, error) {
	m.nextID++
	rx := sqlc.Prescription{
		ID:               m.nextID,
		OrderID:          arg.OrderID,
		UserID:           arg.UserID,
		PrescriptionType: arg.PrescriptionType,
		FileUrl:          arg.FileUrl,
		ObjectKey:        arg.ObjectKey,
		Notes:            arg.Notes,
		Status:           arg.Status,
		CreatedAt:        time.Now(),
		UpdatedAt:        time.Now(),
	}
	m.prescriptions[m.nextID] = rx
	return rx, nil
}

func (m *MockPrescriptionRepository) GetByID(ctx context.Context, id int64) (sqlc.Prescription, error) {
	rx, ok := m.prescriptions[id]
	if !ok {
		return sqlc.Prescription{}, pgx.ErrNoRows
	}
	return rx, nil
}

func (m *MockPrescriptionRepository) GetByIDAndUserID(ctx context.Context, id int64, userID uuid.UUID) (sqlc.Prescription, error) {
	rx, ok := m.prescriptions[id]
	if !ok || rx.UserID != userID {
		return sqlc.Prescription{}, pgx.ErrNoRows
	}
	return rx, nil
}

func (m *MockPrescriptionRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Prescription, error) {
	var list []sqlc.Prescription
	for _, rx := range m.prescriptions {
		if rx.UserID == userID {
			list = append(list, rx)
		}
	}
	return list, nil
}

func (m *MockPrescriptionRepository) ListAll(ctx context.Context) ([]sqlc.Prescription, error) {
	var list []sqlc.Prescription
	for _, rx := range m.prescriptions {
		list = append(list, rx)
	}
	return list, nil
}

func (m *MockPrescriptionRepository) UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Prescription, error) {
	rx, ok := m.prescriptions[id]
	if !ok {
		return sqlc.Prescription{}, pgx.ErrNoRows
	}
	rx.Status = status
	rx.UpdatedAt = time.Now()
	m.prescriptions[id] = rx
	return rx, nil
}

func (m *MockPrescriptionRepository) ListByOrderID(ctx context.Context, orderID int64) ([]sqlc.Prescription, error) {
	var list []sqlc.Prescription
	for _, rx := range m.prescriptions {
		if rx.OrderID == orderID {
			list = append(list, rx)
		}
	}
	return list, nil
}

func (m *MockPrescriptionRepository) AdminListAllPrescriptions(ctx context.Context) ([]sqlc.AdminListAllPrescriptionsRow, error) {
	var list []sqlc.AdminListAllPrescriptionsRow
	for _, rx := range m.prescriptions {
		list = append(list, sqlc.AdminListAllPrescriptionsRow{
			ID:               rx.ID,
			OrderID:          rx.OrderID,
			UserID:           rx.UserID,
			PrescriptionType: rx.PrescriptionType,
			FileUrl:          rx.FileUrl,
			ObjectKey:        rx.ObjectKey,
			Notes:            rx.Notes,
			Status:           rx.Status,
			CreatedAt:        rx.CreatedAt,
			UpdatedAt:        rx.UpdatedAt,
		})
	}
	return list, nil
}

func (m *MockPrescriptionRepository) AdminGetPrescriptionByID(ctx context.Context, id int64) (sqlc.AdminGetPrescriptionByIDRow, error) {
	rx, ok := m.prescriptions[id]
	if !ok {
		return sqlc.AdminGetPrescriptionByIDRow{}, pgx.ErrNoRows
	}
	return sqlc.AdminGetPrescriptionByIDRow{
		ID:               rx.ID,
		OrderID:          rx.OrderID,
		UserID:           rx.UserID,
		PrescriptionType: rx.PrescriptionType,
		FileUrl:          rx.FileUrl,
		ObjectKey:        rx.ObjectKey,
		Notes:            rx.Notes,
		Status:           rx.Status,
		CreatedAt:        rx.CreatedAt,
		UpdatedAt:        rx.UpdatedAt,
	}, nil
}

// -- INTEGRATION TESTS FLOW --

func TestCartAndOrdersFlow(t *testing.T) {
	// 1. Initialized shared Fiber application instance
	app := fiber.New()

	// 2. Setup mock dependencies
	catRepo := NewMockCategoryRepository()
	prodRepo := NewMockProductRepository(catRepo)
	cartRepo := NewMockCartRepository(prodRepo)
	orderRepo := NewMockOrderRepository(prodRepo, cartRepo)

	// Create test Category and Products
	ctx := context.Background()
	cat, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Glass Collection",
		Slug: "glass-collection",
	})

	productPrice := 150.0
	productSalePrice := 125.0
	prodActive := "active"
	prodStock := int32(5)
	p1, _ := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID: &cat.ID,
		Name:       "Classic Wayfarer Black",
		Slug:       "classic-wayfarer-black",
		Price:      productPrice,
		SalePrice:  &productSalePrice,
		Brand:      "Rayban",
		Stock:      prodStock,
		Status:     prodActive,
	})

	prodStock2 := int32(2)
	p2, _ := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID: &cat.ID,
		Name:       "Clubmaster Tortoise",
		Slug:       "clubmaster-tortoise",
		Price:      110.0,
		Brand:      "Rayban",
		Stock:      prodStock2,
		Status:     prodActive,
	})

	// Setup Services & Handlers
	rxRepo := NewMockPrescriptionRepository()
	cartSvc := service.NewCartService(cartRepo, prodRepo)
	orderSvc := service.NewOrderService(orderRepo, cartRepo, prodRepo, rxRepo)

	cartHandler := v1.NewCartHandler(cartSvc)
	orderHandler := v1.NewOrderHandler(orderSvc)

	// Stub customer identity mock middleware
	customerUID := uuid.New().String()
	adminUID := uuid.New().String()

	customerAuth := func(c fiber.Ctx) error {
		c.Locals("user_id", customerUID)
		c.Locals("role", "customer")
		return c.Next()
	}

	adminAuth := func(c fiber.Ctx) error {
		c.Locals("user_id", adminUID)
		c.Locals("role", "admin")
		return c.Next()
	}

	// Mount protected routes using Group middleware (Fiber v3 compatible)
	customerGroup := app.Group("/api/v1", customerAuth)
	customerGroup.Get("/cart", cartHandler.GetCart)
	customerGroup.Post("/cart/items", cartHandler.AddCartItem)
	customerGroup.Put("/cart/items/:id", cartHandler.UpdateCartItem)
	customerGroup.Delete("/cart/items/:id", cartHandler.DeleteCartItem)

	customerGroup.Post("/orders", orderHandler.CreateOrder)
	customerGroup.Get("/orders", orderHandler.GetOrders)
	customerGroup.Get("/orders/:id", orderHandler.GetOrderDetails)

	adminGroup := app.Group("/api/v1/admin", adminAuth)
	adminGroup.Get("/orders", orderHandler.AdminListOrders)
	adminGroup.Get("/orders/:id", orderHandler.AdminGetOrderDetails)
	adminGroup.Put("/orders/:id/status", orderHandler.AdminUpdateOrderStatus)

	// Shared testing states
	var createdCartItemID int64
	var createdOrderID int64

	// --- 1. CART TESTS ---

	t.Run("Get cart automatically creates an empty cart if not existing", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/cart", nil)
		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK retrieving empty cart, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                 `json:"success"`
			Data    service.CartResponse `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if len(res.Data.Items) != 0 || res.Data.TotalAmount != 0.0 {
			t.Error("Non-existing cart should be initialized empty and clear")
		}
	})

	t.Run("Add item to cart is successful and validates stock limits", func(t *testing.T) {
		payload := map[string]interface{}{
			"product_id": p1.ID,
			"quantity":   2,
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/cart/items", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK adding item to cart, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                 `json:"success"`
			Data    service.CartResponse `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if len(res.Data.Items) != 1 || res.Data.Items[0].Quantity != 2 {
			t.Error("Item quantity was not added correctly to cart response payload")
		}

		createdCartItemID = res.Data.Items[0].ID
	})

	t.Run("Add out-of-stock quantity to cart yields bad request error", func(t *testing.T) {
		payload := map[string]interface{}{
			"product_id": p2.ID,
			"quantity":   100, // exceeds available stock
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/cart/items", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request on out-of-stock items, got: %d", resp.StatusCode)
		}
	})

	t.Run("Update cart item quantity validates stock correctly", func(t *testing.T) {
		// Try to update to 10 (exceeds stock of 5)
		payload := map[string]interface{}{
			"quantity": 10,
		}
		jsonVal, _ := json.Marshal(payload)
		reqPath := fmt.Sprintf("/api/v1/cart/items/%d", createdCartItemID)
		req, _ := http.NewRequest(http.MethodPut, reqPath, bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request when setting quantity above stock limit, got: %d", resp.StatusCode)
		}
	})

	t.Run("Update cart item quantity is successful", func(t *testing.T) {
		payload := map[string]interface{}{
			"quantity": 3,
		}
		jsonVal, _ := json.Marshal(payload)
		reqPath := fmt.Sprintf("/api/v1/cart/items/%d", createdCartItemID)
		req, _ := http.NewRequest(http.MethodPut, reqPath, bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK updating item quantity, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                 `json:"success"`
			Data    service.CartResponse `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if res.Data.Items[0].Quantity != 3 {
			t.Error("Item quantity update did not write correctly to database layer")
		}
	})

	// --- 2. ORDER PLACEMENT AND TRANSACTION TESTS ---

	t.Run("Place order executes and empties the cart atomically", func(t *testing.T) {
		payload := map[string]interface{}{
			"shipping_address": "123 Eyewear Boulevard, Frametown",
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 210 status on checkout, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                  `json:"success"`
			Data    service.OrderResponse `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if res.Data.Status != "PENDING" || res.Data.ShippingAddress != "123 Eyewear Boulevard, Frametown" {
			t.Error("Order status or transport address not mapped correctly in payload")
		}

		if len(res.Data.Items) != 1 || res.Data.Items[0].ProductID != p1.ID {
			t.Error("Order details mismatch: item snapshots missing")
		}

		createdOrderID = res.Data.ID

		// Verify that stock is decremented in product repo from 5 to 2!
		p1Updated, _ := prodRepo.GetByID(ctx, p1.ID)
		if p1Updated.Stock != 2 {
			t.Errorf("Atomicity error: Expected product stock to decrement to 2, got: %d", p1Updated.Stock)
		}

		// Verify that the cart is now empty!
		cart, _ := cartRepo.GetByUserID(ctx, uuid.MustParse(customerUID))
		cartItems, _ := cartRepo.ListItemsDetailed(ctx, cart.ID)
		if len(cartItems) != 0 {
			t.Error("Cart was not emptied following successful checkout transaction loop")
		}
	})

	t.Run("Placing order fails with empty cart error", func(t *testing.T) {
		payload := map[string]interface{}{
			"shipping_address": "456 Frameless Road",
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request checking empty cart, got: %d", resp.StatusCode)
		}
	})

	// --- 3. RETRIEVAL AND ADMIN SERVICES ---

	t.Run("Customer lists single order details matching authentication boundary", func(t *testing.T) {
		reqPath := fmt.Sprintf("/api/v1/orders/%d", createdOrderID)
		req, _ := http.NewRequest(http.MethodGet, reqPath, nil)

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK retrieving single order detail card, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                  `json:"success"`
			Data    service.OrderResponse `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if res.Data.ID != createdOrderID || res.Data.Items[0].ProductSnapshot == nil {
			t.Error("Snapshot metadata absent from detailed order item rows")
		}
	})

	t.Run("Admin details can access and update order statuses cleanly", func(t *testing.T) {
		payload := map[string]interface{}{
			"status": "SHIPPED",
		}
		jsonVal, _ := json.Marshal(payload)
		reqPath := fmt.Sprintf("/api/v1/admin/orders/%d/status", createdOrderID)
		req, _ := http.NewRequest(http.MethodPut, reqPath, bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK after admin update, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                  `json:"success"`
			Data    service.OrderResponse `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if res.Data.Status != "SHIPPED" {
			t.Error("Admin state update failed to elevate Order status values")
		}
	})
}
