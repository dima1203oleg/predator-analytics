#!/usr/bin/env bash
# =============================================================
# PREDATOR Analytics v55.1
# Ініціалізація MinIO бакетів
# Використання: ./deploy/scripts/init-minio-buckets.sh
# =============================================================
set -euo pipefail

MINIO_ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-predator}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-changeme_dev}"

echo "🟡 Підключення до MinIO: ${MINIO_ENDPOINT}"

# Налаштування mc (MinIO Client)
mc alias set predator-minio "${MINIO_ENDPOINT}" \
    "${MINIO_ROOT_USER}" \
    "${MINIO_ROOT_PASSWORD}" \
    --api S3v4

# Функція створення бакету
create_bucket() {
    local bucket_name="$1"
    local policy="${2:-private}"

    if mc ls "predator-minio/${bucket_name}" > /dev/null 2>&1; then
        echo "⚠️  Бакет вже існує: ${bucket_name}"
    else
        echo "📌 Створення бакету: ${bucket_name}"
        mc mb "predator-minio/${bucket_name}"
        if [ "${policy}" = "public" ]; then
            mc anonymous set public "predator-minio/${bucket_name}"
        fi
    fi
}

# ============================================================
# Бакети для файлів
# ============================================================
create_bucket "raw-uploads"              # Завантажені файли для інгестії
create_bucket "predator-uploads"         # Завантажені файли (CSV/PDF/XML)
create_bucket "predator-processed"       # Оброблені файли
create_bucket "predator-exports"         # Експортовані звіти
create_bucket "predator-models"          # ML моделі (XGBoost, CatBoost)
create_bucket "predator-backups"         # Backup GraphDB snapshots
create_bucket "predator-logs"            # Архів логів
create_bucket "predator-rag-documents"   # Документи для RAG

# ============================================================
# Налаштування lifecycle rules (автовидалення)
# ============================================================
# Exports застарівають через 30 днів
mc ilm import "predator-minio/predator-exports" << 'EOF'
{
    "Rules": [
        {
            "ID": "expire-exports",
            "Status": "Enabled",
            "Expiration": {
                "Days": 30
            }
        }
    ]
}
EOF

# Uploads застарівають через 7 днів (після обробки)
mc ilm import "predator-minio/predator-uploads" << 'EOF'
{
    "Rules": [
        {
            "ID": "expire-uploads",
            "Status": "Enabled",
            "Expiration": {
                "Days": 7
            }
        }
    ]
}
EOF

echo "✅ MinIO бакети ініціалізовано успішно!"

echo ""
echo "📋 Список бакетів:"
mc ls predator-minio/
