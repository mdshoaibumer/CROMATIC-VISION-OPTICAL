package v1

import (
	"errors"
	"io"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
)

// ProductImageHandler handles REST API endpoints for product image operations
type ProductImageHandler struct {
	imgSvc service.ProductImageService
}

// NewProductImageHandler returns a new ProductImageHandler instance
func NewProductImageHandler(imgSvc service.ProductImageService) *ProductImageHandler {
	return &ProductImageHandler{imgSvc: imgSvc}
}

// UploadProductImage handles POST /api/v1/admin/products/:id/images
func (h *ProductImageHandler) UploadProductImage(c fiber.Ctx) error {
	idParam := c.Params("id")
	productID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "invalid product ID parameter"))
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "image file is required"))
	}

	isPrimaryStr := c.FormValue("is_primary")
	if isPrimaryStr == "" {
		isPrimaryStr = c.Query("is_primary")
	}
	isPrimary := isPrimaryStr == "true" || isPrimaryStr == "1"

	// Open dynamic stream to read binary files
	file, err := fileHeader.Open()
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "failed to open uploaded file"))
	}
	defer file.Close()

	fileData, err := io.ReadAll(file)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "failed to read uploaded file"))
	}

	contentType := fileHeader.Header.Get("Content-Type")
	// If Content-Type is missing from headers, guess based on filename
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	img, err := h.imgSvc.UploadImage(c.Context(), productID, fileData, fileHeader.Filename, contentType, isPrimary)
	if err != nil {
		if errors.Is(err, service.ErrInvalidFileType) ||
			errors.Is(err, service.ErrFileSizeTooLarge) ||
			errors.Is(err, service.ErrImageLimitExceeded) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrProductNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "failed to upload image: "+err.Error()))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(img, "product image uploaded successfully"))
}

// DeleteProductImage handles DELETE /api/v1/admin/products/:id/images/:imageId
func (h *ProductImageHandler) DeleteProductImage(c fiber.Ctx) error {
	idParam := c.Params("id")
	productID, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "invalid product ID parameter"))
	}

	imageIDParam := c.Params("imageId")
	imageID, err := strconv.ParseInt(imageIDParam, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "invalid image ID parameter"))
	}

	err = h.imgSvc.DeleteImage(c.Context(), productID, imageID)
	if err != nil {
		if errors.Is(err, service.ErrImageNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "failed to delete image: "+err.Error()))
	}

	return c.JSON(response.OK(nil, "product image deleted successfully"))
}
