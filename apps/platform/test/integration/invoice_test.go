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
	"github.com/cromatic-vision-optical/backend/internal/config"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/storage"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

type MockUserRepository struct {
	users map[uuid.UUID]sqlc.User
}

func NewMockUserRepository() *MockUserRepository {
	return &MockUserRepository{
		users: make(map[uuid.UUID]sqlc.User),
	}
}

func (m *MockUserRepository) GetByID(ctx context.Context, id uuid.UUID) (sqlc.User, error) {
	u, ok := m.users[id]
	if !ok {
		return sqlc.User{}, fmt.Errorf("user not found")
	}
	return u, nil
}

func (m *MockUserRepository) CreateMockUser(id uuid.UUID, name, email string) sqlc.User {
	u := sqlc.User{
		ID:        id,
		Name:      name,
		Email:     email,
		Role:      "customer",
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.users[id] = u
	return u
}

type MockInvoiceRepository struct {
	invoices  map[int64]sqlc.Invoice
	nextID    int64
	orderRepo repository.OrderRepository
}

func NewMockInvoiceRepository(orderRepo repository.OrderRepository) *MockInvoiceRepository {
	return &MockInvoiceRepository{
		invoices:  make(map[int64]sqlc.Invoice),
		orderRepo: orderRepo,
	}
}

func (m *MockInvoiceRepository) Create(ctx context.Context, arg sqlc.CreateInvoiceParams) (sqlc.Invoice, error) {
	m.nextID++
	inv := sqlc.Invoice{
		ID:            m.nextID,
		OrderID:       arg.OrderID,
		InvoiceNumber: arg.InvoiceNumber,
		InvoiceUrl:    arg.InvoiceUrl,
		Status:        arg.Status,
		CreatedAt:     time.Now(),
	}
	m.invoices[inv.ID] = inv
	return inv, nil
}

func (m *MockInvoiceRepository) GetByID(ctx context.Context, id int64) (sqlc.Invoice, error) {
	inv, ok := m.invoices[id]
	if !ok {
		return sqlc.Invoice{}, fmt.Errorf("invoice not found")
	}
	return inv, nil
}

func (m *MockInvoiceRepository) GetByIDAndUserID(ctx context.Context, id int64, userID uuid.UUID) (sqlc.Invoice, error) {
	inv, ok := m.invoices[id]
	if !ok {
		return sqlc.Invoice{}, fmt.Errorf("invoice not found")
	}
	o, err := m.orderRepo.GetByID(ctx, inv.OrderID)
	if err != nil || o.UserID != userID {
		return sqlc.Invoice{}, fmt.Errorf("invoice not found or access denied")
	}
	return inv, nil
}

func (m *MockInvoiceRepository) GetByOrderID(ctx context.Context, orderID int64) (sqlc.Invoice, error) {
	for _, inv := range m.invoices {
		if inv.OrderID == orderID {
			return inv, nil
		}
	}
	return sqlc.Invoice{}, fmt.Errorf("invoice not found")
}

func (m *MockInvoiceRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]sqlc.Invoice, error) {
	var list []sqlc.Invoice
	for _, inv := range m.invoices {
		o, err := m.orderRepo.GetByID(ctx, inv.OrderID)
		if err == nil && o.UserID == userID {
			list = append(list, inv)
		}
	}
	return list, nil
}

func (m *MockInvoiceRepository) ListAll(ctx context.Context) ([]sqlc.Invoice, error) {
	var list []sqlc.Invoice
	for _, inv := range m.invoices {
		list = append(list, inv)
	}
	return list, nil
}

func (m *MockInvoiceRepository) UpdateStatus(ctx context.Context, id int64, status string) (sqlc.Invoice, error) {
	inv, ok := m.invoices[id]
	if !ok {
		return sqlc.Invoice{}, fmt.Errorf("invoice not found")
	}
	inv.Status = status
	m.invoices[id] = inv
	return inv, nil
}

