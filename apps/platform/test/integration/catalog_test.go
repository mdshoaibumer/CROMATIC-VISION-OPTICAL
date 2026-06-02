package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strings"
	"testing"
	"time"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
	"github.com/jackc/pgx/v5"
)

// -- MOCK REPOSITORIES IMPLEMENTATIONS --

type MockCategoryRepository struct {
	categories map[int64]sqlc.Category
	nextID     int64
}

func NewMockCategoryRepository() *MockCategoryRepository {
	return &MockCategoryRepository{
		categories: make(map[int64]sqlc.Category),
	}
}

func (m *MockCategoryRepository) Create(ctx context.Context, arg sqlc.CreateCategoryParams) (sqlc.Category, error) {
	m.nextID++
	now := time.Now()
	cat := sqlc.Category{
		ID:          m.nextID,
		Name:        arg.Name,
		Slug:        arg.Slug,
		Description: arg.Description,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	m.categories[m.nextID] = cat
	return cat, nil
}

func (m *MockCategoryRepository) Update(ctx context.Context, arg sqlc.UpdateCategoryParams) (sqlc.Category, error) {
	cat, ok := m.categories[arg.ID]
	if !ok {
		return sqlc.Category{}, pgx.ErrNoRows
	}
	if arg.Name != nil {
		cat.Name = *arg.Name
	}
	if arg.Slug != nil {
		cat.Slug = *arg.Slug
	}
	if arg.Description != nil {
		cat.Description = arg.Description
	}
	cat.UpdatedAt = time.Now()
	m.categories[arg.ID] = cat
	return cat, nil
}

func (m *MockCategoryRepository) Delete(ctx context.Context, id int64) error {
	if _, ok := m.categories[id]; !ok {
		return pgx.ErrNoRows
	}
	delete(m.categories, id)
	return nil
}

func (m *MockCategoryRepository) GetByID(ctx context.Context, id int64) (sqlc.Category, error) {
	cat, ok := m.categories[id]
	if !ok {
		return sqlc.Category{}, pgx.ErrNoRows
	}
	return cat, nil
}

func (m *MockCategoryRepository) GetBySlug(ctx context.Context, slug string) (sqlc.Category, error) {
	for _, cat := range m.categories {
		if strings.EqualFold(cat.Slug, slug) {
			return cat, nil
		}
	}
	return sqlc.Category{}, pgx.ErrNoRows
}

func (m *MockCategoryRepository) List(ctx context.Context) ([]sqlc.Category, error) {
	var list []sqlc.Category
	for _, c := range m.categories {
		list = append(list, c)
	}
	return list, nil
}

type MockProductRepository struct {
	products  map[int64]sqlc.Product
	images    map[int64][]sqlc.ProductImage
	nextID    int64
	nextImgID int64
	catRepo   *MockCategoryRepository
}

func NewMockProductRepository(catRepo *MockCategoryRepository) *MockProductRepository {
	return &MockProductRepository{
		products: make(map[int64]sqlc.Product),
		images:   make(map[int64][]sqlc.ProductImage),
		catRepo:  catRepo,
	}
}

func (m *MockProductRepository) Create(ctx context.Context, arg sqlc.CreateProductParams) (sqlc.Product, error) {
	m.nextID++
	now := time.Now()
	p := sqlc.Product{
		ID:          m.nextID,
		CategoryID:  arg.CategoryID,
		Name:        arg.Name,
		Slug:        arg.Slug,
		Description: arg.Description,
		Price:       arg.Price,
		SalePrice:   arg.SalePrice,
		Brand:       arg.Brand,
		FrameType:   arg.FrameType,
		Material:    arg.Material,
		Gender:      arg.Gender,
		Stock:       arg.Stock,
		Status:      arg.Status,
		CreatedAt:   now,
		UpdatedAt:   now,
	}
	m.products[m.nextID] = p
	return p, nil
}

func (m *MockProductRepository) Update(ctx context.Context, arg sqlc.UpdateProductParams) (sqlc.Product, error) {
	p, ok := m.products[arg.ID]
	if !ok {
		return sqlc.Product{}, pgx.ErrNoRows
	}
	if arg.CategoryID != nil {
		p.CategoryID = arg.CategoryID
	}
	if arg.Name != nil {
		p.Name = *arg.Name
	}
	if arg.Slug != nil {
		p.Slug = *arg.Slug
	}
	if arg.Description != nil {
		p.Description = *arg.Description
	}
	if arg.Price != nil {
		p.Price = *arg.Price
	}
	if arg.SalePrice != nil {
		p.SalePrice = arg.SalePrice
	}
	if arg.Brand != nil {
		p.Brand = *arg.Brand
	}
	if arg.FrameType != nil {
		p.FrameType = *arg.FrameType
	}
	if arg.Material != nil {
		p.Material = *arg.Material
	}
	if arg.Gender != nil {
		p.Gender = *arg.Gender
	}
	if arg.Stock != nil {
		p.Stock = *arg.Stock
	}
	if arg.Status != nil {
		p.Status = *arg.Status
	}
	p.UpdatedAt = time.Now()
	m.products[arg.ID] = p
	return p, nil
}

func (m *MockProductRepository) Delete(ctx context.Context, id int64) error {
	if _, ok := m.products[id]; !ok {
		return pgx.ErrNoRows
	}
	delete(m.products, id)
	delete(m.images, id)
	return nil
}

func (m *MockProductRepository) GetByID(ctx context.Context, id int64) (sqlc.Product, error) {
	p, ok := m.products[id]
	if !ok {
		return sqlc.Product{}, pgx.ErrNoRows
	}
	return p, nil
}

func (m *MockProductRepository) GetBySlug(ctx context.Context, slug string) (sqlc.Product, error) {
	for _, p := range m.products {
		if strings.EqualFold(p.Slug, slug) {
			return p, nil
		}
	}
	return sqlc.Product{}, pgx.ErrNoRows
}

func (m *MockProductRepository) GetDetailsBySlug(ctx context.Context, slug string) (repository.ProductWithDetails, error) {
	p, err := m.GetBySlug(ctx, slug)
	if err != nil {
		return repository.ProductWithDetails{}, err
	}
	var catName *string
	if p.CategoryID != nil {
		if cat, err := m.catRepo.GetByID(ctx, *p.CategoryID); err == nil {
			catName = &cat.Name
		}
	}
	imgs := make([]sqlc.ProductImage, len(m.images[p.ID]))
	copy(imgs, m.images[p.ID])
	sort.Slice(imgs, func(i, j int) bool {
		if imgs[i].IsPrimary != imgs[j].IsPrimary {
			return imgs[i].IsPrimary
		}
		return imgs[i].ID < imgs[j].ID
	})
	return repository.ProductWithDetails{
		Product:      p,
		CategoryName: catName,
		Images:       imgs,
	}, nil
}

func (m *MockProductRepository) GetDetailsByID(ctx context.Context, id int64) (repository.ProductWithDetails, error) {
	p, err := m.GetByID(ctx, id)
	if err != nil {
		return repository.ProductWithDetails{}, err
	}
	var catName *string
	if p.CategoryID != nil {
		if cat, err := m.catRepo.GetByID(ctx, *p.CategoryID); err == nil {
			catName = &cat.Name
		}
	}
	return repository.ProductWithDetails{
		Product:      p,
		CategoryName: catName,
		Images:       m.images[p.ID],
	}, nil
}

func (m *MockProductRepository) List(ctx context.Context, filter repository.ProductFilter) ([]repository.ProductWithDetails, int64, error) {
	var matches []repository.ProductWithDetails

	for _, p := range m.products {
		// Category Slug validation
		if filter.CategorySlug != nil && *filter.CategorySlug != "" {
			if p.CategoryID == nil {
				continue
			}
			cat, err := m.catRepo.GetByID(ctx, *p.CategoryID)
			if err != nil || !strings.EqualFold(cat.Slug, *filter.CategorySlug) {
				continue
			}
		}

		// Category ID filter
		if filter.CategoryID != nil && p.CategoryID != nil && *p.CategoryID != *filter.CategoryID {
			continue
		}

		// Gender
		if filter.Gender != nil && !strings.EqualFold(p.Gender, *filter.Gender) {
			continue
		}

		// Brand
		if filter.Brand != nil && !strings.EqualFold(p.Brand, *filter.Brand) {
			continue
		}

		// Price thresholds
		if filter.MinPrice != nil && p.Price < *filter.MinPrice {
			continue
		}
		if filter.MaxPrice != nil && p.Price > *filter.MaxPrice {
			continue
		}

		var catName *string
		if p.CategoryID != nil {
			if cat, err := m.catRepo.GetByID(ctx, *p.CategoryID); err == nil {
				catName = &cat.Name
			}
		}

		matches = append(matches, repository.ProductWithDetails{
			Product:      p,
			CategoryName: catName,
			Images:       m.images[p.ID],
		})
	}

	total := int64(len(matches))

	// Pagination slicing simulation
	start := (filter.Page - 1) * filter.Limit
	if start > int32(len(matches)) {
		return []repository.ProductWithDetails{}, total, nil
	}

	end := start + filter.Limit
	if end > int32(len(matches)) {
		end = int32(len(matches))
	}

	return matches[start:end], total, nil
}

func (m *MockProductRepository) CreateImage(ctx context.Context, arg sqlc.CreateProductImageParams) (sqlc.ProductImage, error) {
	m.nextImgID++
	img := sqlc.ProductImage{
		ID:        m.nextImgID,
		ProductID: arg.ProductID,
		ImageUrl:  arg.ImageUrl,
		ObjectKey: arg.ObjectKey,
		IsPrimary: arg.IsPrimary,
		CreatedAt: time.Now(),
	}
	m.images[arg.ProductID] = append(m.images[arg.ProductID], img)
	return img, nil
}

func (m *MockProductRepository) DeleteImages(ctx context.Context, productID int64) error {
	m.images[productID] = []sqlc.ProductImage{}
	return nil
}

func (m *MockProductRepository) ListImages(ctx context.Context, productID int64) ([]sqlc.ProductImage, error) {
	return m.images[productID], nil
}

func (m *MockProductRepository) GetImageByID(ctx context.Context, id int64) (sqlc.ProductImage, error) {
	for _, imgList := range m.images {
		for _, img := range imgList {
			if img.ID == id {
				return img, nil
			}
		}
	}
	return sqlc.ProductImage{}, pgx.ErrNoRows
}

func (m *MockProductRepository) DeleteImageByID(ctx context.Context, id int64, productID int64) error {
	imgList, ok := m.images[productID]
	if !ok {
		return pgx.ErrNoRows
	}
	found := false
	var updated []sqlc.ProductImage
	for _, img := range imgList {
		if img.ID == id {
			found = true
			continue
		}
		updated = append(updated, img)
	}
	if !found {
		return pgx.ErrNoRows
	}
	m.images[productID] = updated
	return nil
}

func (m *MockProductRepository) ClearPrimaryImage(ctx context.Context, productID int64) error {
	imgList := m.images[productID]
	for idx := range imgList {
		imgList[idx].IsPrimary = false
	}
	m.images[productID] = imgList
	return nil
}

// -- TEST HTTP MOCK SETUPS --

func SetupCatalogTestApp(catSvc service.CategoryService, prodSvc service.ProductService) *fiber.App {
	app := fiber.New()

	categoryHandler := v1.NewCategoryHandler(catSvc)
	productHandler := v1.NewProductHandler(prodSvc)

	// Simulated Mock Gated Access headers or locals resolver
	mockRoleMiddleware := func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", "Unauthorized"))
		}
		if strings.Contains(authHeader, "Bearer admin_token") {
			c.Locals("user_id", "admin-id")
			c.Locals("role", "admin")
			return c.Next()
		}
		if strings.Contains(authHeader, "Bearer customer__token") {
			c.Locals("user_id", "customer-id")
			c.Locals("role", "customer")
			return c.Next()
		}
		c.Status(fiber.StatusUnauthorized)
		return c.JSON(response.Err("UNAUTHORIZED", "Invalid token"))
	}

	adminOnly := func(c fiber.Ctx) error {
		role, _ := c.Locals("role").(string)
		if role != "admin" {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("FORBIDDEN", "Admin privileges required"))
		}
		return c.Next()
	}

	api := app.Group("/api/v1")

	// Admin Gated Operations
	adminGroup := api.Group("/admin", mockRoleMiddleware, adminOnly)
	adminGroup.Post("/categories", categoryHandler.CreateCategory)
	adminGroup.Put("/categories/:id", categoryHandler.UpdateCategory)
	adminGroup.Delete("/categories/:id", categoryHandler.DeleteCategory)

	adminGroup.Post("/products", productHandler.CreateProduct)
	adminGroup.Put("/products/:id", productHandler.UpdateProduct)
	adminGroup.Delete("/products/:id", productHandler.DeleteProduct)

	// Public Operations
	api.Get("/categories", categoryHandler.ListCategories)
	api.Get("/products", productHandler.ListProducts)
	api.Get("/products/:slug", productHandler.GetProductBySlug)

	return app
}

