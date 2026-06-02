package middleware

import (
	"fmt"
	"log/slog"
	"runtime/debug"

	"github.com/gofiber/fiber/v3"
	"github.com/cromatic-vision-optical/backend/internal/shared/response"
)

// Recovery returns a Fiber middleware that recovers from any panics gracefully
func Recovery(log *slog.Logger) fiber.Handler {
	return func(c fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				errVal := fmt.Sprintf("%v", r)
				reqID, _ := c.Locals(LocalsRequestIDKey).(string)
				stackTrace := string(debug.Stack())

				// Log structured panic detail
				log.Error("Critical server panic caught and recovered",
					"error", errVal,
					"request_id", reqID,
					"stack", stackTrace,
				)

				// Clear headers and return JSON structured response
				c.Status(fiber.StatusInternalServerError)
				_ = c.JSON(response.Err("PANIC_RECOVERED", "An unexpected server error occurred. Please contact service support."))
			}
		}()

		return c.Next()
	}
}
