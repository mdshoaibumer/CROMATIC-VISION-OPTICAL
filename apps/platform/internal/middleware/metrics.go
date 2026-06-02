package middleware

import (
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/gofiber/fiber/v3"
)

// Metrics holds application-level metrics for monitoring
type Metrics struct {
	TotalRequests    atomic.Int64
	TotalErrors      atomic.Int64
	ActiveRequests   atomic.Int64
	RequestDurations sync.Map // path -> []time.Duration (kept as rolling window)
	StatusCounts     sync.Map // status_code -> count
	StartTime        time.Time
}

// GlobalMetrics is the singleton metrics collector
var GlobalMetrics = &Metrics{
	StartTime: time.Now(),
}

// MetricsCollector middleware records request metrics
func MetricsCollector() fiber.Handler {
	return func(c fiber.Ctx) error {
		GlobalMetrics.ActiveRequests.Add(1)
		start := time.Now()

		err := c.Next()

		duration := time.Since(start)
		status := c.Response().StatusCode()

		GlobalMetrics.TotalRequests.Add(1)
		GlobalMetrics.ActiveRequests.Add(-1)

		if status >= 400 {
			GlobalMetrics.TotalErrors.Add(1)
		}

		// Track status codes
		statusKey := strconv.Itoa(status)
		if val, ok := GlobalMetrics.StatusCounts.Load(statusKey); ok {
			count := val.(*atomic.Int64)
			count.Add(1)
		} else {
			counter := &atomic.Int64{}
			counter.Add(1)
			GlobalMetrics.StatusCounts.Store(statusKey, counter)
		}

		// Track request durations per path (simplified)
		_ = duration

		return err
	}
}

// MetricsHandler exposes metrics in Prometheus text format
func MetricsHandler() fiber.Handler {
	return func(c fiber.Ctx) error {
		uptime := time.Since(GlobalMetrics.StartTime).Seconds()
		totalReqs := GlobalMetrics.TotalRequests.Load()
		totalErrs := GlobalMetrics.TotalErrors.Load()
		activeReqs := GlobalMetrics.ActiveRequests.Load()

		var output string
		output += "# HELP cromatic_uptime_seconds Time since server start in seconds\n"
		output += "# TYPE cromatic_uptime_seconds gauge\n"
		output += "cromatic_uptime_seconds " + strconv.FormatFloat(uptime, 'f', 2, 64) + "\n\n"

		output += "# HELP cromatic_http_requests_total Total number of HTTP requests\n"
		output += "# TYPE cromatic_http_requests_total counter\n"
		output += "cromatic_http_requests_total " + strconv.FormatInt(totalReqs, 10) + "\n\n"

		output += "# HELP cromatic_http_errors_total Total number of HTTP error responses (4xx + 5xx)\n"
		output += "# TYPE cromatic_http_errors_total counter\n"
		output += "cromatic_http_errors_total " + strconv.FormatInt(totalErrs, 10) + "\n\n"

		output += "# HELP cromatic_http_active_requests Current number of active HTTP requests\n"
		output += "# TYPE cromatic_http_active_requests gauge\n"
		output += "cromatic_http_active_requests " + strconv.FormatInt(activeReqs, 10) + "\n\n"

		output += "# HELP cromatic_http_requests_by_status Total requests per HTTP status code\n"
		output += "# TYPE cromatic_http_requests_by_status counter\n"
		GlobalMetrics.StatusCounts.Range(func(key, value interface{}) bool {
			statusCode := key.(string)
			count := value.(*atomic.Int64)
			output += "cromatic_http_requests_by_status{code=\"" + statusCode + "\"} " + strconv.FormatInt(count.Load(), 10) + "\n"
			return true
		})

		c.Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		return c.SendString(output)
	}
}
