#!/bin/bash

# Cromatic Vision Optical Database Backup Script
# Typically run via cronjob: 0 2 * * * /opt/Cromatic Vision Optical/scripts/backup.sh
# Requires aws-cli or rclone configured for R2/S3 upload

set -e

BACKUP_DIR="/var/backups/Cromatic Vision Optical"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="Cromatic Vision Optical_db"
DB_USER="postgres"
ARCHIVE_NAME="Cromatic Vision Optical_db_$TIMESTAMP.sql.gz"
ARCHIVE_PATH="$BACKUP_DIR/$ARCHIVE_NAME"
S3_REMOTE="s3://Cromatic Vision Optical-backups/database"

echo "======================================"
echo "💾 Starting Database Backup"
echo "Time: $(date)"
echo "======================================"

mkdir -p $BACKUP_DIR

# 1. Dump Database
echo "=> Dumping PostgreSQL database to $ARCHIVE_PATH..."
docker exec -t $DB_CONTAINER pg_dump -U $DB_USER -d Cromatic Vision Optical | gzip > $ARCHIVE_PATH

# 2. Upload to Cloudflare R2 / AWS S3
echo "=> Uploading backup to $S3_REMOTE..."
if command -v aws &> /dev/null; then
    # Assuming AWS CLI is configured with Cloudflare R2 credentials
    aws s3 cp $ARCHIVE_PATH $S3_REMOTE/$ARCHIVE_NAME --endpoint-url $S3_ENDPOINT
    echo "✅ Upload successful."
else
    echo "⚠️ aws-cli not found. Skipping remote upload."
fi

# 3. Clean up old backups (keep last 7 days locally)
echo "=> Cleaning up old local backups..."
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +7 -exec rm -f {} \;

echo "======================================"
echo "🎉 Backup Complete: $ARCHIVE_NAME"
echo "======================================"
