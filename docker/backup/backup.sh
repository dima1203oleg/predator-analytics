#!/bin/sh

# Predator Analytics - Automated Backup Script
# Backs up PostgreSQL (TimescaleDB) and Qdrant Vector DB to MinIO/Local

echo "[$(date)] Starting Backup Routine..."

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups/${TIMESTAMP}"
mkdir -p ${BACKUP_DIR}

# 1. PostgreSQL Backup
echo "[$(date)] Backing up PostgreSQL..."
PGPASSWORD=${POSTGRES_PASSWORD} pg_dump -h postgres -U predator -d predator_db -F c -b -v -f "${BACKUP_DIR}/predator_db.dump"
if [ $? -eq 0 ]; then
    echo "[$(date)] PostgreSQL backup successful."
else
    echo "[$(date)] PostgreSQL backup FAILED!"
fi

# 2. Qdrant Backup (Snapshot)
echo "[$(date)] Backing up Qdrant..."
# Trigger snapshot creation via API
SNAPSHOT_RESP=$(curl -s -X POST "http://qdrant:6333/collections/documents/snapshots")
SNAPSHOT_NAME=$(echo $SNAPSHOT_RESP | sed -n 's/.*"name":"\([^"]*\)".*/\1/p')

if [ -n "$SNAPSHOT_NAME" ]; then
    echo "[$(date)] Qdrant snapshot created: ${SNAPSHOT_NAME}"
    # Download snapshot
    curl -s -o "${BACKUP_DIR}/qdrant_documents.snapshot" "http://qdrant:6333/collections/documents/snapshots/${SNAPSHOT_NAME}"
    echo "[$(date)] Qdrant snapshot downloaded."
else
    echo "[$(date)] Qdrant backup FAILED (Could not create snapshot)."
fi

# 3. Compress
echo "[$(date)] Compressing backup..."
tar -czf "/backups/predator_backup_${TIMESTAMP}.tar.gz" -C "/backups" "${TIMESTAMP}"
rm -rf "${BACKUP_DIR}"

# 4. Retention Policy (Keep last 7 days)
echo "[$(date)] Cleaning old backups..."
find /backups -name "predator_backup_*.tar.gz" -mtime +7 -delete

echo "[$(date)] Backup Routine Completed."
