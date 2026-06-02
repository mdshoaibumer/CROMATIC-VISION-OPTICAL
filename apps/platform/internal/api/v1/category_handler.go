package v1

import (
	"errors"
	"strconv"

	"github.com/gofiber/fiber/v3"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
)

// CategoryHandler receives Category HTTP triggers
type CategoryHandler struct {
	svc service.CategoryService
}

// NewCategoryHandler builds category handler controllers
func NewCategoryHandler(svc service.CategoryService) *CategoryHandler {
	return &CategoryHandler{svc: svc}
}

// CreateCategoryRequest holds request fields for creation
type CreateCategoryRequest struct {
	Name        string  `json:"name"`
	Slug        string  `json:"slug"`
	Description *string `json:"description"`
}

// CreateCategory handles POST /api/v1/admin/categories
func (h *CategoryHandler) CreateCategory(c fiber.Ctx) error {
	var req CreateCategoryRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode category JSON"))
	}

	cat, err := h.svc.Create(c.Context(), req.Name, req.Slug, req.Description)
	if err != nil {
		if errors.Is(err, service.ErrCategorySlugExists) {
			c.Status(fiber.StatusConflict)
			return c.JSON(response.Err("CONFLICT", err.Error()))
		}
		if errors.Is(err, service.ErrCategoryNameRequired) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to create category"))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(cat, "Category created successfully"))
}

// UpdateCategoryRequest holds request fields for categories revision
type UpdateCategoryRequest struct {
	Name        *string `json:"name"`
	Slug        *string `json:"slug"`
	Description *string `json:"description"`
}

// UpdateCategory handles PUT /api/v1/admin/categories/:id
func (h *CategoryHandler) UpdateCategory(c fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Category identifier must be an integer"))
	}

	var req UpdateCategoryRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode update JSON payload"))
	}

	cat, err := h.svc.Update(c.Context(), id, req.Name, req.Slug, req.Description)
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		if errors.Is(err, service.ErrCategorySlugExists) {
			c.Status(fiber.StatusConflict)
			return c.JSON(response.Err("CONFLICT", err.Error()))
		}
		if errors.Is(err, service.ErrCategoryNameRequired) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to update category"))
	}

	return c.JSON(response.OK(cat, "Category updated successfully"))
}

// DeleteCategory handles DELETE /api/v1/admin/categories/:id
func (h *CategoryHandler) DeleteCategory(c fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Category identifier must be an integer"))
	}

	err = h.svc.Delete(c.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrCategoryNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to delete category"))
	}

	return c.JSON(response.OK(nil, "Category deleted successfully"))
}

// ListCategories handles GET /api/v1/categories
func (h *CategoryHandler) ListCategories(c fiber.Ctx) error {
	cats, err := h.svc.List(c.Context())
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve categories list"))
	}

	return c.JSON(response.OK(cats, "Categories list retrieved successfully"))
}
