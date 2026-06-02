package database

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// DB wraps pgxpool.Pool and exposes helpers
type DB struct {
	Pool *pgxpool.Pool
	log  *slog.Logger
}

// Connect initializes a connection pool and pings the PostgreSQL database
func Connect(ctx context.Context, host, port, user, password, dbname string, log *slog.Logger) (*DB, error) {
	connString := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbname)

	// Since security might require keeping password hidden in startup logs:
	log.Info("Connecting to PostgreSQL", "host", host, "port", port, "database", dbname)

	config, err := pgxpool.ParseConfig(connString)
	if err != nil {
		return nil, fmt.Errorf("unable to parse connection string: %w", err)
	}

	// Dynamic sizing of the pool
	config.MaxConns = 25
	config.MinConns = 5
	config.MaxConnIdleTime = 15 * time.Minute
	config.MaxConnLifetime = 1 * time.Hour

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

	log.Info("Successful connection to PostgreSQL!")

	return &DB{
		Pool: pool,
		log:  log,
	}, nil
}

// Close gracefully closes the pgx pool
func (db *DB) Close() {
	if db.Pool != nil {
		db.log.Info("Closing PostgreSQL connection pool...")
		db.Pool.Close()
		db.log.Info("PostgreSQL connection pool closed successfully")
	}
}
