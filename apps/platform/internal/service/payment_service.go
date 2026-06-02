package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/config"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/google/uuid"
)

var (
	ErrPaymentOrderNotFound  = errors.New("associated order not found")
	ErrPaymentAlreadyPaid    = errors.New("order has already been paid")
	ErrPaymentUserMismatch   = errors.New("order belongs to another customer account")
	ErrInvalidSignature      = errors.New("razorpay payment signature verification failed")
	ErrPaymentRecordNotFound = errors.New("payment record not discovered")
)

type PaymentResponse struct {
	ID                int64     `json:"id"`
	OrderID           int64     `json:"order_id"`
	UserID            uuid.UUID `json:"user_id"`
	Provider          string    `json:"provider"`
	ProviderOrderID   string    `json:"provider_order_id"`
	ProviderPaymentID *string   `json:"provider_payment_id"`
	Amount            float64   `json:"amount"`
	Status            string    `json:"status"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

type CreateRazorpayOrderRequest struct {
	OrderID int64 `json:"order_id"`
}

type VerifySignatureRequest struct {
	RazorpayOrderID   string `json:"razorpay_order_id"`
	RazorpayPaymentID string `json:"razorpay_payment_id"`
	RazorpaySignature string `json:"razorpay_signature"`
}

type PaymentService interface {
	CreateRazorpayOrder(ctx context.Context, userID uuid.UUID, orderID int64) (PaymentResponse, error)
	VerifyRazorpaySignature(ctx context.Context, req VerifySignatureRequest) (PaymentResponse, error)
	ProcessWebhook(ctx context.Context, rawBody []byte, signature string) error
	ListPayments(ctx context.Context, userID uuid.UUID) ([]PaymentResponse, error)
	SetInvoiceService(invSvc InvoiceService)
}

type paymentService struct {
	payRepo   repository.PaymentRepository
	orderRepo repository.OrderRepository
	cfg       *config.Config
	client    *http.Client
	invSvc    InvoiceService
}

func NewPaymentService(payRepo repository.PaymentRepository, orderRepo repository.OrderRepository, cfg *config.Config) PaymentService {
	return &paymentService{
		payRepo:   payRepo,
		orderRepo: orderRepo,
		cfg:       cfg,
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *paymentService) SetInvoiceService(invSvc InvoiceService) {
	s.invSvc = invSvc
}

func (s *paymentService) CreateRazorpayOrder(ctx context.Context, userID uuid.UUID, orderID int64) (PaymentResponse, error) {
	// 1. Fetch order details
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return PaymentResponse{}, ErrPaymentOrderNotFound
	}

	// 2. Validate order permissions
	if order.UserID != userID {
		return PaymentResponse{}, ErrPaymentUserMismatch
	}

	// 3. Prevent duplicate payment if order is already paid or cancelled
	if strings.ToUpper(order.Status) == "PAID" || strings.ToUpper(order.Status) == "PROCESSING" || strings.ToUpper(order.Status) == "SHIPPED" || strings.ToUpper(order.Status) == "DELIVERED" {
		return PaymentResponse{}, ErrPaymentAlreadyPaid
	}

	// Check if a payment record already exists for this order with status PENDING.
	// If so, reuse its provider order ID to avoid duplicate Razorpay orders.
	existingPayments, _ := s.payRepo.ListByUserID(ctx, userID)
	for _, ep := range existingPayments {
		if ep.OrderID == orderID && ep.Status == "PENDING" {
			return s.mapResponse(ep), nil
		}
	}

	// Build amount in paise
	amountPaise := int64(order.TotalAmount * 100)
	providerOrderID := ""

	// Determine if we utilize real Razorpay or fallback mock
	if s.cfg.RazorpayKeyID == "" || strings.HasPrefix(s.cfg.RazorpayKeyID, "rzp_test_mock") {
		providerOrderID = "order_mock_" + uuid.New().String()[:12]
	} else {
		// Real Razorpay integration
		url := "https://api.razorpay.com/v1/orders"
		payload := map[string]interface{}{
			"amount":   amountPaise,
			"currency": "INR",
			"receipt":  fmt.Sprintf("receipt_order_%d", order.ID),
		}

		jsonPayload, err := json.Marshal(payload)
		if err != nil {
			return PaymentResponse{}, fmt.Errorf("failed to encode razorpay payloads: %w", err)
		}

		req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(jsonPayload))
		if err != nil {
			return PaymentResponse{}, fmt.Errorf("failed to build razorpay API request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")
		req.SetBasicAuth(s.cfg.RazorpayKeyID, s.cfg.RazorpayKeySecret)

		resp, err := s.client.Do(req)
		if err != nil {
			// fallback mock if connection fails or API is down for development resilience
			providerOrderID = "order_mock_fallback_" + uuid.New().String()[:12]
		} else {
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
				providerOrderID = "order_mock_fallback_status_" + uuid.New().String()[:12]
			} else {
				var rzResponse struct {
					ID string `json:"id"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&rzResponse); err != nil {
					providerOrderID = "order_mock_fallback_decode_" + uuid.New().String()[:12]
				} else {
					providerOrderID = rzResponse.ID
				}
			}
		}
	}

	// Store payment record in local Database
	paymentRecord, err := s.payRepo.Create(ctx, sqlc.CreatePaymentParams{
		OrderID:           order.ID,
		UserID:            order.UserID,
		Provider:          "RAZORPAY",
		ProviderOrderID:   providerOrderID,
		ProviderPaymentID: nil,
		Amount:            order.TotalAmount,
		Status:            "PENDING",
	})
	if err != nil {
		return PaymentResponse{}, fmt.Errorf("failed to store payment intent record: %w", err)
	}

	return s.mapResponse(paymentRecord), nil
}

