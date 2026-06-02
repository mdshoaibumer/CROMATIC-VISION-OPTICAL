package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
)

// SecurityHeaders adds defense-in-depth HTTP security headers at application level.
// These supplement nginx-level headers and ensure protection even without a reverse proxy.
// Caching is now context-aware: public catalog endpoints get browser caching,
// authenticated/admin endpoints get strict no-store.
func SecurityHeaders(env string) fiber.Handler {
	// CSP policy: allow self + required external resources
	csp := "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'"

	return func(c fiber.Ctx) error {
		c.Set("X-Content-Type-Options", "nosniff")
		c.Set("X-Frame-Options", "SAMEORIGIN")
		c.Set("X-XSS-Protection", "0") // Disabled per modern best practice (CSP preferred)
		c.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Set("Content-Security-Policy", csp)

		// Context-aware Cache-Control:
		// - Public read-only catalog endpoints: allow short browser caching
		// - Everything else: strict no-store for security
		path := c.Path()
		method := c.Method()

		if method == "GET" && isPublicCacheable(path) {
			c.Set("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
		} else {
			c.Set("Cache-Control", "no-store, no-cache, must-revalidate, private")
			c.Set("Pragma", "no-cache")
		}

		// HSTS in production (even at app level as defense-in-depth)
		if env == "production" {
			c.Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		}

		return c.Next()
	}
}

// isPublicCacheable determines if a path serves public catalog data safe to cache.
func isPublicCacheable(path string) bool {
	publicPrefixes := []string{
		"/api/v1/categories",
		"/api/v1/products",
	}
	for _, prefix := range publicPrefixes {
		if strings.HasPrefix(path, prefix) {
			return true
		}
	}
	return false
}
