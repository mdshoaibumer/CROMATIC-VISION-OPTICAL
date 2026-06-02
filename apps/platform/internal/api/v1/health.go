package v1

import (
	"context"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/database"
	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/gofiber/fiber/v3"
)

// HealthHandler contains database and redis drivers
type HealthHandler struct {
	db    *database.DB
	redis *redis.RedisClient
}

// NewHealthHandler initializes handler dependency
func NewHealthHandler(db *database.DB, redisClient *redis.RedisClient) *HealthHandler {
	return &HealthHandler{
		db:    db,
		redis: redisClient,
	}
}

// Live response representation
type LiveResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
}

// Ready response representation
type ReadyResponse struct {
	Status    string `json:"status"`
	Service   string `json:"service"`
	Version   string `json:"version"`
	Postgres  string `json:"postgres"`
	Redis     string `json:"redis"`
	Timestamp string `json:"timestamp"`
}

// Live godoc
// @Summary Liveness health check
// @Description Check if the service container is alive
// @Tags System
// @Success 200 {object} LiveResponse
// @Router /api/v1/health/live [get]
func (h *HealthHandler) Live(c fiber.Ctx) error {
	return c.JSON(LiveResponse{
		Status:  "alive",
		Service: "cromatic-vision-api",
	})
}

// Ready godoc
// @Summary Readiness check
// @Description Validate actual connection health of underlying third-party databases
// @Tags System
// @Success 200 {object} ReadyResponse
// @Failure 503 {object} ReadyResponse
// @Router /api/v1/health/ready [get]
func (h *HealthHandler) Ready(c fiber.Ctx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	pgStatus := "connected"
	redisStatus := "connected"
	isUnhealthy := false

	// Test Postgres status
	if h.db != nil {
		if err := h.db.Pool.Ping(ctx); err != nil {
			pgStatus = "disconnected: " + err.Error()
			isUnhealthy = true
		}
	} else {
		pgStatus = "uninitialized"
		isUnhealthy = true
	}

	// Test Redis status
	if h.redis != nil {
		if _, err := h.redis.Client.Ping(ctx).Result(); err != nil {
			redisStatus = "disconnected: " + err.Error()
			isUnhealthy = true
		}
	} else {
		redisStatus = "uninitialized"
		isUnhealthy = true
	}

	status := "ready"
	httpStatus := fiber.StatusOK
	if isUnhealthy {
		status = "degraded"
		httpStatus = fiber.StatusServiceUnavailable
	}

	c.Status(httpStatus)
	return c.JSON(ReadyResponse{
		Status:    status,
		Service:   "cromatic-vision-api",
		Version:   "0.1.0",
		Postgres:  pgStatus,
		Redis:     redisStatus,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})
}
