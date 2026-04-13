#!/bin/bash
# 🦅 PREDATOR Analytics — Sovereign Sync Push (v56.4.5-ELITE)
# ==========================================================

# Конфігурація
SYNC_DIR="/content/drive/MyDrive/PREDATOR_SYNC" 
LOCAL_BACKUP_DIR="/opt/predator/backups/sync"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
USE_RCLONE=true # Змінити на false, якщо GDrive змонтовано локально

echo "🚀 ЗАПУСК СИНХРОНІЗАЦІЇ PREDATOR OSINT STACK..."

mkdir -p $LOCAL_BACKUP_DIR
rm -f $LOCAL_BACKUP_DIR/latest_* # Очистка попередніх копій

# 1. PostgreSQL Sync
echo "🐘 [PHASE 1] ダンプ PostgreSQL..."
pg_dump -U predator -d predator_db -f $LOCAL_BACKUP_DIR/latest_pg_dump.sql || { echo "❌ Помилка PG-Dump"; exit 1; }

# 2. Neo4j Sync
echo "📊 [PHASE 2] ダンプ Neo4j (Graph Topology)..."
# Примітка: Neo4j має бути зупинений або використовувати hot-backup в enterprise
sudo neo4j-admin database dump neo4j --to-path=$LOCAL_BACKUP_DIR/neo4j_dump.dump --overwrite-destination=true 2>/dev/null
cp $LOCAL_BACKUP_DIR/neo4j_dump.dump $LOCAL_BACKUP_DIR/latest_neo4j_dump.dump

# 3. Cloud Ingestion
echo "☁️ [PHASE 3] Завантаження у SOVEREIGN HUB..."

if [ "$USE_RCLONE" = true ]; then
    rclone copy $LOCAL_BACKUP_DIR gdrive:PREDATOR_SYNC -P --checksum
    # Prune old backups (older than 7 days)
    echo "🧹 [PHASE 4] Очистка застарілих даних (rclone delete)..."
    rclone delete gdrive:PREDATOR_SYNC --min-age 7d --dry-run # Зніміть dry-run після перевірки
else
    cp $LOCAL_BACKUP_DIR/latest_* $SYNC_DIR/
fi

echo "=================================================="
echo "✅ СИНХРОНІЗАЦІЯ ЗАВЕРШЕНА: $(date)"
echo "ВУЗОЛ COLAB МОЖЕ ПОЧИНАТИ ІНГЕСТІЮ."
echo "=================================================="
