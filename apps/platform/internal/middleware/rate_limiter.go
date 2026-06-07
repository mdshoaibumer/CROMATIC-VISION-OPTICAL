// Package middleware provides HTTP middleware for the Cromatic Vision Optical API.
// This file implements an in-memory token-bucket rate limiter with automatic
// background cleanup of expired entries. Suitable for single-instance deployments;
// for multi-instance use DistributedRateLimiter backed by Redis.
package middleware

import (
	"sync"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

// RateLimiterConfig holds rate limiter configuration
type RateLimiterConfig struct {
	Max     int           // Maximum number of requests
	Window  time.Duration // Time window for the limit
	KeyFunc func(c fiber.Ctx) string
}

type rateLimiterEntry struct {
	count   int
	resetAt time.Time
}

// RateLimiter creates an in-memory rate limiting middleware.
// The cleanup goroutine runs for the lifetime of the server process.
// For multi-instance deployments, use DistributedRateLimiter instead.
func RateLimiter(cfg RateLimiterConfig) fiber.Handler {
	var mu sync.Mutex
	clients := make(map[string]*rateLimiterEntry)

	// Background cleanup of expired entries every minute.
	// This goroutine is intentionally long-lived (server lifetime) and will be
	// reclaimed on process exit. This is acceptable for process-scoped middleware.
	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			mu.Lock()
			now := time.Now()
			for key, entry := range clients {
				if now.After(entry.resetAt) {
					delete(clients, key)
				}
			}
			mu.Unlock()
		}
	}()

	return func(c fiber.Ctx) error {
		key := cfg.KeyFunc(c)

		mu.Lock()
		entry, exists := clients[key]
		now := time.Now()

		if !exists || now.After(entry.resetAt) {
			clients[key] = &rateLimiterEntry{
				count:   1,
				resetAt: now.Add(cfg.Window),
			}
			mu.Unlock()
			return c.Next()
		}

		if entry.count >= cfg.Max {
			mu.Unlock()
			c.Status(fiber.StatusTooManyRequests)
			c.Set("Retry-After", entry.resetAt.Format(time.RFC1123))
			return c.JSON(response.Err("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later."))
		}

		entry.count++
		mu.Unlock()
		return c.Next()
	}
}

// DefaultRateLimiter returns a rate limiter with sensible defaults (60 requests per minute per IP)
func DefaultRateLimiter() fiber.Handler {
	return RateLimiter(RateLimiterConfig{
		Max:    60,
		Window: 1 * time.Minute,
		KeyFunc: func(c fiber.Ctx) string {
			return c.IP()
		},
	})
}

// StrictRateLimiter returns a stricter rate limiter for sensitive endpoints (10 requests per minute per IP)
func StrictRateLimiter() fiber.Handler {
	return RateLimiter(RateLimiterConfig{
		Max:    10,
		Window: 1 * time.Minute,
		KeyFunc: func(c fiber.Ctx) string {
			return c.IP()
		},
	})
}
