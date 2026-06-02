package v1

import (
	"errors"
	"math"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
)

// ProductHandler receives Product HTTP requests
type ProductHandler struct {
	svc service.ProductService
}

// NewProductHandler creates a product handler controller instance
func NewProductHandler(svc service.ProductService) *ProductHandler {
	return &ProductHandler{svc: svc}
}

// CreateProductRequest defines POST payload properties for creating a product
type CreateProductRequest struct {
	CategoryID  *int64   `json:"category_id"`
	Name        string   `json:"name"`
	Slug        string   `json:"slug"`
	Description string   `json:"description"`
	Price       float64  `json:"price"`
	SalePrice   *float64 `json:"sale_price"`
	Brand       string   `json:"brand"`
	FrameType   string   `json:"frame_type"`
	Material    string   `json:"material"`
	Gender      string   `json:"gender"`
	Stock       int32    `json:"stock"`
	Status      string   `json:"status"`
	Images      []string `json:"images"`
}

// CreateProduct handles POST /api/v1/admin/products
func (h *ProductHandler) CreateProduct(c fiber.Ctx) error {
	var req CreateProductRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode product JSON"))
	}

	arg := sqlc.CreateProductParams{
		CategoryID:  req.CategoryID,
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Price:       req.Price,
		SalePrice:   req.SalePrice,
		Brand:       req.Brand,
		FrameType:   req.FrameType,
		Material:    req.Material,
		Gender:      req.Gender,
		Stock:       req.Stock,
		Status:      req.Status,
	}

	prod, err := h.svc.Create(c.Context(), arg, req.Images)
	if err != nil {
		if errors.Is(err, service.ErrProductRequiredFields) ||
			errors.Is(err, service.ErrProductPriceInvalid) ||
			errors.Is(err, service.ErrProductSalePriceInvalid) ||
			errors.Is(err, service.ErrProductStockInvalid) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrProductSlugExists) {
			c.Status(fiber.StatusConflict)
			return c.JSON(response.Err("CONFLICT", err.Error()))
		}
		if errors.Is(err, service.ErrCategoryNotFound) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to create product"))
	}

	c.Status(fiber.StatusCreated)
	return c.JSON(response.OK(prod, "Product created successfully"))
}

// UpdateProductRequest defines PUT payload properties for updating a product
type UpdateProductRequest struct {
	CategoryID  *int64    `json:"category_id"`
	Name        *string   `json:"name"`
	Slug        *string   `json:"slug"`
	Description *string   `json:"description"`
	Price       *float64  `json:"price"`
	SalePrice   *float64  `json:"sale_price"`
	Brand       *string   `json:"brand"`
	FrameType   *string   `json:"frame_type"`
	Material    *string   `json:"material"`
	Gender      *string   `json:"gender"`
	Stock       *int32    `json:"stock"`
	Status      *string   `json:"status"`
	Images      *[]string `json:"images"`
}

