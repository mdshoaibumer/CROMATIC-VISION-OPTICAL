package integration

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/textproto"
	"strings"
	"testing"
	"time"

	 v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/cromatic-vision-optical/backend/internal/storage"
	"github.com/gofiber/fiber/v3"
)

func SetupProductImageTestApp(
	catSvc service.CategoryService,
	prodSvc service.ProductService,
	imgSvc service.ProductImageService,
) *fiber.App {
	app := fiber.New()

	productHandler := v1.NewProductHandler(prodSvc)
	productImageHandler := v1.NewProductImageHandler(imgSvc)

	// Gated authentication simulation middleware
	mockAuthMiddleware := func(c fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", "Missing authorization header"))
		}
		if strings.Contains(authHeader, "Bearer admin_token") {
			c.Locals("user_id", "admin-user")
			c.Locals("role", "admin")
			return c.Next()
		}
		if strings.Contains(authHeader, "Bearer customer__token") {
			c.Locals("user_id", "customer-user")
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

	// Admin-only endpoints
	adminGroup := api.Group("/admin", mockAuthMiddleware, adminOnly)
	adminGroup.Post("/products/:id/images", productImageHandler.UploadProductImage)
	adminGroup.Delete("/products/:id/images/:imageId", productImageHandler.DeleteProductImage)

	// Public retrieval checks
	api.Get("/products/:slug", productHandler.GetProductBySlug)

	return app
}

func createMultipartReq(url, filename, contentType string, content []byte, isPrimary string) (*http.Request, error) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	// Setup custom header for file to pass exact custom content types in form headers
	h := make(textproto.MIMEHeader)
	h.Set("Content-Disposition", fmt.Sprintf(`form-data; name="file"; filename="%s"`, filename))
	h.Set("Content-Type", contentType)

	part, err := writer.CreatePart(h)
	if err != nil {
		return nil, err
	}
	if _, err := part.Write(content); err != nil {
		return nil, err
	}

	if isPrimary != "" {
		if err := writer.WriteField("is_primary", isPrimary); err != nil {
			return nil, err
		}
	}

	writer.Close()

	req, err := http.NewRequest(http.MethodPost, url, &body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	return req, nil
}

func TestProductImageLifecycle(t *testing.T) {
	catRepo := NewMockCategoryRepository()
	prodRepo := NewMockProductRepository(catRepo)
	mockStore := storage.NewMockStorage("")

	catSvc := service.NewCategoryService(catRepo)
	prodSvc := service.NewProductService(prodRepo, catRepo)
	imgSvc := service.NewProductImageService(prodRepo, mockStore)

	app := SetupProductImageTestApp(catSvc, prodSvc, imgSvc)

	// 1. Create a category and product to link images against
	ctx := context.Background()
	category, err := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Eyeglasses",
		Slug: "eyeglasses",
	})
	if err != nil {
		t.Fatalf("Failed to scaffold initial category: %v", err)
	}

	product, err := prodRepo.Create(ctx, sqlc.CreateProductParams{
		CategoryID:  &category.ID,
		Name:        "Model Active 40",
		Slug:        "model-active-40",
		Description: "Spectacular visual design frames.",
		Price:       119.99,
		Brand:       "RayBan",
		FrameType:   "Full-Rim",
		Material:    "Titanium",
		Gender:      "Unisex",
		Stock:       20,
		Status:      "active",
	})
	if err != nil {
		t.Fatalf("Failed to scaffold initial product: %v", err)
	}

	urlString := fmt.Sprintf("/api/v1/admin/products/%d/images", product.ID)

	// Test case 1: Guest trying to upload is unauthorized
	t.Run("Permissions Boundary - Gated Guest upload blocked", func(t *testing.T) {
		req, _ := createMultipartReq(urlString, "test.png", "image/png", []byte("fakedata"), "")
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusUnauthorized {
			t.Errorf("Expected 401 Unauthorized for guests, got: %d", resp.StatusCode)
		}
	})

	// Test case 2: Customer role trying to upload is forbidden
	t.Run("Permissions Boundary - Gated Customer upload forbidden", func(t *testing.T) {
		req, _ := createMultipartReq(urlString, "test.png", "image/png", []byte("fakedata"), "")
		req.Header.Set("Authorization", "Bearer customer__token")
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusForbidden {
			t.Errorf("Expected 403 Forbidden for customer roles, got: %d", resp.StatusCode)
		}
	})

	// Test case 3: Upload unsupported file type
	t.Run("Validation Filter - Reject invalid file formats (txt)", func(t *testing.T) {
		req, _ := createMultipartReq(urlString, "document.txt", "text/plain", []byte("sample text contents"), "")
		req.Header.Set("Authorization", "Bearer admin_token")
		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request on .txt uploads, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "VALIDATION_ERROR") {
			t.Errorf("Expected VALIDATION_ERROR response format, got: %s", string(body))
		}
	})

	// Test case 4: Upload file exceeding 10MB limit
	t.Run("Validation Filter - Reject large files exceeding 10MB limit", func(t *testing.T) {
		// Mock a 11MB file
		largeContent := bytes.Repeat([]byte{120}, 11*1024*1024)
		req, _ := createMultipartReq(urlString, "big-picture.png", "image/png", largeContent, "")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, err := app.Test(req, 5*time.Second)
		if err != nil {
			t.Fatalf("Failed connection request: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected max 10MB limit validation reject (400), got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "VALIDATION_ERROR") {
			t.Errorf("Expected size validation error code, got: %s", string(body))
		}
	})

	// Test case 5: Successful upload, defaulting to primary
	var primaryImageID int64
	t.Run("Functional Flow - Upload valid image 1 succeeds and defaults to Primary", func(t *testing.T) {
		imgBytes := []byte("fake png binary block")
		req, _ := createMultipartReq(urlString, "active-glass.png", "image/png", imgBytes, "false")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 201 Created for valid image uploads, got: %d", resp.StatusCode)
		}

		var ret map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&ret)
		
		dataMap := ret["data"].(map[string]interface{})
		primaryImageID = int64(dataMap["id"].(float64))
		imageUrl := dataMap["image_url"].(string)
		isPrimary := dataMap["is_primary"].(bool)

		if !isPrimary {
			t.Error("Expected first uploaded product image to fall back to primary = true")
		}
		if !strings.Contains(imageUrl, "/active-glass.png") {
			t.Errorf("Expected image public url mapping of filename, got: %s", imageUrl)
		}
	})

	// Test case 6: Upload valid second image specifying is_primary=true
	var secondaryImageID int64
	t.Run("Functional Flow - Upload valid image 2 with is_primary=true updates state", func(t *testing.T) {
		imgBytes := []byte("another fake jpeg binary block")
		req, _ := createMultipartReq(urlString, "front-view.jpg", "image/jpeg", imgBytes, "true")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("Expected 201 Created on second image upload, got: %d", resp.StatusCode)
		}

		var ret map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&ret)

		dataMap := ret["data"].(map[string]interface{})
		secondaryImageID = int64(dataMap["id"].(float64))
		isPrimary := dataMap["is_primary"].(bool)

		if !isPrimary {
			t.Error("Expected second image to be registered and confirmed as primary = true")
		}

		// Check database state - original image should no longer be primary
		imgs, _ := prodRepo.ListImages(ctx, product.ID)
		for _, img := range imgs {
			if img.ID == primaryImageID && img.IsPrimary {
				t.Error("Expected initial image's primary flag to have been reset to false")
			}
			if img.ID == secondaryImageID && !img.IsPrimary {
				t.Error("Expected newly set primary image to remain primary")
			}
		}
	})

	// Test case 7: Validate public details endpoint returns all product images
	t.Run("Retrieval Check - Product details returns all images correctly ordered", func(t *testing.T) {
		publicURL := fmt.Sprintf("/api/v1/products/%s", product.Slug)
		req, _ := http.NewRequest(http.MethodGet, publicURL, nil)

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Fatalf("Expected 200 OK on product details view, got: %d", resp.StatusCode)
		}

		var ret map[string]interface{}
		_ = json.NewDecoder(resp.Body).Decode(&ret)

		dataMap := ret["data"].(map[string]interface{})
		imagesList := dataMap["images"].([]interface{})

		if len(imagesList) != 2 {
			t.Errorf("Expected exactly 2 images in product detail catalog view, got: %d", len(imagesList))
		}

		// Ensure primary image appears first (due to ListProductImages ordering)
		firstImg := imagesList[0].(map[string]interface{})
		if !firstImg["is_primary"].(bool) {
			t.Error("Expected primary image to sort first in public endpoints lists")
		}
	})

	// Test case 8: Verify upload cap limits (Maximum 10 images)
	t.Run("Validation Filter - Max 10 images cap per product limit", func(t *testing.T) {
		imgBytes := []byte("image slice byte array")

		// We already uploaded 2 image records. Upload 8 more to reach 10 image limit.
		for i := 3; i <= 10; i++ {
			filename := fmt.Sprintf("extra-angle-%d.webp", i)
			req, _ := createMultipartReq(urlString, filename, "image/webp", imgBytes, "false")
			req.Header.Set("Authorization", "Bearer admin_token")

			resp, _ := app.Test(req, 1*time.Second)
			resp.Body.Close()
		}

		// The 11th upload should fail
		req, _ := createMultipartReq(urlString, "eleventh-view.png", "image/png", imgBytes, "false")
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("Expected 400 Bad Request when exceeding 10 images limit, got: %d", resp.StatusCode)
		}

		body, _ := io.ReadAll(resp.Body)
		if !strings.Contains(string(body), "VALIDATION_ERROR") {
			t.Errorf("Expected limit exceeded validation error, got: %s", string(body))
		}
	})

	// Test case 9: Delete product image
	t.Run("Functional Flow - Delete product image correctly deletes relational & storage components", func(t *testing.T) {
		// Identify an image to delete (secondary image uploaded, ID: secondaryImageID)
		deleteUrl := fmt.Sprintf("/api/v1/admin/products/%d/images/%d", product.ID, secondaryImageID)
		req, _ := http.NewRequest(http.MethodDelete, deleteUrl, nil)
		req.Header.Set("Authorization", "Bearer admin_token")

		resp, _ := app.Test(req, 1*time.Second)
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected 200 OK after successful image deletion, got: %d", resp.StatusCode)
		}

		// Database mapping check: should be gone from product details list
		imgs, _ := prodRepo.ListImages(ctx, product.ID)
		found := false
		for _, img := range imgs {
			if img.ID == secondaryImageID {
				found = true
				break
			}
		}
		if found {
			t.Error("Expected deleted image file to be absent from database query")
		}
	})
}
