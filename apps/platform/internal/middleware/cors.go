package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
)

// CORS is a custom, lightweight CORS middleware for Fiber v3
func CORS(allowedOrigins string) fiber.Handler {
	originsList := []string{"*"}
	if allowedOrigins != "" && allowedOrigins != "*" {
		originsList = strings.Split(allowedOrigins, ",")
		for i, o := range originsList {
			originsList[i] = strings.TrimSpace(o)
		}
	}

	return func(c fiber.Ctx) error {
		origin := c.Get("Origin")

		// Determine if the incoming origin is allowed
		allowOrigin := ""
		if len(originsList) > 0 && originsList[0] == "*" {
			allowOrigin = "*"
		} else {
			for _, o := range originsList {
				if o == origin {
					allowOrigin = origin
					break
				}
			}
		}

		if allowOrigin == "" {
			// Origin not in whitelist — do not set CORS headers
			if c.Method() == "OPTIONS" {
				c.Status(fiber.StatusForbidden)
				return nil
			}
			return c.Next()
		}

		c.Set("Access-Control-Allow-Origin", allowOrigin)
		c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		c.Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Request-ID, X-CSRF-Token")

		// Only allow credentials when a specific origin is whitelisted (not wildcard)
		if allowOrigin != "*" {
			c.Set("Access-Control-Allow-Credentials", "true")
		}

		// Handle preflight OPTIONS request directly
		if c.Method() == "OPTIONS" {
			c.Status(fiber.StatusNoContent)
			return nil
		}

		return c.Next()
	}
}
