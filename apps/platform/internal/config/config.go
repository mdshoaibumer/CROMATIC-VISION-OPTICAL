// Package config provides environment-based application configuration
// with strict validation for production deployments. It loads values
// from environment variables (with .env file support) and enforces
// security constraints such as minimum JWT secret length and mandatory
// credential presence in production mode.
package config

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config represents the application configuration.
type Config struct {
	AppName string
	AppEnv  string
	AppPort string

	AllowedOrigins string

	PostgresHost     string
	PostgresPort     string
	PostgresUser     string
	PostgresPassword string
	PostgresDB       string
	PostgresSSLMode  string
	PostgresMaxConns int
	PostgresMinConns int

	RedisHost     string
	RedisPort     string
	RedisPassword string

	JWTSecret string

	StorageProvider   string
	S3Endpoint        string
	S3Region          string
	S3Bucket          string
	S3AccessKeyID     string
	S3SecretAccessKey string
	S3PublicURLPrefix string

	RazorpayKeyID         string
	RazorpayKeySecret     string
	RazorpayWebhookSecret string

	SMTPHost     string
	SMTPPort     string
	SMTPUser     string
	SMTPPassword string
	SMTPFrom     string
	AdminEmail   string
}

// Load loads config from environment variables and optionally parses a .env file.
func Load() (*Config, error) {
	// Try loading from .env file manually to minimize extra dependencies
	_ = LoadEnvFile(".env")

	appEnv := getEnv("APP_ENV", "development")
	isProd := appEnv == "production"

	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" && isProd {
		return nil, fmt.Errorf("CRITICAL: JWT_SECRET environment variable must be set in production")
	}
	if isProd && len(jwtSecret) < 32 {
		return nil, fmt.Errorf("CRITICAL: JWT_SECRET must be at least 32 characters in production")
	}
	if jwtSecret == "" {
		jwtSecret = "dev-only-insecure-jwt-secret-do-not-use-in-prod"
	}

	razorpayWebhookSecret := getEnv("RAZORPAY_WEBHOOK_SECRET", "")
	if isProd && razorpayWebhookSecret == "" {
		return nil, fmt.Errorf("CRITICAL: RAZORPAY_WEBHOOK_SECRET must be set in production")
	}

	// Strict production validations
	if isProd {
		required := map[string]string{
			"POSTGRES_PASSWORD": getEnv("POSTGRES_PASSWORD", ""),
			"POSTGRES_USER":     getEnv("POSTGRES_USER", ""),
			"POSTGRES_DB":       getEnv("POSTGRES_DB", ""),
			"ALLOWED_ORIGINS":   getEnv("ALLOWED_ORIGINS", ""),
			"STORAGE_PROVIDER":  getEnv("STORAGE_PROVIDER", ""),
		}
		for key, val := range required {
			if val == "" {
				return nil, fmt.Errorf("CRITICAL: %s must be set in production", key)
			}
		}
		// Storage provider must not be mock in production
		if required["STORAGE_PROVIDER"] == "mock" {
			return nil, fmt.Errorf("CRITICAL: STORAGE_PROVIDER cannot be 'mock' in production")
		}
		// ALLOWED_ORIGINS must not be wildcard in production
		if required["ALLOWED_ORIGINS"] == "*" {
			return nil, fmt.Errorf("CRITICAL: ALLOWED_ORIGINS cannot be '*' in production - specify explicit origins")
		}
	}

	return &Config{
		AppName: getEnv("APP_NAME", "cromatic-vision-api"),
		AppEnv:  appEnv,
		AppPort: getEnv("APP_PORT", "8080"),

		AllowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:3000"),

		PostgresHost:     getEnv("POSTGRES_HOST", "localhost"),
		PostgresPort:     getEnv("POSTGRES_PORT", "5432"),
		PostgresUser:     getEnv("POSTGRES_USER", "postgres"),
		PostgresPassword: getEnv("POSTGRES_PASSWORD", ""),
		PostgresDB:       getEnv("POSTGRES_DB", "cromatic_vision_db"),
		PostgresSSLMode: getEnv("POSTGRES_SSLMODE", func() string {
			if isProd {
				return "require"
			}
			return "disable"
		}()),
		PostgresMaxConns: getEnvInt("POSTGRES_MAX_CONNS", 25),
		PostgresMinConns: getEnvInt("POSTGRES_MIN_CONNS", 5),

		RedisHost:     getEnv("REDIS_HOST", "localhost"),
		RedisPort:     getEnv("REDIS_PORT", "6379"),
		RedisPassword: getEnv("REDIS_PASSWORD", ""),

		JWTSecret: jwtSecret,

		StorageProvider:   getEnv("STORAGE_PROVIDER", "mock"),
		S3Endpoint:        getEnv("S3_ENDPOINT", ""),
		S3Region:          getEnv("S3_REGION", "auto"),
		S3Bucket:          getEnv("S3_BUCKET", ""),
		S3AccessKeyID:     getEnv("S3_ACCESS_KEY_ID", ""),
		S3SecretAccessKey: getEnv("S3_SECRET_ACCESS_KEY", ""),
		S3PublicURLPrefix: getEnv("S3_PUBLIC_URL_PREFIX", ""),

		RazorpayKeyID:         getEnv("RAZORPAY_KEY_ID", ""),
		RazorpayKeySecret:     getEnv("RAZORPAY_KEY_SECRET", ""),
		RazorpayWebhookSecret: razorpayWebhookSecret,

		SMTPHost:     getEnv("SMTP_HOST", "localhost"),
		SMTPPort:     getEnv("SMTP_PORT", "587"),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		SMTPFrom:     getEnv("SMTP_FROM", "no-reply@cromaticvision.com"),
		AdminEmail:   getEnv("ADMIN_EMAIL", "admin@cromaticvision.com"),
	}, nil
}

// LoadEnvFile manually parses a simplified .env file and sets the variables in the environment if not already set.
func LoadEnvFile(filename string) error {
	file, err := os.Open(filename)
	if err != nil {
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		// Skip comments and empty lines
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])

		// Remove optional quotes
		if len(val) >= 2 && ((val[0] == '"' && val[len(val)-1] == '"') || (val[0] == '\'' && val[len(val)-1] == '\'')) {
			val = val[1 : len(val)-1]
		}

		// Set env if not already present
		if os.Getenv(key) == "" {
			_ = os.Setenv(key, val)
		}
	}
	return scanner.Err()
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	val := getEnv(key, "")
	if val == "" {
		return fallback
	}
	n, err := strconv.Atoi(val)
	if err != nil {
		return fallback
	}
	return n
}
