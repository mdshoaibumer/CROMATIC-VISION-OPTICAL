package middleware

import (
	"encoding/json"
	"log/slog"
	"time"

	"github.com/gofiber/fiber/v3"
)

// AuditEvent represents a single auditable action performed by an administrator or system
type AuditEvent struct {
	Timestamp  time.Time       `json:"timestamp"`
	RequestID  string          `json:"request_id"`
	UserID     string          `json:"user_id"`
	Role       string          `json:"role"`
	Action     string          `json:"action"`
	Resource   string          `json:"resource"`
	ResourceID string          `json:"resource_id,omitempty"`
	Method     string          `json:"method"`
	Path       string          `json:"path"`
	StatusCode int             `json:"status_code"`
	IP         string          `json:"ip"`
	UserAgent  string          `json:"user_agent"`
	Duration   time.Duration   `json:"duration_ms"`
	Details    json.RawMessage `json:"details,omitempty"`
}

// AuditLogger logs all mutating (POST/PUT/DELETE) actions performed by authenticated users.
// This creates an immutable audit trail for compliance and security forensics.
func AuditLogger(log *slog.Logger) fiber.Handler {
	return func(c fiber.Ctx) error {
		method := c.Method()

		// Only audit mutating operations
		if method == "GET" || method == "HEAD" || method == "OPTIONS" {
			return c.Next()
		}

		start := time.Now()

		// Execute the request
		err := c.Next()

		duration := time.Since(start)
		statusCode := c.Response().StatusCode()

		// Extract user context (set by AuthMiddleware)
		userID, _ := c.Locals("user_id").(string)
		role, _ := c.Locals("role").(string)
		requestID, _ := c.Locals("request_id").(string)

		// Determine the resource and action from the path
		resource, resourceID, action := classifyAction(method, c.Path())

		event := AuditEvent{
			Timestamp:  start.UTC(),
			RequestID:  requestID,
			UserID:     userID,
			Role:       role,
			Action:     action,
			Resource:   resource,
			ResourceID: resourceID,
			Method:     method,
			Path:       c.Path(),
			StatusCode: statusCode,
			IP:         c.IP(),
			UserAgent:  c.Get("User-Agent"),
			Duration:   duration,
		}

		// Log as structured JSON for ingestion by log aggregators
		log.Info("AUDIT",
			"event", "audit_trail",
			"timestamp", event.Timestamp.Format(time.RFC3339),
			"request_id", event.RequestID,
			"user_id", event.UserID,
			"role", event.Role,
			"action", event.Action,
			"resource", event.Resource,
			"resource_id", event.ResourceID,
			"method", event.Method,
			"path", event.Path,
			"status_code", event.StatusCode,
			"ip", event.IP,
			"user_agent", event.UserAgent,
			"duration_ms", duration.Milliseconds(),
		)

		return err
	}
}

// classifyAction extracts a human-readable action, resource type, and resource ID from the request path.
func classifyAction(method, path string) (resource, resourceID, action string) {
	// Parse path segments: /api/v1/admin/products/123/images/456
	segments := splitPath(path)

	// Find the resource name (last non-numeric segment before potential ID)
	resource = "unknown"
	resourceID = ""
	action = method

	for i := len(segments) - 1; i >= 0; i-- {
		seg := segments[i]
		if isResourceName(seg) {
			resource = seg
			// Check if next segment is an ID
			if i+1 < len(segments) {
				resourceID = segments[i+1]
			}
			break
		}
	}

	// Map HTTP method to action verb
	switch method {
	case "POST":
		action = "create"
	case "PUT", "PATCH":
		action = "update"
	case "DELETE":
		action = "delete"
	}

	// Refine action for specific paths
	if contains(segments, "status") {
		action = "update_status"
	}
	if contains(segments, "login") {
		action = "login"
		resource = "auth"
	}
	if contains(segments, "register") {
		action = "register"
		resource = "auth"
	}
	if contains(segments, "logout") {
		action = "logout"
		resource = "auth"
	}
	if contains(segments, "images") && method == "POST" {
		action = "upload_image"
	}
	if contains(segments, "images") && method == "DELETE" {
		action = "delete_image"
	}

	return resource, resourceID, action
}

func splitPath(path string) []string {
	var segments []string
	current := ""
	for _, ch := range path {
		if ch == '/' {
			if current != "" {
				segments = append(segments, current)
			}
			current = ""
		} else {
			current += string(ch)
		}
	}
	if current != "" {
		segments = append(segments, current)
	}
	return segments
}

func isResourceName(s string) bool {
	// Resource names are alphabetic (not numeric IDs or UUIDs)
	if s == "" {
		return false
	}
	for _, ch := range s {
		if ch >= '0' && ch <= '9' {
			return false
		}
		if ch == '-' {
			// Could be UUID segment
			return false
		}
	}
	// Skip version prefixes and common path elements
	switch s {
	case "api", "v1", "v2", "admin", "status", "download", "verify", "images":
		return false
	}
	return true
}

func contains(segments []string, target string) bool {
	for _, s := range segments {
		if s == target {
			return true
		}
	}
	return false
}