func TestInvoiceIntegrationFlow(t *testing.T) {
	app := fiber.New()

	catRepo := NewMockCategoryRepository()
	prodRepo := NewMockProductRepository(catRepo)
	cartRepo := NewMockCartRepository(prodRepo)
	orderRepo := NewMockOrderRepository(prodRepo, cartRepo)
	payRepo := NewMockPaymentRepository(orderRepo)
	invoiceRepo := NewMockInvoiceRepository(orderRepo)
	userRepo := NewMockUserRepository()

	// Seed configs
	cfg := &config.Config{
		AdminEmail: "admin@cromaticvision.com",
	}

	storageSvc := storage.NewMockStorage("")
	notifySvc := service.NewNotificationService(cfg)
	invoiceSvc := service.NewInvoiceService(invoiceRepo, orderRepo, userRepo, storageSvc, notifySvc)

	paySvc := service.NewPaymentService(payRepo, orderRepo, cfg)
	paySvc.SetOnPaymentCaptured(func(ctx context.Context, orderID int64) error {
		_, err := invoiceSvc.GenerateInvoice(ctx, orderID)
		return err
	})

	invoiceHandler := v1.NewInvoiceHandler(invoiceSvc)

	// Auth and middleware helpers
	user1 := uuid.New()
	user2 := uuid.New()

	userRepo.CreateMockUser(user1, "John Shoaib", "md.shoaibumer@gmail.com")
	userRepo.CreateMockUser(user2, "Unauthorized User", "unauthorized@cromaticvision.com")

	user1Auth := func(c fiber.Ctx) error {
		c.Locals("user_id", user1.String())
		return c.Next()
	}

	user2Auth := func(c fiber.Ctx) error {
		c.Locals("user_id", user2.String())
		return c.Next()
	}

	// Register API endpoints using Group middleware (Fiber v3 compatible)
	u1Group := app.Group("/api/v1/invoices", user1Auth)
	u1Group.Get("/", invoiceHandler.ListInvoices)
	u1Group.Get("/:id", invoiceHandler.GetInvoice)
	u1Group.Get("/:id/download", invoiceHandler.DownloadInvoice)

	// User 2 context endpoint
	u2Group := app.Group("/api/v1/user2/invoices", user2Auth)
	u2Group.Get("/:id", invoiceHandler.GetInvoice)
	u2Group.Get("/:id/download", invoiceHandler.DownloadInvoice)

	// Admin routes
	app.Get("/api/v1/admin/invoices", invoiceHandler.AdminListInvoices)
	app.Get("/api/v1/admin/invoices/:id/download", invoiceHandler.AdminDownloadInvoice)

	// Setup mock catalog items
	ctx := context.Background()
	cat, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Stylish Sunnies",
		Slug: "stylish-sunnies",
	})
	prod, _ := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID: &cat.ID,
		Name:       "Summer Classic Wayfarer Dark Brown",
		Slug:       "wayfarer-dark-brown",
		Price:      120.0,
		Stock:      15,
		Status:     "active",
	})

	// Create a placed order and payment record
	order1, _, _ := orderRepo.CreateOrderWithTx(ctx, user1, 120.0, "TRK-INV-001", "123 Silicon Alley", []repository.OrderItemTxParam{
		{
			ProductID: prod.ID,
			Quantity:  1,
			Price:     120.0,
		},
	})

	var createdInvoiceID int64
	var generatedInvoiceNumber string

	t.Run("Automatically generate invoice upon successful payment capture on VerifyRazorpaySignature", func(t *testing.T) {
		// Mock payment intent
		payAttempt, _ := payRepo.Create(ctx, sqlc.CreatePaymentParams{
			OrderID:         order1.ID,
			UserID:          order1.UserID,
			Provider:        "RAZORPAY",
			ProviderOrderID: "order_mock_test_inv_01",
			Amount:          120.0,
			Status:          "PENDING",
		})

		verifyReq := service.VerifySignatureRequest{
			RazorpayOrderID:   payAttempt.ProviderOrderID,
			RazorpayPaymentID: "pay_captured_val_01",
			RazorpaySignature: "mock_signature_for_test",
		}

		// Perform Verification
		_, err := paySvc.VerifyRazorpaySignature(ctx, verifyReq)
		if err != nil {
			t.Fatalf("Expected Razorpay signature verification to pass, got: %v", err)
		}

		// Check companion order record is PAID
		updatedOrder, err := orderRepo.GetByID(ctx, order1.ID)
		if err != nil || updatedOrder.Status != "PAID" {
			t.Fatalf("Expected Order updated status to be PAID, got: %v", err)
		}

		// Assert invoice was automatically generated and seeded in repositories
		inv, err := invoiceRepo.GetByOrderID(ctx, order1.ID)
		if err != nil {
			t.Fatalf("Expected automatic invoice record to be saved for Paid Order, got %v", err)
		}

		if inv.Status != "PAID" || inv.InvoiceNumber == "" || inv.InvoiceUrl == "" {
			t.Errorf("Invoice fields inconsistent. status: %s, invoice_number: %s", inv.Status, inv.InvoiceNumber)
		}

		createdInvoiceID = inv.ID
		generatedInvoiceNumber = inv.InvoiceNumber

		// Direct Storage mock persistence assertion
		objectKey := fmt.Sprintf("invoices/%s.pdf", inv.InvoiceNumber)
		storedBytes, err := storageSvc.Retrieve(ctx, objectKey)
		if err != nil || len(storedBytes) == 0 {
			t.Errorf("Expected uploaded PDF file presence under objectKey: %s, got: %v", objectKey, err)
		}
	})

	t.Run("Retrieve customer's invoices list successfully", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/invoices", nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected status 200, got: %d", resp.StatusCode)
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                      `json:"success"`
			Data    []service.InvoiceResponse `json:"data"`
		}
		_ = json.Unmarshal(bodyBytes, &res)

		if len(res.Data) != 1 || res.Data[0].ID != createdInvoiceID {
			t.Errorf("Expected 1 invoice with ID %d, got %+v", createdInvoiceID, res.Data)
		}
	})

	t.Run("Retrieve individual invoice details belonging to customer", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/invoices/%d", createdInvoiceID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected status 200, got: %d", resp.StatusCode)
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                    `json:"success"`
			Data    service.InvoiceResponse `json:"data"`
		}
		_ = json.Unmarshal(bodyBytes, &res)

		if res.Data.InvoiceNumber != generatedInvoiceNumber {
			t.Errorf("Expected Invoice details mismatch. got number: %s", res.Data.InvoiceNumber)
		}
	})

	t.Run("Prevent unauthorized customer profiles from viewing cross-account billing invoice details", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/user2/invoices/%d", createdInvoiceID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("Expected 404 Not Found to prevent leaking presence of cross-account details, got %d", resp.StatusCode)
		}
	})

	t.Run("Download valid PDF invoice file successfully", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/invoices/%d/download", createdInvoiceID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected Status 200 OK downloading, got %d", resp.StatusCode)
		}

		contentType := resp.Header.Get("Content-Type")
		if contentType != "application/pdf" {
			t.Errorf("Expected content type 'application/pdf', got: '%s'", contentType)
		}

		contentDisp := resp.Header.Get("Content-Disposition")
		expectedDisp := fmt.Sprintf("attachment; filename=\"%s.pdf\"", generatedInvoiceNumber)
		if contentDisp != expectedDisp {
			t.Errorf("Expected content disposition: '%s', got: '%s'", expectedDisp, contentDisp)
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		if len(bodyBytes) == 0 {
			t.Error("Expected actual binary byte contents in payload response body, got zero length")
		}

		// Confirm bytes represent valid PDF-1.4 file header signatures
		if !bytes.HasPrefix(bodyBytes, []byte("%PDF-1.4")) {
			t.Errorf("Downloaded payload signature is not a valid PDF header format: %s", string(bodyBytes[:10]))
		}
	})

	t.Run("Prevent cross-account customer accounts from downloading PDF receipts", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/user2/invoices/%d/download", createdInvoiceID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusNotFound {
			t.Errorf("Expected status 404 for unauthorized downloads, got %d", resp.StatusCode)
		}
	})

	t.Run("Admin view list fetches all logged invoices successfully", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/admin/invoices", nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected admin endpoint to return 200, got: %d", resp.StatusCode)
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                      `json:"success"`
			Data    []service.InvoiceResponse `json:"data"`
		}
		_ = json.Unmarshal(bodyBytes, &res)

		if len(res.Data) != 1 || res.Data[0].OrderID != order1.ID {
			t.Errorf("Admin list mismatch: compiled list counts to: %d", len(res.Data))
		}
	})

	t.Run("Admin downloading any invoice record succeeded with general file access", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/admin/invoices/%d/download", createdInvoiceID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected admin invoice downloads to succeed, got %d", resp.StatusCode)
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		if !bytes.HasPrefix(bodyBytes, []byte("%PDF-1.4")) {
			t.Errorf("Expected a valid PDF file output header from admin, got: %s", string(bodyBytes[:10]))
		}
	})
}
