package app

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/api/routes"
	"github.com/cromatic-vision-optical/backend/internal/config"
	"github.com/cromatic-vision-optical/backend/internal/database"
	"github.com/cromatic-vision-optical/backend/internal/logger"
	"github.com/cromatic-vision-optical/backend/internal/middleware"
	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/gofiber/fiber/v3"
)

// App aggregates all runtime dependency references and states
type App struct {
	Config *config.Config
	Log    *slog.Logger
	DB     *database.DB
	Redis  *redis.RedisClient
	Fiber  *fiber.App
}

// New initializes standard Clean Architecture dependencies
func New() (*App, error) {
	// 1. Parse configuration
	cfg, err := config.Load()
	if err != nil {
		return nil, fmt.Errorf("failed to load configurations: %w", err)
	}

	// 2. Setup logging level and handlers
	log := logger.InitLogger(cfg.AppEnv)
	log.Info("Initializing Cromatic Vision Optical Platform...", "app_name", cfg.AppName, "env", cfg.AppEnv)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 3. Connect to Postgres DB
	db, err := database.Connect(ctx, cfg.PostgresHost, cfg.PostgresPort, cfg.PostgresUser, cfg.PostgresPassword, cfg.PostgresDB, cfg.PostgresSSLMode, log)
	if err != nil {
		log.Error("Database connection dropped", "error", err)
		return nil, err
	}

	// 3b. Run pending database migrations
	if err := database.RunMigrations(cfg.PostgresHost, cfg.PostgresPort, cfg.PostgresUser, cfg.PostgresPassword, cfg.PostgresDB, cfg.PostgresSSLMode, log); err != nil {
		log.Error("Database migration failed", "error", err)
		db.Close()
		return nil, err
	}

	// 4. Connect to Redis cache
	redisClient, err := redis.Connect(ctx, cfg.RedisHost, cfg.RedisPort, cfg.RedisPassword, log)
	if err != nil {
		log.Error("Redis caching engine rejected validation", "error", err)
		db.Close() // cleaning up already connected Postgres
		return nil, err
	}

	// 5. Initialize the Fiber V3 framework
	fiberApp := fiber.New(fiber.Config{
		AppName:      cfg.AppName,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
		BodyLimit:    10 * 1024 * 1024, // 10MB max request body
	})

	// 6. Hook global middlewares in sequential order
	fiberApp.Use(middleware.RequestID())                                // Transaction tracing ID
	fiberApp.Use(middleware.SecurityHeaders(cfg.AppEnv))                // Defense-in-depth security headers (env-aware caching)
	fiberApp.Use(middleware.MetricsCollector())                         // Prometheus metrics collection
	fiberApp.Use(middleware.RequestLogger(log))                         // Structured standard log
	fiberApp.Use(middleware.AuditLogger(log))                           // Immutable audit trail for mutating operations
	fiberApp.Use(middleware.CORS(cfg.AllowedOrigins))                   // Cross-origin Resource Sharing
	fiberApp.Use(middleware.DefaultDistributedRateLimiter(redisClient)) // Redis-backed distributed rate limiting
	fiberApp.Use(middleware.CSRFProtection(cfg.AppEnv))                 // CSRF double-submit cookie protection
	fiberApp.Use(middleware.Recovery(log))                              // Capture panics safely

	// Prometheus-compatible metrics endpoint (admin-only)
	fiberApp.Get("/metrics", middleware.AuthMiddleware(cfg.JWTSecret, redisClient), middleware.AdminOnly(), middleware.MetricsHandler())

	// 7. Route attachments
	routes.SetupRoutes(fiberApp, db, redisClient, log, cfg)

	return &App{
		Config: cfg,
		Log:    log,
		DB:     db,
		Redis:  redisClient,
		Fiber:  fiberApp,
	}, nil
}

// Run listens to server ports & gracefully shuts down on receipt of termination interrupts
func (a *App) Run() error {
	addr := fmt.Sprintf("0.0.0.0:%s", a.Config.AppPort)

	// Channel to capture operating system interrupts
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM, syscall.SIGINT)

	// Goroutine starting port listener
	go func() {
		a.Log.Info("Starting HTTP Service Gateway...", "address", addr)
		if err := a.Fiber.Listen(addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
			a.Log.Error("Port binding failure, server crashing down", "error", err)
			shutdownChan <- os.Kill
		}
	}()

	// Blocking wait until signal is received
	sig := <-shutdownChan
	a.Log.Info("Graceful termination signal received", "signal", sig.String())

	// Shutdown context with limit of 15 seconds
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer shutdownCancel()

	// 1. Close HTTP gateway listener pool
	a.Log.Info("Closing Fiber listener pool...")
	if err := a.Fiber.ShutdownWithContext(shutdownCtx); err != nil {
		a.Log.Error("Fiber shutdown failed with warnings", "error", err)
	} else {
		a.Log.Info("Fiber listener pool safely terminated")
	}

	// 2. Terminate Redis pool
	a.Redis.Close()

	// 3. Terminate Postgres connection pool
	a.DB.Close()

	a.Log.Info("Cromatic Vision Optical Backend shutdown successfully completed. Sandbox safe.")
	return nil
}
