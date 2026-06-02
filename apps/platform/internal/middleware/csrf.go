package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"strings"

	"github.com/cromatic-vision-optical/backend/internal/shared/response"
	"github.com/gofiber/fiber/v3"
)

const (
	csrfTokenLength = 32
	csrfCookieName  = "csrf_token"
	csrfHeaderName  = "X-CSRF-Token"
)

// CSRFProtection provides double-submit cookie CSRF protection.
// It sets a CSRF token in a readable cookie and requires the same token
// in the X-CSRF-Token header for state-changing requests.
func CSRFProtection(appEnv string) fiber.Handler {
	isProduction := appEnv == "production"

	return func(c fiber.Ctx) error {
		// Skip CSRF for safe methods (GET, HEAD, OPTIONS)
		method := strings.ToUpper(c.Method())
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			// Ensure CSRF cookie is set for subsequent requests
			ensureCSRFCookie(c, isProduction)
			return c.Next()
		}

		// Skip CSRF for webhook endpoints (authenticated via HMAC signatures)
		path := c.Path()
		if strings.Contains(path, "/webhooks/") {
			return c.Next()
		}

		// Skip CSRF if request uses Bearer token (API clients, not browser sessions)
		authHeader := c.Get("Authorization")
		if authHeader != "" && strings.HasPrefix(strings.ToLower(authHeader), "bearer ") {
			return c.Next()
		}

		// For cookie-based auth, validate CSRF token
		cookieToken := c.Cookies(csrfCookieName)
		headerToken := c.Get(csrfHeaderName)

		if cookieToken == "" || headerToken == "" {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("CSRF_ERROR", "CSRF token missing. Include X-CSRF-Token header."))
		}

		if subtle.ConstantTimeCompare([]byte(cookieToken), []byte(headerToken)) != 1 {
			c.Status(fiber.StatusForbidden)
			return c.JSON(response.Err("CSRF_ERROR", "CSRF token mismatch"))
		}

		return c.Next()
	}
}

func ensureCSRFCookie(c fiber.Ctx, isProduction bool) {
	existing := c.Cookies(csrfCookieName)
	if existing != "" {
		return
	}

	token := generateCSRFToken()
	c.Cookie(&fiber.Cookie{
		Name:     csrfCookieName,
		Value:    token,
		HTTPOnly: false, // Must be readable by JavaScript to include in headers
		Secure:   isProduction,
		SameSite: "Strict",
		Path:     "/",
	})
}

func generateCSRFToken() string {
	bytes := make([]byte, csrfTokenLength)
	_, _ = rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
