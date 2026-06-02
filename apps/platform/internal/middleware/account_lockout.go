package middleware

import (
	"context"
	"fmt"
	"time"

	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

const (
	maxLoginAttempts  = 5
	lockoutDuration   = 15 * time.Minute
	attemptWindowTTL  = 5 * time.Minute
	lockoutKeyPrefix  = "lockout:"
	attemptsKeyPrefix = "login_attempts:"
)

// AccountLockout checks if an IP/email combination is locked out due to too many failed attempts.
// Call RecordFailedLogin after a failed auth attempt, and ClearLoginAttempts after success.
func AccountLockout(redisClient *redis.RedisClient) fiber.Handler {
	return func(c fiber.Ctx) error {
		if redisClient == nil || redisClient.Client == nil {
			return c.Next()
		}

		ip := c.IP()
		lockoutKey := lockoutKeyPrefix + ip

		// Check if locked out
		locked, err := redisClient.Client.Exists(c.Context(), lockoutKey).Result()
		if err == nil && locked > 0 {
			ttl, _ := redisClient.Client.TTL(c.Context(), lockoutKey).Result()
			c.Status(fiber.StatusTooManyRequests)
			c.Set("Retry-After", fmt.Sprintf("%d", int(ttl.Seconds())))
			return c.JSON(response.Err("ACCOUNT_LOCKED", fmt.Sprintf("Too many failed login attempts. Try again in %d minutes.", int(ttl.Minutes())+1)))
		}

		return c.Next()
	}
}

// RecordFailedLogin increments the failed attempt counter for an IP.
// If the threshold is reached, it sets a lockout key.
func RecordFailedLogin(ctx context.Context, redisClient *redis.RedisClient, ip string) {
	if redisClient == nil || redisClient.Client == nil {
		return
	}

	attemptsKey := attemptsKeyPrefix + ip
	count, err := redisClient.Client.Incr(ctx, attemptsKey).Result()
	if err != nil {
		return
	}

	// Set TTL on first attempt
	if count == 1 {
		redisClient.Client.Expire(ctx, attemptsKey, attemptWindowTTL)
	}

	// Lock the account if threshold exceeded
	if count >= int64(maxLoginAttempts) {
		lockoutKey := lockoutKeyPrefix + ip
		redisClient.Client.Set(ctx, lockoutKey, "locked", lockoutDuration)
		// Clear the attempts counter
		redisClient.Client.Del(ctx, attemptsKey)
	}
}

// ClearLoginAttempts resets the failed login counter on successful authentication.
func ClearLoginAttempts(ctx context.Context, redisClient *redis.RedisClient, ip string) {
	if redisClient == nil || redisClient.Client == nil {
		return
	}
	attemptsKey := attemptsKeyPrefix + ip
	redisClient.Client.Del(ctx, attemptsKey)
}
