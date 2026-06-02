package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"testing"
	"time"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/config"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type MockPaymentRepository struct {
	payments  map[int64]sqlc.Payment
	nextID    int64
	orderRepo repository.OrderRepository
}

func NewMockPaymentRepository(orderRepo repository.OrderRepository) *MockPaymentRepository {
	return &MockPaymentRepository{
		payments:  make(map[int64]sqlc.Payment),
		orderRepo: orderRepo,
	}
}

func (m *MockPaymentRepository) Create(ctx context.Context, arg sqlc.CreatePaymentParams) (sqlc.Payment, error) {
	m.nextID++
	pay := sqlc.Payment{
		ID:                m.nextID,
		OrderID:           arg.OrderID,
		UserID:            arg.UserID,
		Provider:          arg.Provider,
		ProviderOrderID:   arg.ProviderOrderID,
		ProviderPaymentID: arg.ProviderPaymentID,
		Amount:            arg.Amount,
		Status:            arg.Status,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}
	m.payments[pay.ID] = pay
	return pay, nil
}

func (m *MockPaymentRepository) GetByID(ctx context.Context, id int64) (sqlc.Payment, error) {
	pay, ok := m.payments[id]
	if !ok {
		return sqlc.Payment{}, pgx.ErrNoRows
	}
	return pay, nil
}

func (m *MockPaymentRepository) GetByProviderOrderID(ctx context.Context, providerOrderID string) (sqlc.Payment, error) {
	for _, pay := range m.payments {
		if pay.ProviderOrderID == providerOrderID {
			return pay, nil
		}
	}
	return sqlc.Payment{}, pgx.ErrNoRows
}

func (m *MockPaymentRepository) GetByProviderPaymentID(ctx context.Context, providerPaymentID *string) (sqlc.Payment, error) {
	if providerPaymentID == nil {
		return sqlc.Payment{}, pgx.ErrNoRows
	}
	for _, pay := range m.payments {
		if pay.ProviderPaymentID != nil && *pay.ProviderPaymentID == *providerPaymentID {
			return pay, nil
		}
	}
	return sqlc.Payment{}, pgx.ErrNoRows
}

func (m *MockPaymentRepository) UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Payment, error) {
	pay, ok := m.payments[id]
	if !ok {
		return sqlc.Payment{}, pgx.ErrNoRows
	}
	pay.Status = status
	pay.UpdatedAt = time.Now()
	m.payments[id] = pay
	return pay, nil
}

func (m *MockPaymentRepository) UpdateStatusAndPaymentID(ctx context.Context, id int64, status string, providerPaymentID *string) (sqlc.Payment, error) {
	pay, ok := m.payments[id]
	if !ok {
		return sqlc.Payment{}, pgx.ErrNoRows
	}
	pay.Status = status
	pay.ProviderPaymentID = providerPaymentID
	pay.UpdatedAt = time.Now()
	m.payments[id] = pay
	return pay, nil
}

func (m *MockPaymentRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Payment, error) {
	var list []sqlc.Payment
	for _, pay := range m.payments {
		if pay.UserID == userID {
			list = append(list, pay)
		}
	}
	return list, nil
}

func (m *MockPaymentRepository) ProcessPaymentCapture(ctx context.Context, providerOrderID string, providerPaymentID string) (sqlc.Payment, error) {
	var targetPay sqlc.Payment
	var found bool
	for _, pay := range m.payments {
		if pay.ProviderOrderID == providerOrderID {
			targetPay = pay
			found = true
			break
		}
	}

	if !found {
		return sqlc.Payment{}, pgx.ErrNoRows
	}

	if targetPay.Status == "CAPTURED" {
		return targetPay, nil // Idempotent check returning early!
	}

	targetPay.Status = "CAPTURED"
	targetPay.ProviderPaymentID = &providerPaymentID
	targetPay.UpdatedAt = time.Now()
	m.payments[targetPay.ID] = targetPay

	if m.orderRepo != nil {
		_, _ = m.orderRepo.UpdateStatus(ctx, targetPay.OrderID, "PAID")
	}

	return targetPay, nil
}

