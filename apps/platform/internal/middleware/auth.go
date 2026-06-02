package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/cromatic-vision-optical/backend/internal/shared/auth"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
)

// AuthMiddleware verifies the JWT access token and sets user details in locals
func AuthMiddleware(secret string) fiber.Handler {
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

		// Store user context details inside locals
		c.Locals("user_id", claims.UserID)
		c.Locals("role", claims.Role)

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
