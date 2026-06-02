package middleware

import (
	"strings"

	"github.com/cromatic-vision-optical/backend/internal/redis"
	"github.com/cromatic-vision-optical/backend/internal/shared/auth"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

// AuthMiddleware verifies the JWT access token, checks revocation, and sets user details in locals
func AuthMiddleware(secret string, redisClient ...*redis.RedisClient) fiber.Handler {
	// Optional Redis client for token revocation checks
	var rc *redis.RedisClient
	if len(redisClient) > 0 {
		rc = redisClient[0]
	}

	return func(c fiber.Ctx) error {
		var tokenString string

		// 1. Try reading from HttpOnly cookie
		tokenString = c.Cookies("access_token")

		// 2. Fallback to Authorization Header
		if tokenString == "" {
			authHeader := c.Get("Authorization")
			if authHeader != "" {
				parts := strings.Split(authHeader, " ")
				if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
					tokenString = parts[1]
				}
			}
		}

		if tokenString == "" {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", "Authorization token is missing"))
		}
		claims, err := auth.VerifyToken(tokenString, secret)
		if err != nil {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", err.Error()))
		}

		// Reject refresh tokens used as access tokens (token type confusion prevention)
		if claims.TokenType == auth.TokenTypeRefresh {
			c.Status(fiber.StatusUnauthorized)
			return c.JSON(response.Err("UNAUTHORIZED", "Invalid token type"))
		}

		// 3. Check if token has been explicitly revoked
		if rc != nil && rc.Client != nil {
			if auth.IsTokenRevoked(c.Context(), rc.Client, tokenString) {
				c.Status(fiber.StatusUnauthorized)
				return c.JSON(response.Err("UNAUTHORIZED", "Token has been revoked"))
			}
			// 4. Check if all user tokens were revoked (e.g., password change)
			if claims.IssuedAt != nil {
				if auth.IsTokenIssuedBeforeRevocation(c.Context(), rc.Client, claims.UserID, claims.IssuedAt.Time) {
					c.Status(fiber.StatusUnauthorized)
					return c.JSON(response.Err("UNAUTHORIZED", "Session invalidated. Please login again."))
				}
			}
		}

		// Store user context details inside locals
		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)
		c.Locals("access_token", tokenString)

		return c.Next()
	}
}

// AdminOnly rejects requests from customers, allowing only administrators
func AdminOnly() fiber.Handler {
	return func(c fiber.Ctx) error {
		role, ok := c.Locals("role").(string)
		if !ok || role != "admin" {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("FORBIDDEN", "Administrative privilege required"))
		}
		return c.Next()
	}
}
