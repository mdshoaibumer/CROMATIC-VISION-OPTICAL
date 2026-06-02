package logger

import (
	"context"
	"log/slog"
	"os"
)

type contextKey string

const (
	// RequestIDKey is the context key for Request ID
	RequestIDKey contextKey = "request_id"
)

// LogHandler wrapping slog handler to automatically include Request ID if present
type LogHandler struct {
	slog.Handler
}

// Handle overrides the default slog handler to attach Request ID from context to log records
func (h *LogHandler) Handle(ctx context.Context, r slog.Record) error {
	if ctx != nil {
		if reqID, ok := ctx.Value(RequestIDKey).(string); ok && reqID != "" {
			r.AddAttrs(slog.String("request_id", reqID))
		}
	}
	return h.Handler.Handle(ctx, r)
}

// InitLogger sets up and returns a custom structured slog.Logger
func InitLogger(env string) *slog.Logger {
	var baseHandler slog.Handler
	
	if env == "production" {
		baseHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelInfo,
		})
	} else {
		// Use structured JSON with Debug level for development/test, or standard text for local readability
		baseHandler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
			Level: slog.LevelDebug,
		})
	}

	customHandler := &LogHandler{Handler: baseHandler}
	logger := slog.New(customHandler)
	slog.SetDefault(logger)
	
	return logger
}

// WithRequestID adds Request ID to a context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, RequestIDKey, requestID)
}

// GetRequestID retrieves Request ID from a context
func GetRequestID(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if id, ok := ctx.Value(RequestIDKey).(string); ok {
		return id
	}
	return ""
}
