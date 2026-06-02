package v1

import (
	"errors"
	"strconv"

	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// CartHandler manages shopping cart REST requests
type CartHandler struct {
	cartSvc service.CartService
}

// NewCartHandler constructs a CartHandler instance
func NewCartHandler(cartSvc service.CartService) *CartHandler {
	return &CartHandler{cartSvc: cartSvc}
}

type AddCartItemRequest struct {
	ProductID int64 `json:"product_id"`
	Quantity  int32 `json:"quantity"`
}

type UpdateCartItemRequest struct {
	Quantity int32 `json:"quantity"`
}

// GetCart handles GET /api/v1/cart
func (h *CartHandler) GetCart(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "User context not identified"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID format"))
	}

	cart, err := h.cartSvc.GetOrCreateCart(c.Context(), userID)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve shopping cart: "+err.Error()))
	}

	return c.JSON(response.OK(cart, "Cart retrieved successfully"))
}

// AddCartItem handles POST /api/v1/cart/items
func (h *CartHandler) AddCartItem(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "User context not identified"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID format"))
	}

	var req AddCartItemRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode cart request JSON"))
	}

	cart, err := h.cartSvc.AddItem(c.Context(), userID, req.ProductID, req.Quantity)
	if err != nil {
		if errors.Is(err, service.ErrInvalidQuantity) || errors.Is(err, service.ErrOutOfStock) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrProductNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to add item to cart: "+err.Error()))
	}

	c.Status(fiber.StatusOK)
	return c.JSON(response.OK(cart, "Item added to cart successfully"))
}

// UpdateCartItem handles PUT /api/v1/cart/items/:id
func (h *CartHandler) UpdateCartItem(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "User context not identified"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID format"))
	}

	idParam := c.Params("id")
	itemID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid cart item ID parameter"))
	}

	var req UpdateCartItemRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode update request JSON"))
	}

	cart, err := h.cartSvc.UpdateQuantity(c.Context(), userID, itemID, req.Quantity)
	if err != nil {
		if errors.Is(err, service.ErrInvalidQuantity) || errors.Is(err, service.ErrOutOfStock) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrCartItemNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to update item quantity: "+err.Error()))
	}

	return c.JSON(response.OK(cart, "Cart item updated successfully"))
}

// DeleteCartItem handles DELETE /api/v1/cart/items/:id
func (h *CartHandler) DeleteCartItem(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "User context not identified"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID format"))
	}

	idParam := c.Params("id")
	itemID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid cart item ID parameter"))
	}

	cart, err := h.cartSvc.RemoveItem(c.Context(), userID, itemID)
	if err != nil {
		if errors.Is(err, service.ErrCartItemNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to remove item from cart: "+err.Error()))
	}

	return c.JSON(response.OK(cart, "Item removed from cart successfully"))
}
