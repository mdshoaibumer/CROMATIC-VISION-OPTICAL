package routes

import (
	"log/slog"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/cromatic-vision-optical/backend/internal/config"
	"github.com/cromatic-vision-optical/backend/internal/database"
	"github.com/cromatic-vision-optical/backend/internal/database/sqlc"
	"github.com/cromatic-vision-optical/backend/internal/middleware"
	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/cromatic-vision-optical/backend/internal/repository"
	"github.com/cromatic-vision-optical/backend/internal/service"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/cromatic-vision-optical/backend/internal/storage"
	"github.com/gofiber/fiber/v3"
)

// SetupRoutes wires all controllers to their specific paths
func SetupRoutes(app *fiber.App, db *database.DB, redisClient *redis.RedisClient, log *slog.Logger, cfg *config.Config) {
	// Base API route group
	api := app.Group("/api")
	v1Group := api.Group("/v1")

	// Initialize Health handler
	healthHandler := v1.NewHealthHandler(db, redisClient)

	// Attach Health endpoints
	v1Group.Get("/health/live", healthHandler.Live)
	v1Group.Get("/health/ready", healthHandler.Ready)

	// Auxiliary endpoint for testing Panic recovery middleware
	v1Group.Get("/health/panic", func(c fiber.Ctx) error {
		panic("simulated database stack corruption core dump")
	})

	// Initialize Authentication handler
	authHandler := v1.NewAuthHandler(db, redisClient, cfg.JWTSecret, cfg.AppEnv, log)

	// Auth Group
	authGroup := v1Group.Group("/auth")
	authGroup.Post("/register", middleware.StrictDistributedRateLimiter(redisClient), authHandler.Register)
	authGroup.Post("/login", middleware.StrictDistributedRateLimiter(redisClient), middleware.AccountLockout(redisClient), authHandler.Login)
	authGroup.Post("/logout", authHandler.Logout)
	authGroup.Post("/refresh", authHandler.Refresh)

	// Protected Auth routes
	authGroup.Get("/me", middleware.AuthMiddleware(cfg.JWTSecret), authHandler.Me)
	authGroup.Get("/admin-only-test", middleware.AuthMiddleware(cfg.JWTSecret), middleware.AdminOnly(), func(c fiber.Ctx) error {
		return c.JSON(response.OK(fiber.Map{"admin": true}, "Welcome, Administrator"))
	})

	// Catalog dependencies mapping
	sqlcQueries := sqlc.New(db.Pool)
	categoryRepo := repository.NewCategoryRepository(sqlcQueries)
	productRepo := repository.NewProductRepository(db.Pool, sqlcQueries)
	cartRepo := repository.NewCartRepository(db.Pool, sqlcQueries)
	orderRepo := repository.NewOrderRepository(db.Pool, sqlcQueries)
	rxRepo := repository.NewPrescriptionRepository(db.Pool, sqlcQueries)
	payRepo := repository.NewPaymentRepository(db.Pool, sqlcQueries)
	invoiceRepo := repository.NewInvoiceRepository(db.Pool, sqlcQueries)
	userRepo := repository.NewUserRepository(db.Pool, sqlcQueries)

	// Storage service mapping
	storageSvc, err := storage.NewStorageService(cfg)
	if err != nil {
		log.Error("Failed to initialize Storage Service engine", "error", err)
	}

	categorySvc := service.NewCategoryService(categoryRepo)
	productSvc := service.NewCachedProductService(
		service.NewProductService(productRepo, categoryRepo),
		redisClient,
	)
	productImageSvc := service.NewProductImageService(productRepo, storageSvc)
	cartSvc := service.NewCartService(cartRepo, productRepo)
	orderSvc := service.NewOrderService(orderRepo, cartRepo, productRepo, rxRepo)
	rxSvc := service.NewPrescriptionService(rxRepo, orderRepo, storageSvc)
	paySvc := service.NewPaymentService(payRepo, orderRepo, cfg)
	notifySvc := service.NewNotificationService(cfg)
	invSvc := service.NewInvoiceService(invoiceRepo, orderRepo, userRepo, storageSvc, notifySvc)

	// Set circular or setter dependency linkage for auto billing trigger
	paySvc.SetInvoiceService(invSvc)

	categoryHandler := v1.NewCategoryHandler(categorySvc)
	productHandler := v1.NewProductHandler(productSvc)
	productImageHandler := v1.NewProductImageHandler(productImageSvc)
	cartHandler := v1.NewCartHandler(cartSvc)
	orderHandler := v1.NewOrderHandler(orderSvc)
	rxHandler := v1.NewPrescriptionHandler(rxSvc)
	payHandler := v1.NewPaymentHandler(paySvc)
	invoiceHandler := v1.NewInvoiceHandler(invSvc)

	// Admin catalog and orders endpoints
	adminGroup := v1Group.Group("/admin", middleware.AuthMiddleware(cfg.JWTSecret), middleware.AdminOnly())

	adminGroup.Post("/categories", categoryHandler.CreateCategory)
	adminGroup.Put("/categories/:id", categoryHandler.UpdateCategory)
	adminGroup.Delete("/categories/:id", categoryHandler.DeleteCategory)

	adminGroup.Post("/products", productHandler.CreateProduct)
	adminGroup.Put("/products/:id", productHandler.UpdateProduct)
	adminGroup.Delete("/products/:id", productHandler.DeleteProduct)

	// Admin Product Images endpoints
	adminGroup.Post("/products/:id/images", productImageHandler.UploadProductImage)
	adminGroup.Delete("/products/:id/images/:imageId", productImageHandler.DeleteProductImage)

	// Admin Orders endpoints
	adminGroup.Get("/orders", orderHandler.AdminListOrders)
	adminGroup.Get("/orders/:id", orderHandler.AdminGetOrderDetails)
	adminGroup.Put("/orders/:id/status", orderHandler.AdminUpdateOrderStatus)

	// Admin Prescriptions endpoints
	adminGroup.Get("/prescriptions", rxHandler.AdminListPrescriptions)
	adminGroup.Get("/prescriptions/:id", rxHandler.AdminGetPrescription)
	adminGroup.Put("/prescriptions/:id/status", rxHandler.AdminUpdateStatus)

	// Admin Invoices endpoints
	adminGroup.Get("/invoices", invoiceHandler.AdminListInvoices)
	adminGroup.Get("/invoices/:id/download", invoiceHandler.AdminDownloadInvoice)

	// Admin Customers endpoints
	adminGroup.Get("/customers", authHandler.AdminListCustomers)
	adminGroup.Get("/customers/:id", authHandler.AdminGetCustomerByID)

	// Webhooks routes
	v1Group.Post("/webhooks/razorpay", payHandler.HandleWebhook)

	// Promo code validation (public but rate-limited)
	promoHandler := v1.NewPromoHandler()
	v1Group.Post("/promo/validate", middleware.StrictDistributedRateLimiter(redisClient), promoHandler.ValidatePromo)

	// Public catalog endpoints
	v1Group.Get("/categories", categoryHandler.ListCategories)
	v1Group.Get("/products", productHandler.ListProducts)
	v1Group.Get("/products/:slug", productHandler.GetProductBySlug)

	// Customer protected endpoints
	customerGroup := v1Group.Group("", middleware.AuthMiddleware(cfg.JWTSecret))

	// Carts routes
	customerGroup.Get("/cart", cartHandler.GetCart)
	customerGroup.Post("/cart/items", cartHandler.AddCartItem)
	customerGroup.Put("/cart/items/:id", cartHandler.UpdateCartItem)
	customerGroup.Delete("/cart/items/:id", cartHandler.DeleteCartItem)

	// Orders routes
	customerGroup.Post("/orders", orderHandler.CreateOrder)
	customerGroup.Get("/orders", orderHandler.GetOrders)
	customerGroup.Get("/orders/:id", orderHandler.GetOrderDetails)

	// Prescriptions routes
	customerGroup.Post("/prescriptions", rxHandler.UploadPrescription)
	customerGroup.Get("/prescriptions", rxHandler.ListPrescriptions)
	customerGroup.Get("/prescriptions/:id", rxHandler.GetPrescription)

	// Razorpay Payments routes
	customerGroup.Post("/payments/create-order", payHandler.CreateOrder)
	customerGroup.Post("/payments/verify", payHandler.VerifySignature)

	// Invoices routes
	customerGroup.Get("/invoices", invoiceHandler.ListInvoices)
	customerGroup.Get("/invoices/:id", invoiceHandler.GetInvoice)
	customerGroup.Get("/invoices/:id/download", invoiceHandler.DownloadInvoice)

	// Add dynamic welcome routes
	app.Get("/", func(c fiber.Ctx) error {
		return c.JSON(response.OK(fiber.Map{
			"app":       "Cromatic Vision Optical Platform",
			"version":   "1.0.0",
			"phase":     5,
			"status":    "running",
			"framework": "Fiber v3",
		}, "Welcome to the Cromatic Vision Optical API Gateway"))
	})
}
