# ==============================================================================
# Cromatic Vision Optical - Production Container Image
# Multi-stage build: Go binary compilation + minimal Alpine runtime
# Includes container HEALTHCHECK for orchestrator-level liveness probing
# ==============================================================================

# ==============================================================================
# Build Stage
# ==============================================================================
FROM golang:1.26-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git make build-base

# Set current working directory
WORKDIR /app

# Copy dependency manifests
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source tree
COPY . .

# Build fully statically compiled executable (-ldflags="-s -w" cuts debugging symbols and halves binary size)
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /cromatic-vision-backend cmd/server/main.go

# ==============================================================================
# Runner Stage
# ==============================================================================
FROM alpine:3.19 AS runner

# Install security updates & ca-certificates
RUN apk add --no-cache ca-certificates tzdata wget

# Create dedicated system group and application user
RUN addgroup -S cromaticgrp && adduser -S cromaticuser -G cromaticgrp

# Set directory layout
WORKDIR /app

# Copy compiled application binary
COPY --from=builder /cromatic-vision-backend ./server

# Copy database migrations for auto-migration on startup
COPY --from=builder /app/db/migrations ./db/migrations

# Ensure non-root ownership of executable
RUN chown -R cromaticuser:cromaticgrp /app

# Change context to the safe, underprivileged, non-root user
USER cromaticuser

# Expose standard service gateway port
EXPOSE 8080

# Container health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/v1/health/live || exit 1

# Specify backend startup command
ENTRYPOINT ["./server"]