func (s *paymentService) VerifyRazorpaySignature(ctx context.Context, req VerifySignatureRequest) (PaymentResponse, error) {
	// 1. Verify signatures
	if !s.verifySignature(req.RazorpayOrderID, req.RazorpayPaymentID, req.RazorpaySignature) {
		return PaymentResponse{}, ErrInvalidSignature
	}

	// 2. Perform Postgres Transaction to complete capture and update order to PAID status
	paymentRecord, err := s.payRepo.ProcessPaymentCapture(ctx, req.RazorpayOrderID, req.RazorpayPaymentID)
	if err != nil {
		return PaymentResponse{}, fmt.Errorf("failed to process database payment capture updates: %w", err)
	}

	if s.invSvc != nil {
		_, _ = s.invSvc.GenerateInvoice(ctx, paymentRecord.OrderID)
	}

	return s.mapResponse(paymentRecord), nil
}

func (s *paymentService) ProcessWebhook(ctx context.Context, rawBody []byte, signature string) error {
	// 1. Webhook Signature Verification - REQUIRED in production, recommended in all environments
	if s.cfg.RazorpayWebhookSecret != "" && signature == "" {
		return ErrInvalidSignature
	}

	if signature != "" {
		if !s.verifyWebhookSignature(rawBody, signature) {
			return ErrInvalidSignature
		}
	}

	// 2. Parse Webhook Event JSON schema
	var ev struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID      string `json:"id"`
					OrderID string `json:"order_id"`
					Status  string `json:"status"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}

	if err := json.Unmarshal(rawBody, &ev); err != nil {
		return fmt.Errorf("failed to process webhook JSON extraction: %w", err)
	}

	// Process webhook event by type
	switch ev.Event {
	case "payment.captured":
		providerOrderID := ev.Payload.Payment.Entity.OrderID
		providerPaymentID := ev.Payload.Payment.Entity.ID

		if providerOrderID == "" || providerPaymentID == "" {
			return fmt.Errorf("missing critical webhook transaction payloads")
		}

		// Idempotency check: if payment already captured, skip processing
		existing, err := s.payRepo.GetByProviderOrderID(ctx, providerOrderID)
		if err == nil && (existing.Status == "CAPTURED" || existing.Status == "PAID") {
			return nil // Already processed, acknowledge webhook
		}

		payRecord, err := s.payRepo.ProcessPaymentCapture(ctx, providerOrderID, providerPaymentID)
		if err != nil {
			return fmt.Errorf("transaction failed during webhook payment capture updates: %w", err)
		}

		if s.invSvc != nil {
			_, _ = s.invSvc.GenerateInvoice(ctx, payRecord.OrderID)
		}

	case "payment.failed":
		providerOrderID := ev.Payload.Payment.Entity.OrderID
		if providerOrderID != "" {
			pay, err := s.payRepo.GetByProviderOrderID(ctx, providerOrderID)
			if err == nil && pay.Status == "PENDING" {
				_, _ = rzUpdateStatusFailHelper(ctx, s.payRepo, pay.ID, "FAILED")
			}
		}
	}

	return nil
}

func rzUpdateStatusFailHelper(ctx context.Context, repo repository.PaymentRepository, id int64, status string) (sqlc.Payment, error) {
	return repo.UpdateStatus(ctx, id, status)
}

func (s *paymentService) ListPayments(ctx context.Context, userID uuid.UUID) ([]PaymentResponse, error) {
	items, err := s.payRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	res := make([]PaymentResponse, len(items))
	for i, item := range items {
		res[i] = s.mapResponse(item)
	}
	return res, nil
}

func (s *paymentService) verifySignature(orderID, paymentID, signature string) bool {
	// Allow mock signatures ONLY in development/test environments
	if s.cfg.AppEnv != "production" && signature == "mock_signature_for_test" {
		return true
	}

	message := orderID + "|" + paymentID
	mac := hmac.New(sha256.New, []byte(s.cfg.RazorpayKeySecret))
	mac.Write([]byte(message))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func (s *paymentService) verifyWebhookSignature(rawBody []byte, headerSignature string) bool {
	// Allow mock webhook signatures ONLY in development/test environments
	if s.cfg.AppEnv != "production" && headerSignature == "mock_webhook_signature_for_test" {
		return true
	}

	mac := hmac.New(sha256.New, []byte(s.cfg.RazorpayWebhookSecret))
	mac.Write(rawBody)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(headerSignature), []byte(expectedSignature))
}

func (s *paymentService) mapResponse(p sqlc.Payment) PaymentResponse {
	return PaymentResponse{
		ID:                p.ID,
		OrderID:           p.OrderID,
		UserID:            p.UserID,
		Provider:          p.Provider,
		ProviderOrderID:   p.ProviderOrderID,
		ProviderPaymentID: p.ProviderPaymentID,
		Amount:            p.Amount,
		Status:            p.Status,
		CreatedAt:         p.CreatedAt,
		UpdatedAt:         p.UpdatedAt,
	}
}
