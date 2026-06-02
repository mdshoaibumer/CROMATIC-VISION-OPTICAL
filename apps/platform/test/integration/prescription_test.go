package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"testing"
	"time"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/storage"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

func helperMultipartRequest(fields map[string]string, fileFieldName, fileName string, fileData []byte) (*bytes.Buffer, string, error) {
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	for key, val := range fields {
		_ = writer.WriteField(key, val)
	}

	part, err := writer.CreateFormFile(fileFieldName, fileName)
	if err != nil {
		return nil, "", err
	}
	_, _ = part.Write(fileData)
	_ = writer.Close()

	return body, writer.FormDataContentType(), nil
}

func TestPrescriptionsIntegration(t *testing.T) {
	app := fiber.New()

	catRepo := NewMockCategoryRepository()
	prodRepo := NewMockProductRepository(catRepo)
	cartRepo := NewMockCartRepository(prodRepo)
	orderRepo := NewMockOrderRepository(prodRepo, cartRepo)
	rxRepo := NewMockPrescriptionRepository()
	mockStorage := storage.NewMockStorage("")

	orderSvc := service.NewOrderService(orderRepo, cartRepo, prodRepo, rxRepo)
	rxSvc := service.NewPrescriptionService(rxRepo, orderRepo, mockStorage)

	orderHandler := v1.NewOrderHandler(orderSvc)
	rxHandler := v1.NewPrescriptionHandler(rxSvc)

	user1 := uuid.New().String()
	user2 := uuid.New().String()

	user1CustomerAuth := func(c fiber.Ctx) error {
		c.Locals("user_id", user1)
		c.Locals("role", "customer")
		return c.Next()
	}

	user2CustomerAuth := func(c fiber.Ctx) error {
		c.Locals("user_id", user2)
		c.Locals("role", "customer")
		return c.Next()
	}

	adminAuth := func(c fiber.Ctx) error {
		c.Locals("user_id", "admin_user")
		c.Locals("role", "admin")
		return c.Next()
	}

	// Mount endpoints using Group middleware (Fiber v3 compatible)
	u1Group := app.Group("/api/v1/prescriptions", user1CustomerAuth)
	u1Group.Post("/", rxHandler.UploadPrescription)
	u1Group.Get("/:id", rxHandler.GetPrescription)
	u1Group.Get("/", rxHandler.ListPrescriptions)

	// User2 client endpoints
	u2Group := app.Group("/api/v1/user2/prescriptions", user2CustomerAuth)
	u2Group.Get("/:id", rxHandler.GetPrescription)

	// Admin endpoints
	adminGroup := app.Group("/api/v1/admin", adminAuth)
	adminGroup.Get("/prescriptions", rxHandler.AdminListPrescriptions)
	adminGroup.Get("/prescriptions/:id", rxHandler.AdminGetPrescription)
	adminGroup.Put("/prescriptions/:id/status", rxHandler.AdminUpdateStatus)
	adminGroup.Put("/orders/:id/status", orderHandler.AdminUpdateOrderStatus)

	// Create test products
	ctx := context.Background()

	catFrames, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Frames Collection",
		Slug: "frames-collection",
	})

	catLens, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Prescription Lens",
		Slug: "prescription-lenses",
	})

	frameProd, _ := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID: &catFrames.ID,
		Name:       "Simple Frame Metal Blue",
		Slug:       "simple-frame-blue",
		Price:      100.0,
		Stock:      10,
		Status:     "active",
	})

	lensProd, _ := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID: &catLens.ID,
		Name:       "Anti-Reflective Optical Lens",
		Slug:       "anti-reflective-optical-lens",
		Price:      50.0,
		Stock:      5,
		Status:     "active",
	})

	// Setup orders:
	// Order #1: user1, frameProd only (Frame-only order)
	// Order #2: user1, frameProd + lensProd (Prescription lens order)
	u1Parsed, _ := uuid.Parse(user1)

	order1, _, _ := orderRepo.CreateOrderWithTx(ctx, u1Parsed, 100.0, "TRK-001", "123 Specs Road", []repository.OrderItemTxParam{
		{
			ProductID: frameProd.ID,
			Quantity:  1,
			Price:     100.0,
		},
	})

	order2, _, _ := orderRepo.CreateOrderWithTx(ctx, u1Parsed, 150.0, "TRK-002", "123 Specs Road", []repository.OrderItemTxParam{
		{
			ProductID: frameProd.ID,
			Quantity:  1,
			Price:     100.0,
		},
		{
			ProductID: lensProd.ID,
			Quantity:  1,
			Price:     50.0,
		},
	})

	var createdRxID int64

	t.Run("Frame-only order transition to processing doesn't require prescription", func(t *testing.T) {
		payload := map[string]interface{}{"status": "PROCESSING"}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/admin/orders/%d/status", order1.ID), bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK for frame-only order processing status transition, got: %d", resp.StatusCode)
		}
	})

	t.Run("Prescription lens order transition to processing fails if no prescription updated", func(t *testing.T) {
		payload := map[string]interface{}{"status": "PROCESSING"}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/admin/orders/%d/status", order2.ID), bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request if trying to process lens order without prescription, got: %d", resp.StatusCode)
		}
	})

	t.Run("Upload prescription with invalid type is rejected", func(t *testing.T) {
		fields := map[string]string{
			"order_id":          fmt.Sprintf("%d", order2.ID),
			"prescription_type": "optical",
		}
		body, boundary, _ := helperMultipartRequest(fields, "file", "rx.txt", []byte("invalid prescription file contents"))
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/prescriptions", body)
		req.Header.Set("Content-Type", boundary)

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Fatalf("Expected 400 Bad Request on uploading txt file, got: %d", resp.StatusCode)
		}
	})

	t.Run("Upload prescription with correct parameters is stored successfully", func(t *testing.T) {
		fields := map[string]string{
			"order_id":          fmt.Sprintf("%d", order2.ID),
			"prescription_type": "optical",
			"notes":             "Left: -1.25, Right: -1.00",
		}
		body, boundary, _ := helperMultipartRequest(fields, "file", "prescription.pdf", []byte("%PDF-1.4 dummy pdf specs"))
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/prescriptions", body)
		req.Header.Set("Content-Type", boundary)

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			bodyBytes, _ := io.ReadAll(resp.Body)
			t.Fatalf("Expected 201 Created on valid upload, got: %d, body: %s", resp.StatusCode, string(bodyBytes))
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                         `json:"success"`
			Data    service.PrescriptionResponse `json:"data"`
		}
		_ = json.Unmarshal(bodyBytes, &res)

		if res.Data.OrderID != order2.ID || res.Data.Status != "UPLOADED" {
			t.Error("Returned prescription schema values did not match up")
		}

		createdRxID = res.Data.ID
	})

	t.Run("Retrieve uploaded prescription details by authorized customer is successful", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/prescriptions/%d", createdRxID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK retrieving own prescription, got: %d", resp.StatusCode)
		}
	})

	t.Run("Retrieve uploaded prescription of another customer yields not found / unauthorized", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/user2/prescriptions/%d", createdRxID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusNotFound {
			t.Fatalf("Expected 404 Not Found (or 403) accessing different customer prescription, got: %d", resp.StatusCode)
		}
	})

	t.Run("Admin can retrieve specific prescription and view full list", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("/api/v1/admin/prescriptions/%d", createdRxID), nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK for admin reading prescription, got: %d", resp.StatusCode)
		}

		reqList, _ := http.NewRequest(http.MethodGet, "/api/v1/admin/prescriptions", nil)
		respList, _ := app.Test(reqList, 1*time.Second)
		defer respList.Body.Close()

		if respList.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK listing prescriptions for admin, got: %d", respList.StatusCode)
		}
	})

	t.Run("Admin can update prescription status and move state forward", func(t *testing.T) {
		payload := map[string]interface{}{"status": "APPROVED"}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/admin/prescriptions/%d/status", createdRxID), bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK for status updates, got: %d", resp.StatusCode)
		}

		bodyBytes, _ := io.ReadAll(resp.Body)
		var res struct {
			Data service.PrescriptionResponse `json:"data"`
		}
		_ = json.Unmarshal(bodyBytes, &res)

		if res.Data.Status != "APPROVED" {
			t.Errorf("Expected status change to APPROVED, got: %s", res.Data.Status)
		}
	})

	t.Run("Prescription lens order transition to processing is now allowed once prescription is uploaded", func(t *testing.T) {
		payload := map[string]interface{}{"status": "PROCESSING"}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPut, fmt.Sprintf("/api/v1/admin/orders/%d/status", order2.ID), bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK on transition of lens order with uploaded approved prescription, got: %d", resp.StatusCode)
		}
	})
}
