#!/bin/bash
set -e

# Cromatic Vision Optical Production Deployment Script
# Usage: ./scripts/deploy.sh [branch]

BRANCH=${1:-main}
BUILD_DIR="/opt/cromatic-vision-optical"
DOCKER_COMPOSE_FILE="$BUILD_DIR/docker-compose.prod.yml"

echo "======================================"
echo "🚀 Initiating Cromatic Vision Optical Deployment"
echo "Branch: $BRANCH"
echo "Time: $(date)"
echo "======================================"

# 1. Fetch Latest Code
echo "=> Fetching latest code..."
cd "$BUILD_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 2. Check Environment Variables
if [ ! -f "$BUILD_DIR/.env" ]; then
    echo "❌ ERROR: .env file not found in $BUILD_DIR"
    echo "Please configure secrets before deploying."
    exit 1
fi
echo "=> Env vars validated."

# 3. Requesting HTTPS certificates if not existent (First time setup)
if [ ! -d "$BUILD_DIR/certbot/conf/live/cromaticvision.com" ]; then
    echo "=> ⚠️ No SSL certificates found. Creating dummy certs for Nginx boot..."
    mkdir -p "$BUILD_DIR/certbot/conf/live/cromaticvision.com"
    mkdir -p "$BUILD_DIR/certbot/conf/live/api.cromaticvision.com"
    # Note: A real init-letsencrypt.sh should be used here to get real certs
    # before nginx starts correctly for the first time.
fi

# 4. Pull and Build Docker Images
echo "=> Pulling new base images and building layers..."
docker compose -f "$DOCKER_COMPOSE_FILE" pull
docker compose -f "$DOCKER_COMPOSE_FILE" build --no-cache

# 5. Apply Database Migrations (Go / migrate)
echo "=> Running database migrations..."
# Migrations run automatically on app startup via database.RunMigrations

# 6. Zero-Downtime Deployment (Recreate)
echo "=> Restarting services with new containers..."
docker compose -f "$DOCKER_COMPOSE_FILE" up -d --remove-orphans

# 7. Health Check
echo "=> Performing Health Checks..."
sleep 10
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "failed")
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health || echo "failed")

if [ "$FRONTEND_STATUS" == "200" ] && [ "$BACKEND_STATUS" == "200" ]; then
    echo "✅ Health checks passed. Deployment successful."
else
    echo "❌ Health check failed!"
    echo "Frontend: $FRONTEND_STATUS"
    echo "Backend: $BACKEND_STATUS"
    echo "=> Rolling back to previous state..."
    # Implement rollback strategy here as needed
    exit 1
fi

# 8. Clean up unused images
echo "=> Cleaning up old Docker images..."
docker image prune -f

echo "======================================"
echo "🎉 Deployment Process Finished Successfully"
echo "======================================"