// UpdateProduct handles PUT /api/v1/admin/products/:id
func (h *ProductHandler) UpdateProduct(c fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Product identifier must be an integer"))
	}

	var req UpdateProductRequest
	if err := c.Bind().JSON(&req); err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("BAD_REQUEST", "Failed to decode update JSON payload"))
	}

	arg := sqlc.UpdateProductParams{
		CategoryID:  req.CategoryID,
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		Price:       req.Price,
		SalePrice:   req.SalePrice,
		Brand:       req.Brand,
		FrameType:   req.FrameType,
		Material:    req.Material,
		Gender:      req.Gender,
		Stock:       req.Stock,
		Status:      req.Status,
	}

	prod, err := h.svc.Update(c.Context(), id, arg, req.Images)
	if err != nil {
		if errors.Is(err, service.ErrProductNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		if errors.Is(err, service.ErrProductRequiredFields) ||
			errors.Is(err, service.ErrProductPriceInvalid) ||
			errors.Is(err, service.ErrProductSalePriceInvalid) ||
			errors.Is(err, service.ErrProductStockInvalid) ||
			errors.Is(err, service.ErrCategoryNotFound) {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("VALIDATION_ERROR", err.Error()))
		}
		if errors.Is(err, service.ErrProductSlugExists) {
			c.Status(fiber.StatusConflict)
			return c.JSON(response.Err("CONFLICT", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to update product"))
	}

	return c.JSON(response.OK(prod, "Product updated successfully"))
}

// DeleteProduct handles DELETE /api/v1/admin/products/:id
func (h *ProductHandler) DeleteProduct(c fiber.Ctx) error {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Product identifier must be an integer"))
	}

	err = h.svc.Delete(c.Context(), id)
	if err != nil {
		if errors.Is(err, service.ErrProductNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to delete product"))
	}

	return c.JSON(response.OK(nil, "Product deleted successfully"))
}

// ListProducts handles GET /api/v1/products with sorting, pagination, and multi-filters
func (h *ProductHandler) ListProducts(c fiber.Ctx) error {
	filter := repository.ProductFilter{
		SortBy: "created_at_desc",
		Page:   1,
		Limit:  10,
	}

	// 1. Parsing core pagination offsets
	if pageStr := c.Query("page"); pageStr != "" {
		if pageVal, err := strconv.Atoi(pageStr); err == nil && pageVal > 0 {
			filter.Page = int32(pageVal)
		}
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		if limitVal, err := strconv.Atoi(limitStr); err == nil && limitVal > 0 {
			filter.Limit = int32(limitVal)
		}
	}

	// 2. Parsing text constraints
	if catSlug := c.Query("category_slug"); catSlug != "" {
		filter.CategorySlug = &catSlug
	}
	if brand := c.Query("brand"); brand != "" {
		filter.Brand = &brand
	}
	if gender := c.Query("gender"); gender != "" {
		filter.Gender = &gender
	}
	if frameType := c.Query("frame_type"); frameType != "" {
		filter.FrameType = &frameType
	}
	if material := c.Query("material"); material != "" {
		filter.Material = &material
	}
	if status := c.Query("status"); status != "" {
		filter.Status = &status
	}
	if search := c.Query("search"); search != "" {
		filter.Search = &search
	}
	if sort := c.Query("sort"); sort != "" {
		filter.SortBy = sort
	}

	// 3. Parsing numeric category filters
	if catIDStr := c.Query("category_id"); catIDStr != "" {
		if catIDVal, err := strconv.ParseInt(catIDStr, 10, 64); err == nil {
			filter.CategoryID = &catIDVal
		}
	}

	// 4. Parsing double boundaries prices filters
	if minPriceStr := c.Query("min_price"); minPriceStr != "" {
		if minPriceVal, err := strconv.ParseFloat(minPriceStr, 64); err == nil {
			filter.MinPrice = &minPriceVal
		}
	}
	if maxPriceStr := c.Query("max_price"); maxPriceStr != "" {
		if maxPriceVal, err := strconv.ParseFloat(maxPriceStr, 64); err == nil {
			filter.MaxPrice = &maxPriceVal
		}
	}

	products, totalCount, err := h.svc.List(c.Context(), filter)
	if err != nil {
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve products catalog list"))
	}

	totalPages := int32(math.Ceil(float64(totalCount) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	paginationMeta := fiber.Map{
		"items":       products,
		"total_count": totalCount,
		"page":        filter.Page,
		"limit":       filter.Limit,
		"total_pages": totalPages,
	}

	return c.JSON(response.OK(paginationMeta, "Products list retrieved successfully"))
}

// GetProductBySlug handles GET /api/v1/products/:slug
func (h *ProductHandler) GetProductBySlug(c fiber.Ctx) error {
	slug := strings.TrimSpace(c.Params("slug"))
	if slug == "" {
		c.Status(fiber.StatusBadRequest)
		return c.JSON(response.Err("VALIDATION_ERROR", "Product slug is required"))
	}

	prod, err := h.svc.GetBySlug(c.Context(), slug)
	if err != nil {
		if errors.Is(err, service.ErrProductNotFound) {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", err.Error()))
		}
		c.Status(fiber.StatusInternalServerError)
		return c.JSON(response.Err("INTERNAL_ERROR", "Failed to retrieve product details"))
	}

	return c.JSON(response.OK(prod, "Product details retrieved successfully"))
}
