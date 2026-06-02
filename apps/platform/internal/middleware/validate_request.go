package middleware

import (
	"github.com/gofiber/fiber/v3"
)

// MaxRequestBodySize enforces a maximum request body size for specific routes.
// This provides defense-in-depth beyond Fiber's global BodyLimit.
func MaxRequestBodySize(maxBytes int64) fiber.Handler {
	return func(c fiber.Ctx) error {
		if c.Request().Header.ContentLength() > int(maxBytes) {
			c.Status(fiber.StatusRequestEntityTooLarge)
			return c.JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "PAYLOAD_TOO_LARGE",
					"message": "Request body exceeds maximum allowed size",
				},
			})
		}
		return c.Next()
	}
}

// ValidateContentType ensures that POST/PUT/PATCH requests carry the expected Content-Type.
// Rejects requests with missing or incorrect content types to prevent content-type confusion attacks.
func ValidateContentType(allowedTypes ...string) fiber.Handler {
	if len(allowedTypes) == 0 {
		allowedTypes = []string{"application/json"}
	}

	allowed := make(map[string]bool, len(allowedTypes))
	for _, t := range allowedTypes {
		allowed[t] = true
	}

	return func(c fiber.Ctx) error {
		method := c.Method()

		// Only validate on methods that carry a body
		if method != "POST" && method != "PUT" && method != "PATCH" {
			return c.Next()
		}

		// Skip if no body present
		if c.Request().Header.ContentLength() == 0 {
			return c.Next()
		}

		contentType := c.Get("Content-Type")

		// Extract base content-type (strip charset and boundary parameters)
		baseType := extractBaseContentType(contentType)

		if baseType == "" || !allowed[baseType] {
			c.Status(fiber.StatusUnsupportedMediaType)
			return c.JSON(fiber.Map{
				"success": false,
				"error": fiber.Map{
					"code":    "UNSUPPORTED_MEDIA_TYPE",
					"message": "Content-Type must be one of: " + joinTypes(allowedTypes),
				},
			})
		}

		return c.Next()
	}
}

// extractBaseContentType strips parameters like charset from content-type header
func extractBaseContentType(ct string) string {
	for i, ch := range ct {
		if ch == ';' || ch == ' ' {
			return ct[:i]
		}
	}
	return ct
}

func joinTypes(types []string) string {
	result := ""
	for i, t := range types {
		if i > 0 {
			result += ", "
		}
		result += t
	}
	return result
}
