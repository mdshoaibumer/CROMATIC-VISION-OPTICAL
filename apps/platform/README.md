# 🕶️ Cromatic Vision Optical — Production-Grade Go Backend Foundation (Phase 1)

Welcome to the **Cromatic Vision Optical Backend**, a robust, production-ready RESTful JSON API skeleton for a modern, high-performance eyewear e-commerce platform. 

This repository leverages **Go 1.23+**, **Fiber v3**, **PostgreSQL**, **Redis**, and **Docker** to establish a high-concurrency architecture organized around strict **Clean Architecture / Hexagonal Design** principles. It comes prepared with type-safe database queries via **SQLC**, automated standard database adjustments via **golang-migrate**, transactional logging with **slog**, and fully isolated Virtual Sandbox environments.

---

## 🏗️ Clean Architecture Organization

This codebase enforces strict isolation of concerns. Layers only reference inward, ensuring core domain policies have zero dependencies on external HTTP adapters, database endpoints, or specific caching providers.

```text
├── cmd/
│   └── server/
│       └── main.go                  # Application entry point. Minimal bootstrap.
├── db/
│   ├── migrations/                  # Standard golang-migrate DDL up/down files.
│   └── queries/                     # SQLC DML statement declarations (users, products, orders).
├── internal/
│   ├── app/
│   │   └── app.go                   # Primary App orchestrator (Loads DB, cache, hooks middlewares).
│   ├── api/
│   │   ├── routes/
│   │   │   └── routes.go            # Gateway Router. Registers groups and wireups handlers.
│   │   └── v1/
│   │       └── health.go            # Microservices Health and Readiness controllers.
│   ├── config/
│   │   └── config.go                # Env-based Configurations parser with default fallbacks.
│   ├── database/
│   │   ├── database.go              # PostgreSQL pgx/v5 connection pool management.
│   │   └── sqlc/                    # Target generated SQLC type-safe code layers. [DO NOT EDIT]
│   ├── logger/
│   │   └── logger.go                # Custom log/slog wrapped logger with Request ID context injection.
│   ├── middleware/
│   │   ├── cors.go                  # Security header rules CORS configuration handler.
│   │   ├── logger.go                # Request metrics recording middleware.
│   │   ├── recovery.go              # Panic capture wrapper returning uniform error schemas.
│   │   └── request_id.go            # Transaction flow UUID builder (X-Request-ID).
│   ├── redis/
│   │   └── redis.go                 # Redis go-redis/v9 pool initialization and checks.
│   └── shared/
│       └── response/
│           └── response.go          # Standard OK / Err JSON schema generators.
├── test/
│   └── integration/
│       └── health_test.go           # High-fidelity integrated controller assertions.
├── Dockerfile                       # Multi-stage security-hardened Alpine container runner.
├── docker-compose.yml               # PostgreSQL, Redis Cache, Adminer and Service Stack.
├── go.mod                           # Go module definition sheet.
├── Makefile                         # Unified Console containing common developer actions.
├── sqlc.yaml                        # Configuration specifications for SQLC generation engine.
└── .env.example                     # Example environment parameters.
```

---

## ⚙️ Core Stack & Tooling

Key technologies backing the platform:
- **Go 1.23+**: High-efficiency, memory-safe compiled systems programming.
- **Fiber v3 (beta.3)**: Express-inspired HTTP routing engine optimized for raw performance and zero allocations.
- **pgx/v5**: Advanced PostgreSQL driver and connection pooling provider. Handles native typing safely.
- **SQLC**: Generates type-safe Go boilerplate code directly from SQL queries. Completely eliminates human-written query mapping errors.
- **go-redis/v9**: High-performance, connection-pooled caching and rate-limiting wrapper.
- **golang-migrate**: Dynamic, incremental database schema migrations.
- **slog**: Go standard JSON structured logging.

---

## 🌐 API Response Standardization

All response payloads adhere to predictable, uniform JSON standards to guarantee clients receive structurally consistent outcomes:

### 🟢 Successful Payload Format
On HTTP `2xx`, structural response payload:
```json
{
  "success": true,
  "data": {
    "item": "眼鏡",
    "updated_at": "2026-05-30T15:10:59Z"
  },
  "message": "Resource requested successfully"
}
```

