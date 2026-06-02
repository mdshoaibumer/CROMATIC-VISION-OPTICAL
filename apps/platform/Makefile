# ==============================================================================
# Cromatic Vision Optical - Backend Command Console
# ==============================================================================

.PHONY: help run build test docker-up docker-down sqlc migrate-up migrate-down migrate-create lint deps

# Default action is showing the available Makefile commands
help:
	@echo "=============================================================================="
	@echo " Cromatic Vision Optical - CLI Tooling Help"
	@echo "=============================================================================="
	@echo "Local Development:"
	@echo "  make run             - Runs the Go server locally with .env configuration"
	@echo "  make dev             - Runs dev server (in-memory, NO Docker required)"
	@echo "  make build           - Compiles server executables to /bin directory"
	@echo "  make test            - Executes standard unit and integration checks"
	@echo "  make lint            - Code validation utilizing 'go vet' and custom linters"
	@echo "  make deps            - Downloads and verifies Go module dependencies"
	@echo ""
	@echo "Docker Container Infrastructure:"
	@echo "  make docker-up       - Boots up Postgres, Redis, App and Adminer containers"
	@echo "  make docker-down     - Takes down and destroys container infrastructure"
	@echo ""
	@echo "Database SQLC Generation:"
	@echo "  make sqlc            - Regenerates Go safe type SQL binding layers via sqlc.yaml"
	@echo ""
	@echo "Database Migrations (golang-migrate):"
	@echo "  make migrate-create  - Scaffolds a new up/down SQL file set under db/migrations/"
	@echo "  make migrate-up      - Run all pending database schema modifications"
	@echo "  make migrate-down    - Reverts the most recent schema script (Down)"
	@echo "=============================================================================="

# 1. Hot run
run:
	go run cmd/server/main.go

# 1b. Dev server (in-memory, no Docker/Postgres/Redis required)
dev:
	go run cmd/devserver/main.go

# 2. Compile binary
build:
	mkdir -p bin
	go build -ldflags="-s -w" -o bin/server cmd/server/main.go

# 3. Test suites
test:
	go test -v ./...

# 4. Codestyle check
lint:
	go vet ./...

# 5. Boot entire system Docker Compose
docker-up:
	docker compose up -d --build

# 6. Stop and destroy system containers
docker-down:
	docker compose down -v

# 7. SQLC generation task
sqlc:
	sqlc generate

# 8. Database up transformations
migrate-up:
	migrate -path db/migrations -database "postgres://$${POSTGRES_USER:-cromatic_user}:$${POSTGRES_PASSWORD}@$${POSTGRES_HOST:-localhost}:$${POSTGRES_PORT:-5432}/$${POSTGRES_DB:-cromatic_vision_db}?sslmode=disable" -verbose up

# 9. Database down migrations
migrate-down:
	migrate -path db/migrations -database "postgres://$${POSTGRES_USER:-cromatic_user}:$${POSTGRES_PASSWORD}@$${POSTGRES_HOST:-localhost}:$${POSTGRES_PORT:-5432}/$${POSTGRES_DB:-cromatic_vision_db}?sslmode=disable" -verbose down 1

# 10. Generate migration files templates
migrate-create:
	@read -p "Enter migration name (e.g., add_users_email): " name; \
	migrate create -ext sql -dir db/migrations -seq $$name

# 11. Download and verify module dependencies (generates go.sum)
deps:
	go mod download
	go mod verify
	go mod tidy
