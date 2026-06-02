package v1

import (
	"errors"
	"io"
	"strconv"

	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
)

// PrescriptionHandler manages optical prescription REST endpoints
type PrescriptionHandler struct {
	rxSvc service.PrescriptionService
}

// NewPrescriptionHandler constructs a PrescriptionHandler controller
func NewPrescriptionHandler(rxSvc service.PrescriptionService) *PrescriptionHandler {
	return &PrescriptionHandler{rxSvc: rxSvc}
}

type UpdatePrescriptionStatusRequest struct {
	Status string `json:"status"`
}

// UploadPrescription handles POST /api/v1/prescriptions (Multipart File Upload)
func (h *PrescriptionHandler) UploadPrescription(c fiber.Ctx) error {
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

	// 1. Get raw form fields
	orderIDStr := c.FormValue("order_id")
	orderID, err := strconv.ParseInt(orderIDStr, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid order_id form field parameter"))
	}

	prescriptionType := c.FormValue("prescription_type")
	if prescriptionType == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "prescription_type form field is required"))
	}

	notesVal := c.FormValue("notes")
	var notes *string
	if notesVal != "" {
		notes = &notesVal
	}

	// 2. Decode the file
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "file part is required"))
	}

	// Pre-validate file size of multipart chunk
	if fileHeader.Size > 10*1024*1024 {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", service.ErrPrescriptionSizeExceeded.Error()))
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to process prescription file load"))
	}
	defer file.Close()

	fileData, err := io.ReadAll(file)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to read prescription file content"))
	}

	contentType := fileHeader.Header.Get("Content-Type")

	rx, err := h.rxSvc.UploadPrescription(c.Context(), userID, orderID, prescriptionType, fileData, fileHeader.Filename, contentType, notes)
	if err != nil {
		if errors.Is(err, service.ErrPrecriptionInvalidType) || errors.Is(err, service.ErrPrescriptionSizeExceeded) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrPrescriptionOrderNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		if errors.Is(err, service.ErrPrescriptionUserMismatch) {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("FORBIDDEN", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(rx, "Prescription uploaded successfully"))
}

// GetPrescription handles GET /api/v1/prescriptions/:id
func (h *PrescriptionHandler) GetPrescription(c fiber.Ctx) error {
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
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid prescription ID parameter"))
	}

	role, _ := c.Locals("role").(string)
	isAdmin := role == "admin"

	rx, err := h.rxSvc.GetPrescription(c.Context(), userID, id, isAdmin)
	if err != nil {
		if errors.Is(err, service.ErrPrescriptionNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	return c.JSON(response.OK(rx, "Prescription details retrieved successfully"))
}

// ListPrescriptions handles GET /api/v1/prescriptions
func (h *PrescriptionHandler) ListPrescriptions(c fiber.Ctx) error {
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

	rxList, err := h.rxSvc.ListPrescriptions(c.Context(), userID, false)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	return c.JSON(response.OK(rxList, "Prescriptions list retrieved successfully"))
}

// AdminListPrescriptions handles GET /api/v1/admin/prescriptions
func (h *PrescriptionHandler) AdminListPrescriptions(c fiber.Ctx) error {
	rxList, err := h.rxSvc.ListPrescriptions(c.Context(), uuid.Nil, true)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to compile admin prescriptions list: "+err.Error()))
	}

	return c.JSON(response.OK(rxList, "Admin prescriptions catalog retrieved successfully"))
}

// AdminGetPrescription handles GET /api/v1/admin/prescriptions/:id
func (h *PrescriptionHandler) AdminGetPrescription(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid prescription ID parameter"))
	}

	rx, err := h.rxSvc.GetPrescription(c.Context(), uuid.Nil, id, true)
	if err != nil {
		if errors.Is(err, service.ErrPrescriptionNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	return c.JSON(response.OK(rx, "Prescription details retrieved successfully"))
}

// AdminUpdateStatus handles PUT /api/v1/admin/prescriptions/:id/status
func (h *PrescriptionHandler) AdminUpdateStatus(c fiber.Ctx) error {
	idParam := c.Params("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Invalid prescription ID parameter"))
	}

	var req UpdatePrescriptionStatusRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode status update request JSON"))
	}

	rx, err := h.rxSvc.UpdateStatus(c.Context(), id, req.Status)
	if err != nil {
		if errors.Is(err, service.ErrPrescriptionInvalidStatus) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrPrescriptionNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", err.Error()))
	}

	return c.JSON(response.OK(rx, "Prescription status updated successfully"))
}
