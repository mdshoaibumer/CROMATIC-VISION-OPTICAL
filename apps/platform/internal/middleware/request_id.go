package middleware

import (
	"context"

	"github.com/google/uuid"
	"github.com/gofiber/fiber/v3"
	"github.com/cromatic-vision-optical/backend/internal/logger"
)

const (
	// HeaderXRequestID is the standard name of Request ID header
	HeaderXRequestID = "X-Request-ID"
	// LocalsRequestIDKey is Fiber's local variable name for Request ID
	LocalsRequestIDKey = "request_id"
)

// RequestID returns a Fiber middleware that sets/retrieves a transaction ID
func RequestID() fiber.Handler {
	return func(c fiber.Ctx) error {
		// 1. Get from header or generate a new UUID
		reqID := c.Get(HeaderXRequestID)
		if reqID == "" {
			reqID = uuid.New().String()
		}

		// 2. Set response header so client receives it
		c.Set(HeaderXRequestID, reqID)

		// 3. Set in Fiber's local variables (safe thread context)
		c.Locals(LocalsRequestIDKey, reqID)

		// 4. Wrap the standard context to include Request ID for logging library
		ctx := c.UserContext()
		if ctx == nil {
			ctx = context.Background()
		}
		newCtx := logger.WithRequestID(ctx, reqID)
		c.SetUserContext(newCtx)

		return c.Next()
	}
}
