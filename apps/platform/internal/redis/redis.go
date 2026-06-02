package redis

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisClient wraps redis.Client and provides standard handles
type RedisClient struct {
	Client *redis.Client
	log    *slog.Logger
}

// Connect initializes and checks a Redis connection
func Connect(ctx context.Context, host, port, password string, log *slog.Logger) (*RedisClient, error) {
	addr := fmt.Sprintf("%s:%s", host, port)
	log.Info("Connecting to Redis", "addr", addr)

	client := redis.NewClient(&redis.Options{
		Addr:            addr,
		Password:        password,
		DB:              0, // default DB
		PoolSize:        10,
		MinIdleConns:    3,
		MaxIdleConns:    5,
		ConnMaxIdleTime: 5 * time.Minute,
	})

	// Ping using a short timeout context to verify connection
	pingCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	if _, err := client.Ping(pingCtx).Result(); err != nil {
		client.Close()
		return nil, fmt.Errorf("failed to ping Redis: %w", err)
	}

	log.Info("Successful connection to Redis!")

	return &RedisClient{
		Client: client,
		log:    log,
	}, nil
}

// Close gracefully closes the redis connection
func (r *RedisClient) Close() {
	if r.Client != nil {
		r.log.Info("Closing Redis client...")
		if err := r.Client.Close(); err != nil {
			r.log.Error("Failed to close Redis client gracefully", "error", err)
		} else {
			r.log.Info("Redis client closed successfully")
		}
	}
}
