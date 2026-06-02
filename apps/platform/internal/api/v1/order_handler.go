package v1

import (
	"errors"
	"strconv"

	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// OrderHandler manages order REST endpoints
type OrderHandler struct {
	orderSvc service.OrderService
}

// NewOrderHandler constructs an OrderHandler controller
func NewOrderHandler(orderSvc service.OrderService) *OrderHandler {
	return &OrderHandler{orderSvc: orderSvc}
}

type CreateOrderRequest struct {
	ShippingAddress string `json:"shipping_address"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
}

// CreateOrder handles POST /api/v1/orders
func (h *OrderHandler) CreateOrder(c fiber.Ctx) error {
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

	var req CreateOrderRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode checkout request JSON"))
	}

	order, err := h.orderSvc.CreateOrder(c.Context(), userID, req.ShippingAddress)
	if err != nil {
		if errors.Is(err, service.ErrAddressReq) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrEmptyCart) || errors.Is(err, service.ErrOutOfStock) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to place order: "+err.Error()))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(order, "Order placed successfully"))
}

// GetOrders handles GET /api/v1/orders
func (h *OrderHandler) GetOrders(c fiber.Ctx) error {
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

	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "20")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	orders, err := h.orderSvc.GetOrders(c.Context(), userID, int32(page), int32(limit))
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve orders: "+err.Error()))
	}

	return c.JSON(response.OK(orders, "Orders retrieved successfully"))
}

// GetOrderDetails handles GET /api/v1/orders/:id
func (h *OrderHandler) GetOrderDetails(c fiber.Ctx) error {
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
	orderID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid order ID parameter"))
	}

	role, _ := c.Locals("role").(string)
	isAdmin := role == "admin"

	order, err := h.orderSvc.GetOrderDetails(c.Context(), userID, orderID, isAdmin)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		if err.Error() == "unauthorized access to specified order details" {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("FORBIDDEN", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve order details: "+err.Error()))
	}

	return c.JSON(response.OK(order, "Order details retrieved successfully"))
}

// AdminListOrders handles GET /api/v1/admin/orders
func (h *OrderHandler) AdminListOrders(c fiber.Ctx) error {
	pageStr := c.Query("page", "1")
	limitStr := c.Query("limit", "20")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)

	orders, err := h.orderSvc.ListAllOrdersPaged(c.Context(), int32(page), int32(limit))
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to compile admin orders list: "+err.Error()))
	}

	return c.JSON(response.OK(orders, "Admin orders catalog compiled successfully"))
}

// AdminGetOrderDetails handles GET /api/v1/admin/orders/:id
func (h *OrderHandler) AdminGetOrderDetails(c fiber.Ctx) error {
	idParam := c.Params("id")
	orderID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid order ID parameter"))
	}

	userIDStr, _ := c.Locals("user_id").(string)
	var userID uuid.UUID
	if userIDStr != "" {
		userID, _ = uuid.Parse(userIDStr)
	}

	order, err := h.orderSvc.GetOrderDetails(c.Context(), userID, orderID, true)
	if err != nil {
		if errors.Is(err, service.ErrOrderNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve order details: "+err.Error()))
	}

	return c.JSON(response.OK(order, "Order details retrieved successfully"))
}

// AdminUpdateOrderStatus handles PUT /api/v1/admin/orders/:id/status
func (h *OrderHandler) AdminUpdateOrderStatus(c fiber.Ctx) error {
	idParam := c.Params("id")
	orderID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid order ID parameter"))
	}

	var req UpdateOrderStatusRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode update request JSON"))
	}

	order, err := h.orderSvc.UpdateOrderStatus(c.Context(), orderID, req.Status)
	if err != nil {
		if errors.Is(err, service.ErrInvalidStatus) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrOrderNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to update order status: "+err.Error()))
	}

	return c.JSON(response.OK(order, "Order status updated successfully"))
}
