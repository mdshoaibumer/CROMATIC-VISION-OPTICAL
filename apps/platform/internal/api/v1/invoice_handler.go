package v1

import (
	"errors"
	"fmt"
	"strconv"

	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// InvoiceHandler triggers billing retrieval and download controllers
type InvoiceHandler struct {
	invSvc service.InvoiceService
}

// NewInvoiceHandler builds clean controllers mapping
func NewInvoiceHandler(invSvc service.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{invSvc: invSvc}
}

// ListInvoices processes GET /api/v1/invoices
func (h *InvoiceHandler) ListInvoices(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "User profile is required to list billing history"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID format in request"))
	}

	invoices, err := h.invSvc.ListInvoicesByUserID(c.Context(), userID)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve invoices: "+err.Error()))
	}

	return c.JSON(response.OK(invoices, "Customer invoices listing returned successfully"))
}

// GetInvoice processes GET /api/v1/invoices/:id
func (h *InvoiceHandler) GetInvoice(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Authentication required to view invoice"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID format"))
	}

	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "A valid numerical invoice ID is required"))
	}

	invoice, err := h.invSvc.GetInvoiceByID(c.Context(), id, userID)
	if err != nil {
		if errors.Is(err, service.ErrInvoiceNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", "Invoice record not found or access denied"))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	return c.JSON(response.OK(invoice, "Invoice details fetched successfully"))
}

// DownloadInvoice processes GET /api/v1/invoices/:id/download
func (h *InvoiceHandler) DownloadInvoice(c fiber.Ctx) error {
	userIDStr, ok := c.Locals("user_id").(string)
	if !ok || userIDStr == "" {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Access token is mandatory to initiate downloads"))
	}

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid user ID payload"))
	}

	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Numerical invoice parameter is required"))
	}

	// For customer role, download is scoped precisely by user credentials
	pdfBytes, fileName, err := h.invSvc.DownloadInvoicePDF(c.Context(), id, userID, false)
	if err != nil {
		if errors.Is(err, service.ErrInvoiceNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", "Invoicing payload is not discovered"))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	// Serve the binary PDF stream back cleanly with appropriate metadata headers
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Set("Content-Length", strconv.Itoa(len(pdfBytes)))

	return c.Send(pdfBytes)
}

// AdminListInvoices processes GET /api/v1/admin/invoices
func (h *InvoiceHandler) AdminListInvoices(c fiber.Ctx) error {
	invoices, err := h.invSvc.ListAllInvoices(c.Context())
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to compile admin receipts registry: "+err.Error()))
	}

	return c.JSON(response.OK(invoices, "Administrative invoices log compiled successfully"))
}

// AdminDownloadInvoice processes GET /api/v1/admin/invoices/:id/download
func (h *InvoiceHandler) AdminDownloadInvoice(c fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil || id <= 0 {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Numerical invoice parameter is required"))
	}

	// For administrator role, download has absolute range across all customers
	pdfBytes, fileName, err := h.invSvc.DownloadInvoicePDF(c.Context(), id, uuid.Nil, true)
	if err != nil {
		if errors.Is(err, service.ErrInvoiceNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", "Invoicing payload is not discovered"))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	// Serve the binary PDF stream back cleanly with appropriate metadata headers
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	c.Set("Content-Length", strconv.Itoa(len(pdfBytes)))

	return c.Send(pdfBytes)
}
