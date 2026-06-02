package middleware

import (
	"github.com/gofiber/fiber/v3"
)

// SecurityHeaders adds defense-in-depth HTTP security headers at application level.
// These supplement nginx-level headers and ensure protection even without a reverse proxy.
func SecurityHeaders() fiber.Handler {
	return func(c fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "SAMEORIGIN")
		c.Set("X-XSS-Protection", "0") // Disabled per modern best practice (CSP preferred)
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
		c.Set("Pragma", "no-cache")

		return c.Next()
	}
}