### 🔴 Error Payload Format
On HTTP `4xx` or `5xx`, structural responses are returned inside standard wrapper fields:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "We encountered an unexpected error processing your parameters."
  }
}
```

---

## 🚀 Quick Start Guide

### 📂 Prerequisites
Make sure you have the following installed on your target machine:
1. [Go 1.23+](https://go.dev/doc/install)
2. [Docker Desktop](https://www.docker.com/products/docker-desktop/)
3. [sqlc CLI](https://docs.sqlc.dev/en/latest/overview/install.html) (Optional, for regenerating queries)
4. [golang-migrate CLI](https://github.com/golang-migrate/migrate/tree/master/cmd/migrate) (Optional, for database runs)

---

### 🐳 Sandbox Docker Compose Spinup (Recommended)

Boot up the entire multi-container architecture in detached mode with one command:
```bash
docker compose up -d --build
```
This automatically downloads, configures, and boots:
* **PostgreSQL (Port 5432)** with persistent storage volume mapping.
* **Redis Cache (Port 6379)** for transactional caching and data keys.
* **Database Administrator tool (Adminer at http://localhost:8080)**.
* **Cromatic Vision Optical API Gateway (Port 3000)** awaiting REST client bindings.

To bring down and purge the sandbox environment:
```bash
docker compose down -v
```

---

### 🖥️ Local Native Development Setup

1. **Clone & Set Environment Variables:**
   Create your environment parameter sheet from the template:
   ```bash
   cp .env.example .env
   ```

2. **Spin Up Supporting Databases (Local Postgres & Redis only):**
   ```bash
   docker compose up -d postgres redis
   ```

3. **Install Go Module Dependencies:**
   ```bash
   go mod download
   ```

4. **Apply Schema Migrations:**
   Apply database tables Up schema scripts natively:
   ```bash
   make migrate-up
   ```

5. **Execute Local Server Run:**
   ```bash
   make run
   ```
   The platform boots on `http://localhost:3000`. You can trace structured slog outputs printed beautifully in JSON format inside the terminal.

---

## 🛠️ Unified Makefile Target Commands

The root level `Makefile` automates standard workflows. Run `make help` to see all:
* `make run`: Boot the application locally.
* `make build`: Statically build compilation binaries to output path `/bin/server`.
* `make test`: Run integration and unit assertions.
* `make lint`: Run code validation rules via standard Go analyzers.
* `make sqlc`: Compile queries mapping schemas to `/internal/database/sqlc`.
* `make migrate-up`: Commit all physical pending SQL upgrades.
* `make migrate-down`: Drop/revert the most recent database modification schema.

---

## 🩺 System Health Inspection Endpoints

Use CURL or any REST client to verify gateway container orchestration systems:

### 🟢 Liveness Check
* **Path:** `GET /api/v1/health/live`
* **Response Body (`200 OK`):**
```json
{
  "status": "alive",
  "service": "cromatic-vision-api"
}
```

### 🟡 Readiness Check (Connectivity Checks)
Checks active network sockets for PostgreSQL and Redis pools.
* **Path:** `GET /api/v1/health/ready`
* **Healthy Response Body (`200 OK`):**
```json
{
  "status": "ready",
  "service": "cromatic-vision-api",
  "version": "0.1.0",
  "postgres": "connected",
  "redis": "connected",
  "timestamp": "2026-05-30T15:10:59Z"
}
```
* **Degraded Response Body (`503 Service Unavailable`):**
```json
{
  "status": "degraded",
  "service": "cromatic-vision-api",
  "version": "0.1.0",
  "postgres": "disconnected: dial tcp 127.0.0.1:5432: connect: connection refused",
  "redis": "connected",
  "timestamp": "2026-05-30T15:10:59Z"
}
```

---

## 🛡️ Middlewares Specification

1. **Request ID Middleware:**
   Generates a unique transaction flow ID (`X-Request-ID`) using UUID strings for every inbound HTTP route. Appends the identifier to the HTTP response header and sets context variables so log operations can pull, pair, and debug logs natively.

2. **Structured Log Middleware:**
   Records completion statistics for every transaction matching JSON telemetry schemas inside `slog`. Tracks HTTP Verb, Complete Route, HTTP Status Code, Request Duration (in ms), and mapped `X-Request-ID`.

3. **Global CORS Middleware:**
   Sanitizes and enforces access constraints. Configurable via origin strings or wildcard parameters.

4. **Server Recovery Middleware:**
   Intercepts critical runtime failures and thread panic. Writes the runtime traceback debug log cleanly to standard error output and blocks raw platform telemetry exposure by serving sanitised uniform `PANIC_RECOVERED` error payloads to clients.
