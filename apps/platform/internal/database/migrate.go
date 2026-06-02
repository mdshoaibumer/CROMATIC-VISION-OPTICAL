package database

import (
	"errors"
	"fmt"
	"log/slog"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

// RunMigrations executes all pending database migrations
func RunMigrations(host, port, user, password, dbname string, log *slog.Logger) error {
	connStr := fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=disable",
		user, password, host, port, dbname)

	m, err := migrate.New("file://db/migrations", connStr)
	if err != nil {
		return fmt.Errorf("failed to create migrate instance: %w", err)
	}
	defer m.Close()

	log.Info("Running database migrations...")

	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Info("Database migrations: no pending changes")
			return nil
		}
		return fmt.Errorf("migration failed: %w", err)
	}

	version, dirty, _ := m.Version()
	log.Info("Database migrations applied successfully", "version", version, "dirty", dirty)
	return nil
}
