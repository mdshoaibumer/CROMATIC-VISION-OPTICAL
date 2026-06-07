// Package database manages PostgreSQL connection pooling via pgxpool.
// It supports functional options for tuning pool parameters (max/min connections)
// and includes automatic health checks and structured logging of pool metrics.
package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps pgxpool.Pool and exposes helpers for query execution and lifecycle management.
type DB struct {
	Pool *pgxpool.Pool
	log  *slog.Logger
}

// Connect initializes a connection pool and pings the PostgreSQL database
func Connect(ctx context.Context, host, port, user, password, dbname, sslmode string, log *slog.Logger, opts ...PoolOption) (*DB, error) {
	if sslmode == "" {
		sslmode = "require"
	}
	connString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		user, password, host, port, dbname, sslmode)

	// Since security might require keeping password hidden in startup logs:
	log.Info("Connecting to PostgreSQL", "host", host, "port", port, "database", dbname)

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %w", err)
	}

	// Default pool configuration (can be overridden via opts)
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnIdleTime = 15 * time.Minute
	config.MaxConnLifetime = 1 * time.Hour
	config.HealthCheckPeriod = 30 * time.Second

	// Apply overrides
	for _, opt := range opts {
		opt(config)
	}

	pool, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create pgx pool: %w", err)
	}

	// Ping with a timeout to verify connection
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if err := pool.Ping(pingCtx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping PostgreSQL: %w", err)
	}

	log.Info("Successful connection to PostgreSQL!",
		"max_conns", config.MaxConns,
		"min_conns", config.MinConns,
		"max_conn_lifetime", config.MaxConnLifetime,
	)

	return &DB{
		Pool: pool,
		log:  log,
	}, nil
}

// PoolOption allows customizing the pgxpool configuration
type PoolOption func(*pgxpool.Config)

// WithMaxConns sets the maximum number of connections in the pool
func WithMaxConns(n int32) PoolOption {
	return func(c *pgxpool.Config) {
		if n > 0 {
			c.MaxConns = n
		}
	}
}

// WithMinConns sets the minimum number of connections maintained in the pool
func WithMinConns(n int32) PoolOption {
	return func(c *pgxpool.Config) {
		if n >= 0 {
			c.MinConns = n
		}
	}
}

// Close gracefully closes the pgx pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.log.Info("Closing PostgreSQL connection pool...")
		db.Pool.Close()
		db.log.Info("PostgreSQL connection pool closed successfully")
	}
}
