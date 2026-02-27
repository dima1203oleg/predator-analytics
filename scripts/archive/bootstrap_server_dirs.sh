#!/bin/bash
# ============================================================
# Predator v45 | Neural AnalyticsServer Bootstrap Script
# ============================================================
# Creates the standard directory structure on the server
# Run this ONCE after first SSH connection to setup the server
#
# Usage: sudo ./bootstrap_server_dirs.sh
# ============================================================

set -e

echo "🚀 Predator v45 | Neural AnalyticsServer Bootstrap"
echo "=================================="

# Base directory
PREDATOR_BASE="/opt/predator"

# Create main directories
echo "📁 Creating directory structure..."

mkdir -p "${PREDATOR_BASE}/repo"
mkdir -p "${PREDATOR_BASE}/data/raw"
mkdir -p "${PREDATOR_BASE}/data/processed"
mkdir -p "${PREDATOR_BASE}/data/indexes"
mkdir -p "${PREDATOR_BASE}/cache"
mkdir -p "${PREDATOR_BASE}/models"
mkdir -p "${PREDATOR_BASE}/backups"
mkdir -p "${PREDATOR_BASE}/logs"

# Set permissions (allow docker user access)
echo "🔐 Setting permissions..."
chmod -R 755 "${PREDATOR_BASE}"

# Create .env template if not exists
if [ ! -f "${PREDATOR_BASE}/.env" ]; then
    echo "📝 Creating .env template..."
    cat > "${PREDATOR_BASE}/.env.example" << 'EOF'
# Predator v45 | Neural AnalyticsEnvironment Variables
# Copy to .env and fill in values

# Database
DATABASE_URL=postgresql+asyncpg://predator:CHANGE_ME@localhost:5432/predator_db

# Redis
REDIS_URL=redis://localhost:6379/0

# OpenSearch
OPENSEARCH_URL=http://localhost:9200

# Qdrant
QDRANT_URL=http://localhost:6333

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=CHANGE_ME
MINIO_SECRET_KEY=CHANGE_ME

# LLM Keys (add your own)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=

# Telegram Bot
TELEGRAM_BOT_TOKEN=
TELEGRAM_AUTHORIZED_USERS=

# Paths
PREDATOR_DATA_PATH=/opt/predator/data
PREDATOR_CACHE_PATH=/opt/predator/cache
PREDATOR_MODELS_PATH=/opt/predator/models
EOF
fi

# Print summary
echo ""
echo "✅ Directory structure created:"
echo ""
find "${PREDATOR_BASE}" -type d -maxdepth 3 | head -20
echo ""
echo "📋 Next steps:"
echo "   1. Clone repository: git clone <repo> ${PREDATOR_BASE}/repo/Predator_22"
echo "   2. Copy .env: cp ${PREDATOR_BASE}/.env.example ${PREDATOR_BASE}/repo/Predator_22/.env"
echo "   3. Open in VS Code: code --folder-uri vscode-remote://ssh-remote+dev-ngrok${PREDATOR_BASE}/repo/Predator_22"
echo "   4. Reopen in Container"
echo ""
echo "🎉 Bootstrap complete!"