func TestPaymentsIntegration(t *testing.T) {
	app := fiber.New()

	catRepo := NewMockCategoryRepository()
	prodRepo := NewMockProductRepository(catRepo)
	cartRepo := NewMockCartRepository(prodRepo)
	orderRepo := NewMockOrderRepository(prodRepo, cartRepo)
	payRepo := NewMockPaymentRepository(orderRepo)

	cfg := &config.Config{
		RazorpayKeyID:         "rzp_test_mockkeyid123",
		RazorpayKeySecret:     "mockkeysecret456",
		RazorpayWebhookSecret: "mockwebhooksecret789",
	}

	paySvc := service.NewPaymentService(payRepo, orderRepo, cfg)
	payHandler := v1.NewPaymentHandler(paySvc)

	user1 := uuid.New().String()
	user2 := uuid.New().String()

	user1Auth := func(c fiber.Ctx) error {
		c.Locals("user_id", user1)
		return c.Next()
	}

	user2Auth := func(c fiber.Ctx) error {
		c.Locals("user_id", user2)
		return c.Next()
	}

	// Route bindings using Group middleware (Fiber v3 compatible)
	u1Group := app.Group("/api/v1/payments", user1Auth)
	u1Group.Post("/create-order", payHandler.CreateOrder)
	u1Group.Post("/verify", payHandler.VerifySignature)
	app.Post("/api/v1/webhooks/razorpay", payHandler.HandleWebhook)

	// User2 custom routed payments context for user mismatch testing
	u2Group := app.Group("/api/v1/user2/payments", user2Auth)
	u2Group.Post("/create-order", payHandler.CreateOrder)

	// Seed category and frames product to construct order
	ctx := context.Background()
	cat, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Elite Vintage Frames",
		Slug: "vintage-frames",
	})
	prod, _ := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID: &cat.ID,
		Name:       "Full Rim Aviator Classic Gold",
		Slug:       "aviator-classic-gold",
		Price:      180.0,
		Stock:      10,
		Status:     "active",
	})

	// Create test order #1 for User 1
	u1Parsed, _ := uuid.Parse(user1)
	order1, _, _ := orderRepo.CreateOrderWithTx(ctx, u1Parsed, 180.0, "TRK-PAY-001", "456 Silicon Street", []repository.OrderItemTxParam{
		{
			ProductID: prod.ID,
			Quantity:  1,
			Price:     180.0,
		},
	})

	var returnedProviderOrderID string

	t.Run("Create Razorpay checkout order successfully", func(t *testing.T) {
		payload := map[string]interface{}{"order_id": order1.ID}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/create-order", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			bodyBytes, _ := io.ReadAll(resp.Body)
			t.Fatalf("Expected 201 Created checkout, got: %d, body: %s", resp.StatusCode, string(bodyBytes))
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                    `json:"success"`
			Data    service.PaymentResponse `json:"data"`
		}
		_ = json.Unmarshal(bodyBytes, &res)

		if res.Data.OrderID != order1.ID || res.Data.Status != "PENDING" || res.Data.Amount != 180.0 {
			t.Errorf("checkout order data mismatch. status: %s, amount: %f", res.Data.Status, res.Data.Amount)
		}

		returnedProviderOrderID = res.Data.ProviderOrderID
	})

	t.Run("Create payment order rejects cross-account user mismatch", func(t *testing.T) {
		payload := map[string]interface{}{"order_id": order1.ID}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/user2/payments/create-order", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Fatalf("Expected 403 Forbidden on user mismatch, got %d", resp.StatusCode)
		}
	})

	t.Run("Verify payment signature succeeds with valid payload and moves Order status to PAID", func(t *testing.T) {
		payload := map[string]interface{}{
			"razorpay_order_id":   returnedProviderOrderID,
			"razorpay_payment_id": "pay_test_001",
			"razorpay_signature":  "mock_signature_for_test",
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/verify", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			bodyBytes, _ := io.ReadAll(resp.Body)
			t.Fatalf("Expected 200 OK for payment verification, got %d, body: %s", resp.StatusCode, string(bodyBytes))
		}

		// Check database status of payment
		payRecord, _ := payRepo.GetByProviderOrderID(ctx, returnedProviderOrderID)
		if payRecord.Status != "CAPTURED" || *payRecord.ProviderPaymentID != "pay_test_001" {
			t.Errorf("Expected payment status CAPTURED, got %s", payRecord.Status)
		}

		// Check companion order record status
		updatedOrder, _ := orderRepo.GetByID(ctx, order1.ID)
		if updatedOrder.Status != "PAID" {
			t.Errorf("Expected Order status to be updated to PAID, got: %s", updatedOrder.Status)
		}
	})

	t.Run("Create checkout order for already paid order is rejected", func(t *testing.T) {
		payload := map[string]interface{}{"order_id": order1.ID}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/create-order", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request if trying to pay paid order, got: %d", resp.StatusCode)
		}
	})

	t.Run("Payment verification endpoint processes idempotent duplicates gracefully", func(t *testing.T) {
		payload := map[string]interface{}{
			"razorpay_order_id":   returnedProviderOrderID,
			"razorpay_payment_id": "pay_test_001",
			"razorpay_signature":  "mock_signature_for_test",
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/payments/verify", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK on duplicate processing, got %d", resp.StatusCode)
		}
	})

	// Create test order #2 for User 1 to test Webhook channel
	order2, _, _ := orderRepo.CreateOrderWithTx(ctx, u1Parsed, 180.0, "TRK-PAY-002", "456 Silicon Street", []repository.OrderItemTxParam{
		{
			ProductID: prod.ID,
			Quantity:  1,
			Price:     180.0,
		},
	})

	// Generate payment record for order #2
	payRecord2, _ := payRepo.Create(ctx, sqlc.CreatePaymentParams{
		OrderID:         order2.ID,
		UserID:          order2.UserID,
		Provider:        "RAZORPAY",
		ProviderOrderID: "order_rzp_webhook_002",
		Amount:          180.0,
		Status:          "PENDING",
	})

	t.Run("Webhook endpoint processes payment.captured successfully and moves Order status to PAID", func(t *testing.T) {
		webhookPayload := map[string]interface{}{
			"event": "payment.captured",
			"payload": map[string]interface{}{
				"payment": map[string]interface{}{
					"entity": map[string]interface{}{
						"id":       "pay_webhook_done_22",
						"order_id": payRecord2.ProviderOrderID,
						"status":   "captured",
					},
				},
			},
		}
		jsonVal, _ := json.Marshal(webhookPayload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/webhooks/razorpay", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		// Send mock signature to pass signature validation
		req.Header.Set("X-Razorpay-Signature", "mock_webhook_signature_for_test")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			bodyStr, _ := io.ReadAll(resp.Body)
			t.Fatalf("Expected 200 OK for Webhook, got %d, body: %s", resp.StatusCode, string(bodyStr))
		}

		// Assert payment record gets updated to CAPTURED
		updatedPay, _ := payRepo.GetByProviderOrderID(ctx, payRecord2.ProviderOrderID)
		if updatedPay.Status != "CAPTURED" || *updatedPay.ProviderPaymentID != "pay_webhook_done_22" {
			t.Errorf("Expected payment Status CAPTURED, got: %s", updatedPay.Status)
		}

		// Assert order status gets updated to PAID
		updatedOrder2, _ := orderRepo.GetByID(ctx, order2.ID)
		if updatedOrder2.Status != "PAID" {
			t.Errorf("Expected companion Order to be updated to PAID, got: %s", updatedOrder2.Status)
		}
	})

	t.Run("Webhook processes idempotent duplicate event gracefully", func(t *testing.T) {
		webhookPayload := map[string]interface{}{
			"event": "payment.captured",
			"payload": map[string]interface{}{
				"payment": map[string]interface{}{
					"entity": map[string]interface{}{
						"id":       "pay_webhook_done_22",
						"order_id": payRecord2.ProviderOrderID,
						"status":   "captured",
					},
				},
			},
		}
		jsonVal, _ := json.Marshal(webhookPayload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/webhooks/razorpay", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-Razorpay-Signature", "mock_webhook_signature_for_test")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK on duplicate webhook event processing, got: %d", resp.StatusCode)
		}
	})
}
