package middleware

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

// DistributedRateLimiterConfig configures the Redis-backed rate limiter
type DistributedRateLimiterConfig struct {
	Max         int
	Window      time.Duration
	KeyPrefix   string
	KeyFunc     func(c fiber.Ctx) string
	RedisClient *redis.RedisClient
	FailClosed  bool // If true, reject requests when Redis is unavailable (for auth endpoints)
}

// DistributedRateLimiter creates a Redis-backed rate limiter suitable for multi-instance deployments.
// Falls back to in-memory rate limiting if Redis is unavailable.
func DistributedRateLimiter(cfg DistributedRateLimiterConfig) fiber.Handler {
	// Fallback to in-memory if Redis not available
	if cfg.RedisClient == nil || cfg.RedisClient.Client == nil {
		return RateLimiter(RateLimiterConfig{
			Max:     cfg.Max,
			Window:  cfg.Window,
			KeyFunc: cfg.KeyFunc,
		})
	}

	prefix := cfg.KeyPrefix
	if prefix == "" {
		prefix = "rl:"
	}

	return func(c fiber.Ctx) error {
		key := prefix + cfg.KeyFunc(c)
		ctx := context.Background()

		// Use Redis INCR with expiry for atomic rate limiting
		count, err := cfg.RedisClient.Client.Incr(ctx, key).Result()
		if err != nil {
			// On Redis failure, behavior depends on FailClosed setting
			if cfg.FailClosed {
				c.Status(fiber.StatusServiceUnavailable)
				return c.JSON(response.Err("SERVICE_UNAVAILABLE", "Rate limiting service unavailable. Please try again later."))
			}
			// Fail open for non-critical endpoints
			return c.Next()
		}

		// Set TTL on first request in window
		if count == 1 {
			cfg.RedisClient.Client.Expire(ctx, key, cfg.Window)
		}

		if count > int64(cfg.Max) {
			ttl, _ := cfg.RedisClient.Client.TTL(ctx, key).Result()
			c.Status(fiber.StatusTooManyRequests)
			c.Set("Retry-After", strconv.Itoa(int(ttl.Seconds())))
			c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.Max))
			c.Set("X-RateLimit-Remaining", "0")
			return c.JSON(response.Err("RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later."))
		}

		remaining := int64(cfg.Max) - count
		c.Set("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.Max))
		c.Set("X-RateLimit-Remaining", fmt.Sprintf("%d", remaining))

		return c.Next()
	}
}

// DefaultDistributedRateLimiter returns a distributed rate limiter with default settings
func DefaultDistributedRateLimiter(redisClient *redis.RedisClient) fiber.Handler {
	return DistributedRateLimiter(DistributedRateLimiterConfig{
		Max:         60,
		Window:      1 * time.Minute,
		KeyPrefix:   "rl:default:",
		RedisClient: redisClient,
		KeyFunc: func(c fiber.Ctx) string {
			return c.IP()
		},
	})
}

// StrictDistributedRateLimiter returns a stricter Redis-backed limiter for auth endpoints
// This fails closed — if Redis is unavailable, auth requests are rejected for security.
func StrictDistributedRateLimiter(redisClient *redis.RedisClient) fiber.Handler {
	return DistributedRateLimiter(DistributedRateLimiterConfig{
		Max:         10,
		Window:      1 * time.Minute,
		KeyPrefix:   "rl:strict:",
		RedisClient: redisClient,
		FailClosed:  true,
		KeyFunc: func(c fiber.Ctx) string {
			return c.IP()
		},
	})
}
