package integration

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	v1 "github.com/cromatic-vision-optical/backend/internal/api/v1"
	"github.com/gofiber/fiber/v3"
)

// TestHealthEndpoints checks that /health/live returns a 200 OK and expected structure
func TestHealthEndpoints(t *testing.T) {
	// Initialize a test fiber application
	app := fiber.New()

	// Initialize the health controller. Inside testing fixtures, DB and redis can be nil or mock.
	// The Ready endpoint behaves correctly and shows degraded status if DB is uninitialized.
	healthHandler := v1.NewHealthHandler(nil, nil)

	// Bind routes to app
	app.Get("/api/v1/health/live", healthHandler.Live)
	app.Get("/api/v1/health/ready", healthHandler.Ready)

	// 1. Validate Live Endpoint
	t.Run("GET /api/v1/health/live should succeed", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "/api/v1/health/live", nil)
		if err != nil {
			t.Fatalf("Could not create HTTP request: %v", err)
		}

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Expected response but got error: %v", err)
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			t.Errorf("Expected status code %d, but got %d", http.StatusOK, resp.StatusCode)
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read body: %v", err)
		}

		var liveData v1.LiveResponse
		if err := json.Unmarshal(body, &liveData); err != nil {
			t.Fatalf("Failed to unmarshal response: %v", err)
		}

		if liveData.Status != "alive" {
			t.Errorf("Expected status 'alive', got '%s'", liveData.Status)
		}

		if liveData.Service != "cromatic-vision-api" {
			t.Errorf("Expected service 'cromatic-vision-api', got '%s'", liveData.Service)
		}
	})

	// 2. Validate Ready Endpoint (Database missing -> degraded error state)
	t.Run("GET /api/v1/health/ready should reflect degraded state when database references are empty", func(t *testing.T) {
		req, err := http.NewRequest(http.MethodGet, "/api/v1/health/ready", nil)
		if err != nil {
			t.Fatalf("Could not create HTTP request: %v", err)
		}

		resp, err := app.Test(req)
		if err != nil {
			t.Fatalf("Expected response but got error: %v", err)
		}
		defer resp.Body.Close()

		// The server returns a 503 service unavailable if DB and redis ping fail or are uninitialized
		if resp.StatusCode != http.StatusServiceUnavailable {
			t.Errorf("Expected status code %d (Service Unavailable), but got %d", http.StatusServiceUnavailable, resp.StatusCode)
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			t.Fatalf("Failed to read body: %v", err)
		}

		var readyData v1.ReadyResponse
		if err := json.Unmarshal(body, &readyData); err != nil {
			t.Fatalf("Failed to unmarshal ready response: %v", err)
		}

		if readyData.Status != "degraded" {
			t.Errorf("Expected status 'degraded', got '%s'", readyData.Status)
		}

		if readyData.Postgres != "uninitialized" {
			t.Errorf("Expected Postgres status 'uninitialized', got '%s'", readyData.Postgres)
		}

		if readyData.Redis != "uninitialized" {
			t.Errorf("Expected Redis status 'uninitialized', got '%s'", readyData.Redis)
		}
	})
}
