#!/usr/bin/env bash
set -e

# Backup script for Predator Analytics production data
BACKUP_DIR=~/predator_backups/$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

echo "Starting backup to $BACKUP_DIR..."

# PostgreSQL backup
echo "Backing up PostgreSQL..."
docker exec predator_postgres pg_dump -U predator -Fc predator_db > "$BACKUP_DIR/postgres.dump"

# MinIO data backup (copy from container)
echo "Backing up MinIO data..."
docker cp predator_minio:/data "$BACKUP_DIR/minio_data"

# Qdrant snapshot
echo "Backing up Qdrant..."
docker exec predator_qdrant tar -czf /tmp/qdrant_backup.tar.gz /qdrant/storage
docker cp predator_qdrant:/tmp/qdrant_backup.tar.gz "$BACKUP_DIR/qdrant_backup.tar.gz"

# Backup docker-compose and configuration files
echo "Backing up configuration..."
cp docker-compose.yml "$BACKUP_DIR/"
cp nginx.conf "$BACKUP_DIR/" 2>/dev/null || true
cp -r ua-sources/.env "$BACKUP_DIR/" 2>/dev/null || true

echo "✅ Backup completed successfully!"
echo "Backup location: $BACKUP_DIR"
echo "Backup size: $(du -sh $BACKUP_DIR | cut -f1)"
