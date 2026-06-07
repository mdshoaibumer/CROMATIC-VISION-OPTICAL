#!/bin/bash

# Cromatic Vision Optical Database Backup Script
# Typically run via cronjob: 0 2 * * * /opt/cromatic-vision-optical/scripts/backup.sh
# Requires aws-cli or rclone configured for R2/S3 upload

set -euo pipefail

BACKUP_DIR="/var/backups/cromatic-vision-optical"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="cromatic_db"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-cromatic_vision_db}"
ARCHIVE_NAME="cromatic_vision_db_${TIMESTAMP}.sql.gz"
ARCHIVE_PATH="${BACKUP_DIR}/${ARCHIVE_NAME}"
S3_REMOTE="s3://cromatic-vision-backups/database"

echo "======================================"
echo "Starting Database Backup"
echo "Time: $(date)"
echo "======================================"

mkdir -p "${BACKUP_DIR}"

# 1. Dump Database
echo "=> Dumping PostgreSQL database to ${ARCHIVE_PATH}..."
docker exec -t "${DB_CONTAINER}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" | gzip > "${ARCHIVE_PATH}"

# Verify dump is not empty
if [ ! -s "${ARCHIVE_PATH}" ]; then
    echo "ERROR: Backup file is empty. Aborting."
    rm -f "${ARCHIVE_PATH}"
    exit 1
fi

# 2. Upload to Cloudflare R2 / AWS S3
echo "=> Uploading backup to ${S3_REMOTE}..."
if command -v aws &> /dev/null; then
    aws s3 cp "${ARCHIVE_PATH}" "${S3_REMOTE}/${ARCHIVE_NAME}" --endpoint-url "${S3_ENDPOINT}"
    echo "Upload successful."
else
    echo "WARNING: aws-cli not found. Skipping remote upload."
fi

# 3. Clean up old backups (keep last 7 days locally)
echo "=> Cleaning up old local backups..."
find "${BACKUP_DIR}" -name "*.sql.gz" -type f -mtime +7 -exec rm -f {} \;

echo "======================================"
echo "Backup Complete: ${ARCHIVE_NAME}"
echo "======================================"
