package middleware

import (
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
)

// RequestLogger returns a Fiber handler that logs HTTP requests using *slog.Logger
func RequestLogger(log *slog.Logger) fiber.Handler {
	return func(c fiber.Ctx) error {
		start := time.Now()
		path := c.Path()
		method := c.Method()

		// Execute the chain of routes
		err := c.Next()

		duration := time.Since(start)
		status := c.Response().StatusCode()
		reqID, _ := c.Locals(LocalsRequestIDKey).(string)

		// Create a dynamic, structured logging call
		logFields := []interface{}{
			"method", method,
			"path", path,
			"status", status,
			"duration_ms", duration.Milliseconds(),
			"request_id", reqID,
		}

		if err != nil {
			logFields = append(logFields, "error", err.Error())
			log.Error("HTTP request completed with error", logFields...)
		} else {
			if status >= 400 && status < 500 {
				log.Warn("HTTP request completed with warning status", logFields...)
			} else if status >= 500 {
				log.Error("HTTP request completed with server error status", logFields...)
			} else {
				log.Info("HTTP request completed", logFields...)
			}
		}

		return err
	}
}
