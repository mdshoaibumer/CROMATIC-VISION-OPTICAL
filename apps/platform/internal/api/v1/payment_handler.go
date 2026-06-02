package v1

import (
	"errors"

	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// PaymentHandler provides endpoints for Razorpay payment checkouts
type PaymentHandler struct {
	paySvc service.PaymentService
}

// NewPaymentHandler constructs a new controller instance for payments
func NewPaymentHandler(paySvc service.PaymentService) *PaymentHandler {
	return &PaymentHandler{paySvc: paySvc}
}

// CreateOrder handles POST /api/v1/payments/create-order
func (h *PaymentHandler) CreateOrder(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Customer profile is required to proceed with payments"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID context format"))
	}

	var req service.CreateRazorpayOrderRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode checkout order details JSON"))
	}

	if req.OrderID <= 0 {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "A valid order_id is required"))
	}

	checkout, err := h.paySvc.CreateRazorpayOrder(c.Context(), userID, req.OrderID)
	if err != nil {
		if errors.Is(err, service.ErrPaymentOrderNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		if errors.Is(err, service.ErrPaymentUserMismatch) {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("FORBIDDEN", err.Error()))
		}
		if errors.Is(err, service.ErrPaymentAlreadyPaid) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("BAD_REQUEST", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(checkout, "Razorpay payment checkout order prepared successfully"))
}

// VerifySignature handles POST /api/v1/payments/verify
func (h *PaymentHandler) VerifySignature(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Verification requires an authenticated customer identity"))
	}

	var req service.VerifySignatureRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to read verification signatures payload"))
	}

	if req.RazorpayOrderID == "" || req.RazorpayPaymentID == "" || req.RazorpaySignature == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "razorpay_order_id, razorpay_payment_id, and razorpay_signature are all mandatory"))
	}

	checkout, err := h.paySvc.VerifyRazorpaySignature(c.Context(), req)
	if err != nil {
		if errors.Is(err, service.ErrInvalidSignature) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("SIGNATURE_FAILED", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	return c.JSON(response.OK(checkout, "Razorpay payment checkout captured and paid status recorded successfully"))
}

// HandleWebhook handles POST /api/v1/webhooks/razorpay
func (h *PaymentHandler) HandleWebhook(c fiber.Ctx) error {
	signature := c.Get("X-Razorpay-Signature")
	rawBody := c.Body()

	err := h.paySvc.ProcessWebhook(c.Context(), rawBody, signature)
	if err != nil {
		if errors.Is(err, service.ErrInvalidSignature) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("SIGNATURE_FAILED", err.Error()))
		}
		// Return 400 or let webhook parser fail on invalid bodies, but return a clean error structured
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("WEBHOOK_FAILED", err.Error()))
	}

	return c.JSON(response.OK(nil, "Razorpay event webhook completed successfully"))
}