// -- INTEGRATION FLOW TESTS --

func TestCatalogCompleteLifecycle(t *testing.T) {
	catRepo := NewMockCategoryRepository()
	prodRepo := NewMockProductRepository(catRepo)

	catSvc := service.NewCategoryService(catRepo)
	prodSvc := service.NewProductService(prodRepo, catRepo)

	app := SetupCatalogTestApp(catSvc, prodSvc)

	var registeredCategoryID int64
	var registeredProductSlug string
	var registeredProductID int64

	// 1. Roles access controls blocks testing
	t.Run("Roles access control check - Guests blocked from categories creation", func(t *testing.T) {
		payload := map[string]interface{}{"name": "Glasses"}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")

		resp, err := app.Test(req, 1*time.Second)
		if err != nil {
			t.Fatalf("Connection fails: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected 401 Unauthorized for unauthenticated clients, got: %d", resp.StatusCode)
		}
	})

	t.Run("Roles access control check - Customers forbidden from category creation", func(t *testing.T) {
		payload := map[string]interface{}{"name": "Glasses"}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer customer__token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden for customer tokens, got: %d", resp.StatusCode)
		}
	})

	// 2. Categories flows operations
	t.Run("Create Category is successful by Admin", func(t *testing.T) {
		payload := map[string]interface{}{
			"name":        "Sunglasses Collection",
			"slug":        "sunglasses",
			"description": "Stylish solar shades",
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, err := app.Test(req, 1*time.Second)
		if err != nil {
			t.Fatalf("Execution fails: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 201 Created, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool          `json:"success"`
			Data    sqlc.Category `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if !res.Success || res.Data.Name != "Sunglasses Collection" {
			t.Error("Failed to store categories properties")
		}
		registeredCategoryID = res.Data.ID
	})

	t.Run("Category slug uniqueness protection is properly active", func(t *testing.T) {
		payload := map[string]interface{}{
			"name": "Alternate sunglasses pack",
			"slug": "sunglasses", // duplicated
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/admin/categories", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusConflict {
			t.Errorf("Expected 409 Conflict for duplicate slugs, got: %d", resp.StatusCode)
		}
	})

	// 3. Products flows validation
	t.Run("Create Product fails with invalid parameters - stock negative", func(t *testing.T) {
		payload := map[string]interface{}{
			"category_id": registeredCategoryID,
			"name":        "Aviator G2",
			"description": "Classic gold polarized sunglasses",
			"price":       149.99,
			"brand":       "RayBan",
			"frame_type":  "Full Rim",
			"material":    "Metal",
			"gender":      "Unisex",
			"stock":       -5, // invalid
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/admin/products", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request on negative stock levels, got: %d", resp.StatusCode)
		}
	})

	t.Run("Create Product is successful with standard values", func(t *testing.T) {
		payload := map[string]interface{}{
			"category_id": registeredCategoryID,
			"name":        "Aviator G2 Gold",
			"slug":        "aviator-g2-gold",
			"description": "Gold framed luxury aviators",
			"price":       189.00,
			"brand":       "RayBan",
			"frame_type":  "Full Rim",
			"material":    "Metal",
			"gender":      "Unisex",
			"stock":       15,
			"images":      []string{"https://images.cdn/aviator-gold-1.jpg"},
		}
		jsonVal, _ := json.Marshal(payload)
		req, _ := http.NewRequest(http.MethodPost, "/api/v1/admin/products", bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, err := app.Test(req, 1*time.Second)
		if err != nil {
			t.Fatalf("Test request fails: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 201 Created on valid product, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                          `json:"success"`
			Data    repository.ProductWithDetails `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if !res.Success || res.Data.Slug != "aviator-g2-gold" {
			t.Error("Store products returned wrong payload elements")
		}

		if len(res.Data.Images) != 1 || res.Data.Images[0].ImageUrl != "https://images.cdn/aviator-gold-1.jpg" {
			t.Error("Product images associations failed inside creation query")
		}

		registeredProductSlug = res.Data.Slug
		registeredProductID = res.Data.ID
	})

	// 4. Update operations with prices boundaries checking
	t.Run("Update Product price check - fails when sale price exceeds price", func(t *testing.T) {
		payload := map[string]interface{}{
			"price":      120.00,
			"sale_price": 135.00, // exceeds standard price
		}
		jsonVal, _ := json.Marshal(payload)
		reqPath := fmt.Sprintf("/api/v1/admin/products/%d", registeredProductID)
		req, _ := http.NewRequest(http.MethodPut, reqPath, bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request checking sale boundary limits, got: %d", resp.StatusCode)
		}
	})

	t.Run("Update Product is successful with discounted sale prices", func(t *testing.T) {
		payload := map[string]interface{}{
			"price":      200.00,
			"sale_price": 149.99,
		}
		jsonVal, _ := json.Marshal(payload)
		reqPath := fmt.Sprintf("/api/v1/admin/products/%d", registeredProductID)
		req, _ := http.NewRequest(http.MethodPut, reqPath, bytes.NewBuffer(jsonVal))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK after updates standard catalog, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                          `json:"success"`
			Data    repository.ProductWithDetails `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if res.Data.Price != 200.00 || *res.Data.SalePrice != 149.99 {
			t.Error("Product updates failed saving values properly in repository mock")
		}
	})

	// 5. Public listings and search/filtering controls checking
	t.Run("Public query listing categories successfully", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/v1/categories", nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200 OK list categories, got: %d", resp.StatusCode)
		}
	})

	t.Run("Public querying products gets successful paginated catalog lists matching filters", func(t *testing.T) {
		// Category Slug search
		path := "/api/v1/products?category_slug=sunglasses&brand=RayBan&page=1&limit=5"
		req, _ := http.NewRequest(http.MethodGet, path, nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK public lists, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool `json:"success"`
			Data    struct {
				Items      []repository.ProductWithDetails `json:"items"`
				TotalCount int32                           `json:"total_count"`
			} `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if len(res.Data.Items) != 1 || res.Data.Items[0].Brand != "RayBan" {
			t.Error("Catalog products retrieval parameters ignored or corrupt filters")
		}
	})

	t.Run("Retrieve individual details by slug succeeds and returns structures", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/products/%s", registeredProductSlug)
		req, _ := http.NewRequest(http.MethodGet, path, nil)
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK product details, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		var res struct {
			Success bool                          `json:"success"`
			Data    repository.ProductWithDetails `json:"data"`
		}
		_ = json.Unmarshal(body, &res)

		if res.Data.Slug != registeredProductSlug || res.Data.CategoryName == nil || *res.Data.CategoryName != "Sunglasses Collection" {
			t.Error("Detail product by slug does not hold correct metadata properties")
		}
	})

	// 6. Delete cleanups testing
	t.Run("Admin product deletion drops records correctly", func(t *testing.T) {
		path := fmt.Sprintf("/api/v1/admin/products/%d", registeredProductID)
		req, _ := http.NewRequest(http.MethodDelete, path, nil)
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200 OK during deletion, got: %d", resp.StatusCode)
		}

		// Detail should now return 404
		detailPath := fmt.Sprintf("/api/v1/products/%s", registeredProductSlug)
		reqDet, _ := http.NewRequest(http.MethodGet, detailPath, nil)
		respDet, _ := app.Test(reqDet, 1*time.Second)
		defer respDet.Body.Close()

		if respDet.StatusCode != http.StatusNotFound {
			t.Errorf("Expected deleted product detail query to return 404, got: %d", respDet.StatusCode)
		}
	})
}
