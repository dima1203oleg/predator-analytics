#!/usr/bin/env bash
set -e

# Restore script for Predator Analytics production data
if [ -z "$1" ]; then
  echo "Usage: ./restore.sh <backup_directory>"
  echo "Example: ./restore.sh ~/predator_backups/20231207_143022"
  exit 1
fi

BACKUP_DIR=$1

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory $BACKUP_DIR does not exist"
  exit 1
fi

echo "Starting restore from $BACKUP_DIR..."

# Stop containers
echo "Stopping containers..."
docker-compose down

# PostgreSQL restore
if [ -f "$BACKUP_DIR/postgres.dump" ]; then
  echo "Restoring PostgreSQL..."
  docker-compose up -d postgres
  sleep 5
  docker exec -i predator_postgres pg_restore -U predator -d predator_db --clean < "$BACKUP_DIR/postgres.dump" || true
fi

# MinIO restore
if [ -d "$BACKUP_DIR/minio_data" ]; then
  echo "Restoring MinIO data..."
  docker-compose up -d minio
  sleep 5
  docker cp "$BACKUP_DIR/minio_data" predator_minio:/data
fi

# Qdrant restore
if [ -f "$BACKUP_DIR/qdrant_backup.tar.gz" ]; then
  echo "Restoring Qdrant..."
  docker-compose up -d qdrant
  sleep 5
  docker cp "$BACKUP_DIR/qdrant_backup.tar.gz" predator_qdrant:/tmp/
  docker exec predator_qdrant tar -xzf /tmp/qdrant_backup.tar.gz -C /
fi

# Restart all services
echo "Restarting all services..."
docker-compose up -d

echo "✅ Restore completed successfully!"
echo "Services are starting up. Check status with: docker-compose ps"
