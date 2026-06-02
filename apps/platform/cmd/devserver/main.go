package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/config"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/middleware"
	"github.com/cromatic-vision-optical/backend/internal/mock"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/cromatic-vision-optical/backend/internal/storage"
	"github.com/gofiber/fiber/v3"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// Dev server — runs the full backend with in-memory mock repositories.
// No Docker, PostgreSQL, or Redis required.
//
// Usage:
//   go run ./cmd/devserver
//
// The server starts on :3000 with pre-seeded data and full API compatibility.

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))
	log.Info("🚀 Starting Cromatic Vision Optical DEV SERVER (in-memory mode)")
	log.Info("⚠️  All data is ephemeral — lost on restart")

	// ─── Mock Repositories ───────────────────────────────────────────────────
	userRepo := mock.NewUserRepository()
	catRepo := mock.NewCategoryRepository()
	prodRepo := mock.NewProductRepository(catRepo)
	cartRepo := mock.NewCartRepository(prodRepo)
	orderRepo := mock.NewOrderRepository(userRepo)
	rxRepo := mock.NewPrescriptionRepository(userRepo)
	payRepo := mock.NewPaymentRepository()
	invoiceRepo := mock.NewInvoiceRepository()

	// ─── Seed Data ───────────────────────────────────────────────────────────
	seedData(catRepo, prodRepo, userRepo)

	// ─── Config (minimal for dev) ────────────────────────────────────────────
	cfg := &config.Config{
		AppName:           "Cromatic Vision Optical (Dev)",
		AppEnv:            "development",
		AppPort:           "3000",
		AllowedOrigins:    "http://localhost:3001,http://localhost:5173",
		JWTSecret:         "dev-secret-key-not-for-production",
		StorageProvider:   "mock",
		S3PublicURLPrefix: "http://localhost:3000/mock-files",
	}

	// ─── Storage ─────────────────────────────────────────────────────────────
	storageSvc, _ := storage.NewStorageService(cfg)

	// ─── Service Layer ───────────────────────────────────────────────────────
	categorySvc := service.NewCategoryService(catRepo)
	productSvc := service.NewProductService(prodRepo, catRepo)
	productImageSvc := service.NewProductImageService(prodRepo, storageSvc)
	cartSvc := service.NewCartService(cartRepo, prodRepo)
	orderSvc := service.NewOrderService(orderRepo, cartRepo, prodRepo, rxRepo)
	rxSvc := service.NewPrescriptionService(rxRepo, orderRepo, storageSvc)
	paySvc := service.NewPaymentService(payRepo, orderRepo, cfg)
	notifySvc := service.NewNotificationService(cfg)
	invSvc := service.NewInvoiceService(invoiceRepo, orderRepo, userRepo, storageSvc, notifySvc)
	paySvc.SetInvoiceService(invSvc)

	// ─── Handlers ────────────────────────────────────────────────────────────
	categoryHandler := v1.NewCategoryHandler(categorySvc)
	productHandler := v1.NewProductHandler(productSvc)
	productImageHandler := v1.NewProductImageHandler(productImageSvc)
	cartHandler := v1.NewCartHandler(cartSvc)
	orderHandler := v1.NewOrderHandler(orderSvc)
	rxHandler := v1.NewPrescriptionHandler(rxSvc)
	payHandler := v1.NewPaymentHandler(paySvc)
	invoiceHandler := v1.NewInvoiceHandler(invSvc)

	// Auth handler uses mock querier for user management
	mockQuerier := mock.NewLiveMockQuerier(userRepo)
	authHandler := v1.NewAuthHandlerForTest(mockQuerier, cfg.JWTSecret)

	// ─── Fiber App ───────────────────────────────────────────────────────────
	app := fiber.New(fiber.Config{
		AppName:      "Cromatic Vision DEV",
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		ErrorHandler: func(c fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			c.Status(code)
			return c.JSON(response.Err("ERROR", err.Error()))
		},
	})

	// Global middleware
	app.Use(middleware.RequestID())
	app.Use(middleware.CORS(cfg.AllowedOrigins))
	app.Use(middleware.SecurityHeaders())
	app.Use(middleware.Recovery(log))
	app.Use(middleware.RequestLogger(log))

	// ─── Routes ──────────────────────────────────────────────────────────────
	api := app.Group("/api")
	v1Group := api.Group("/v1")

	// Health (simplified for dev)
	v1Group.Get("/health/live", func(c fiber.Ctx) error {
		return c.JSON(response.OK(fiber.Map{"status": "ok", "mode": "dev-memory"}, "Service is alive"))
	})
	v1Group.Get("/health/ready", func(c fiber.Ctx) error {
		return c.JSON(response.OK(fiber.Map{"status": "ok", "mode": "dev-memory"}, "Service is ready"))
	})

	// Auth Group (no rate limiting in dev)
	authGroup := v1Group.Group("/auth")
	authGroup.Post("/register", authHandler.Register)
	authGroup.Post("/login", authHandler.Login)
	authGroup.Post("/logout", authHandler.Logout)
	authGroup.Post("/refresh", authHandler.Refresh)
	authGroup.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.Me)

	// Public catalog endpoints
	v1Group.Get("/categories", categoryHandler.ListCategories)
	v1Group.Get("/products", productHandler.ListProducts)
	v1Group.Get("/products/:slug", productHandler.GetProductBySlug)

	// Admin endpoints
	adminGroup := v1Group.Group("/admin", middleware.AuthMiddleware(cfg.JWTSecret), middleware.AdminOnly())
	adminGroup.Post("/categories", categoryHandler.CreateCategory)
	adminGroup.Put("/categories/:id", categoryHandler.UpdateCategory)
	adminGroup.Delete("/categories/:id", categoryHandler.DeleteCategory)
	adminGroup.Post("/products", productHandler.CreateProduct)
	adminGroup.Put("/products/:id", productHandler.UpdateProduct)
	adminGroup.Delete("/products/:id", productHandler.DeleteProduct)
	adminGroup.Post("/products/:id/images", productImageHandler.UploadProductImage)
	adminGroup.Delete("/products/:id/images/:imageId", productImageHandler.DeleteProductImage)
	adminGroup.Get("/orders", orderHandler.AdminListOrders)
	adminGroup.Get("/orders/:id", orderHandler.AdminGetOrderDetails)
	adminGroup.Put("/orders/:id/status", orderHandler.AdminUpdateOrderStatus)
	adminGroup.Get("/prescriptions", rxHandler.AdminListPrescriptions)
	adminGroup.Get("/prescriptions/:id", rxHandler.AdminGetPrescription)
	adminGroup.Put("/prescriptions/:id/status", rxHandler.AdminUpdateStatus)
	adminGroup.Get("/invoices", invoiceHandler.AdminListInvoices)
	adminGroup.Get("/invoices/:id/download", invoiceHandler.AdminDownloadInvoice)

	// Admin customer endpoints (simplified mock version)
	adminGroup.Get("/customers", func(c fiber.Ctx) error {
		users := userRepo.ListAll()
		var customers []fiber.Map
		for _, u := range users {
			if u.Role == "customer" {
				customers = append(customers, fiber.Map{
					"id": u.ID, "name": u.Name, "email": u.Email,
					"phone": u.Phone, "role": u.Role, "is_active": u.IsActive,
					"created_at": u.CreatedAt, "updated_at": u.UpdatedAt,
				})
			}
		}
		if customers == nil {
			customers = []fiber.Map{}
		}
		return c.JSON(response.OK(customers, "Customers list retrieved successfully"))
	})
	adminGroup.Get("/customers/:id", func(c fiber.Ctx) error {
		id, err := uuid.Parse(c.Params("id"))
		if err != nil {
			c.Status(fiber.StatusBadRequest)
			return c.JSON(response.Err("BAD_REQUEST", "Invalid customer ID"))
		}
		u, err := userRepo.GetByID(context.Background(), id)
		if err != nil {
			c.Status(fiber.StatusNotFound)
			return c.JSON(response.Err("NOT_FOUND", "Customer not found"))
		}
		return c.JSON(response.OK(fiber.Map{
			"id": u.ID, "name": u.Name, "email": u.Email,
			"phone": u.Phone, "role": u.Role, "is_active": u.IsActive,
			"created_at": u.CreatedAt, "updated_at": u.UpdatedAt,
		}, "Customer detail fetched successfully"))
	})

	// Webhooks
	v1Group.Post("/webhooks/razorpay", payHandler.HandleWebhook)

	// Promo code validation (no rate limiting in dev)
	promoHandler := v1.NewPromoHandler()
	v1Group.Post("/promo/validate", promoHandler.ValidatePromo)

	// Customer protected endpoints
	customerGroup := v1Group.Group("", middleware.AuthMiddleware(cfg.JWTSecret))
	customerGroup.Get("/cart", cartHandler.GetCart)
	customerGroup.Post("/cart/items", cartHandler.AddCartItem)
	customerGroup.Put("/cart/items/:id", cartHandler.UpdateCartItem)
	customerGroup.Delete("/cart/items/:id", cartHandler.DeleteCartItem)
	customerGroup.Post("/orders", orderHandler.CreateOrder)
	customerGroup.Get("/orders", orderHandler.GetOrders)
	customerGroup.Get("/orders/:id", orderHandler.GetOrderDetails)
	customerGroup.Post("/prescriptions", rxHandler.UploadPrescription)
	customerGroup.Get("/prescriptions", rxHandler.ListPrescriptions)
	customerGroup.Get("/prescriptions/:id", rxHandler.GetPrescription)
	customerGroup.Post("/payments/create-order", payHandler.CreateOrder)
	customerGroup.Post("/payments/verify", payHandler.VerifySignature)
	customerGroup.Get("/invoices", invoiceHandler.ListInvoices)
	customerGroup.Get("/invoices/:id", invoiceHandler.GetInvoice)
	customerGroup.Get("/invoices/:id/download", invoiceHandler.DownloadInvoice)

	// Root welcome
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(response.OK(fiber.Map{
			"app":     "Cromatic Vision Optical Platform",
			"version": "1.0.0-dev",
			"mode":    "in-memory (no Docker required)",
			"status":  "running",
		}, "Welcome to the Cromatic Vision Optical DEV API"))
	})

	// ─── Start Server ────────────────────────────────────────────────────────
	port := cfg.AppPort
	log.Info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
	log.Info(fmt.Sprintf("🌐 API Server: http://localhost:%s", port))
	log.Info(fmt.Sprintf("📦 Mode: In-Memory (no external dependencies)"))
	log.Info(fmt.Sprintf("👤 Test Admin: admin@cromatic.dev / admin123"))
	log.Info(fmt.Sprintf("👤 Test User:  user@cromatic.dev / user123"))
	log.Info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

	// Graceful shutdown
	go func() {
		if err := app.Listen(":" + port); err != nil {
			log.Error("Server failed", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down dev server...")
	_ = app.Shutdown()
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

func seedData(catRepo *mock.CategoryRepository, prodRepo *mock.ProductRepository, userRepo *mock.UserRepository) {
	ctx := context.Background()

	// Seed Users
	adminPwHash, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	userPwHash, _ := bcrypt.GenerateFromPassword([]byte("user123"), bcrypt.DefaultCost)

	userRepo.AddUser(sqlc.User{
		ID:           uuid.MustParse("00000000-0000-0000-0000-000000000001"),
		Name:         "Admin User",
		Email:        "admin@cromatic.dev",
		PasswordHash: string(adminPwHash),
		Role:         "admin",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	})
	userRepo.AddUser(sqlc.User{
		ID:           uuid.MustParse("00000000-0000-0000-0000-000000000002"),
		Name:         "Test Customer",
		Email:        "user@cromatic.dev",
		PasswordHash: string(userPwHash),
		Role:         "customer",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	})

	// Seed Categories
	cat1, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Sunglasses", Slug: "sunglasses", Description: strPtr("Premium sunglasses collection"),
	})
	cat2, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Eyeglasses", Slug: "eyeglasses", Description: strPtr("Designer prescription frames"),
	})
	cat3, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Blue Light", Slug: "blue-light", Description: strPtr("Screen protection eyewear"),
	})
	cat4, _ := catRepo.Create(ctx, sqlc.CreateCategoryParams{
		Name: "Sports", Slug: "sports", Description: strPtr("Performance sports eyewear"),
	})

	// Seed Products
	products := []sqlc.CreateProductParams{
		{CategoryID: &cat1.ID, Name: "Aviator Classic Gold", Slug: "aviator-classic-gold", Description: "Timeless aviator design with gold metal frame and gradient lenses", Price: 12999, Brand: "Cromatic", FrameType: "full-rim", Material: "metal", Gender: "unisex", Stock: 25, Status: "active"},
		{CategoryID: &cat1.ID, Name: "Wayfarer Noir", Slug: "wayfarer-noir", Description: "Bold black acetate frame with polarized dark lenses", Price: 8999, Brand: "Cromatic", FrameType: "full-rim", Material: "acetate", Gender: "unisex", Stock: 30, Status: "active"},
		{CategoryID: &cat2.ID, Name: "Oxford Round Tortoise", Slug: "oxford-round-tortoise", Description: "Classic round frames in rich tortoiseshell acetate", Price: 6999, Brand: "Cromatic", FrameType: "full-rim", Material: "acetate", Gender: "unisex", Stock: 20, Status: "active"},
		{CategoryID: &cat2.ID, Name: "Titanium Flex Pro", Slug: "titanium-flex-pro", Description: "Ultra-lightweight titanium frames with flexible temples", Price: 15999, SalePrice: float64Ptr(12999), Brand: "Cromatic", FrameType: "semi-rimless", Material: "titanium", Gender: "men", Stock: 15, Status: "active"},
		{CategoryID: &cat3.ID, Name: "Digital Shield Clear", Slug: "digital-shield-clear", Description: "Crystal-clear blue light blocking lenses for screen protection", Price: 4999, Brand: "Cromatic", FrameType: "full-rim", Material: "tr90", Gender: "unisex", Stock: 40, Status: "active"},
		{CategoryID: &cat3.ID, Name: "Screen Guard Minimal", Slug: "screen-guard-minimal", Description: "Minimalist frameless design with anti-blue light coating", Price: 5999, Brand: "Cromatic", FrameType: "rimless", Material: "titanium", Gender: "women", Stock: 18, Status: "active"},
		{CategoryID: &cat4.ID, Name: "Sport Wrap Elite", Slug: "sport-wrap-elite", Description: "Wraparound design for maximum protection during sports", Price: 9999, Brand: "Cromatic", FrameType: "full-rim", Material: "polycarbonate", Gender: "men", Stock: 22, Status: "active"},
		{CategoryID: &cat4.ID, Name: "Cycling Pro Aero", Slug: "cycling-pro-aero", Description: "Aerodynamic cycling glasses with interchangeable lenses", Price: 11999, SalePrice: float64Ptr(9499), Brand: "Cromatic", FrameType: "full-rim", Material: "tr90", Gender: "unisex", Stock: 12, Status: "active"},
	}

	for _, p := range products {
		prod, _ := prodRepo.Create(ctx, p)
		// Add a placeholder image for each product
		prodRepo.CreateImage(ctx, sqlc.CreateProductImageParams{
			ProductID: prod.ID,
			ImageUrl:  fmt.Sprintf("https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&q=80&product=%d", prod.ID),
			IsPrimary: true,
			ObjectKey: strPtr(fmt.Sprintf("products/%d/main.jpg", prod.ID)),
		})
	}

	_ = cat3
	_ = cat4
}

func strPtr(s string) *string       { return &s }
func float64Ptr(f float64) *float64 { return &f }
