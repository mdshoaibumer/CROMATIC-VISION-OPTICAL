package v1

import (
	"fmt"
	"strings"

	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

// PromoCode represents a promotional discount configuration
type PromoCode struct {
	Code           string  `json:"code"`
	DiscountAmount float64 `json:"discount_amount"`
	MinCartTotal   float64 `json:"min_cart_total"`
	IsActive       bool    `json:"is_active"`
}

// PromoHandler handles promo code validation requests
type PromoHandler struct {
	// In a full implementation, this would be backed by a database repository.
	// For MVP, we use a server-side configurable list.
	promoCodes map[string]PromoCode
}

// NewPromoHandler creates a new PromoHandler with configured promo codes
func NewPromoHandler() *PromoHandler {
	codes := map[string]PromoCode{
		"WELCOME10": {Code: "WELCOME10", DiscountAmount: 10.00, MinCartTotal: 50.00, IsActive: true},
		"LUXURY20":  {Code: "LUXURY20", DiscountAmount: 20.00, MinCartTotal: 100.00, IsActive: true},
		"GENTLE50":  {Code: "GENTLE50", DiscountAmount: 50.00, MinCartTotal: 200.00, IsActive: true},
	}
	return &PromoHandler{promoCodes: codes}
}

// ValidatePromoRequest is the incoming payload
type ValidatePromoRequest struct {
	Code      string  `json:"code"`
	CartTotal float64 `json:"cart_total"`
}

// ValidatePromoResponse is the response payload
type ValidatePromoResponse struct {
	DiscountAmount float64 `json:"discount_amount"`
	Message        string  `json:"message"`
}

// ValidatePromo handles POST /api/v1/promo/validate
func (h *PromoHandler) ValidatePromo(c fiber.Ctx) error {
	var req ValidatePromoRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to parse promo code request"))
	}

	code := strings.ToUpper(strings.TrimSpace(req.Code))
	if code == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Promo code is required"))
	}

	promo, exists := h.promoCodes[code]
	if !exists || !promo.IsActive {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("INVALID_PROMO", "Invalid or expired promotional code"))
	}

	if req.CartTotal < promo.MinCartTotal {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("MIN_CART_NOT_MET", fmt.Sprintf("Minimum cart total of $%.2f required for this code", promo.MinCartTotal)))
	}

	return c.JSON(response.OK(ValidatePromoResponse{
		DiscountAmount: promo.DiscountAmount,
		Message:        "Promo code applied successfully",
	}, "Promo code validated"))
}
