#!/bin/bash
# 🦅 PREDATOR Analytics — Sovereign Auto-Healing Cluster (v56.4.5-ELITE)
# ===================================================================
# Цей скрипт призначений для виконання в Google Colab.
# Він автоматично перевіряє стан баз даних та тунелю zrok.

LOG_FILE="/content/predator_auto_heal.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

check_database() {
    local port=$1
    local name=$2
    if nc -z localhost $port; then
        return 0
    else
        log "⚠️ $name (Port $port) is DOWN."
        return 1
    fi
}

restart_zrok() {
    log "🚀 Restarting ZROK Tunnel..."
    pkill -f zrok
    sleep 2
    # Спроба запустити тунель (передбачається, що zrok вже авторизований)
    zrok share reserved predator --backend-mode proxy http://localhost:8000 > /content/zrok.log 2>&1 &
    log "✅ ZROK tunnel initiated in background."
}

# 1. Перевірка баз даних
log "🔍 Checking cluster dependencies..."
check_database 5432 "PostgreSQL" || service postgresql start
check_database 7687 "Neo4j" || neo4j start
check_database 6379 "Redis" || redis-server --daemonize yes
check_database 9000 "MinIO"
check_database 9092 "Kafka"
check_database 9200 "OpenSearch"
check_database 6333 "Qdrant"

# 2. Перевірка Core API
if ! curl -s http://localhost:8000/health > /dev/null; then
    log "🚨 Core API is not responding. Restarting..."
    pkill -f "python.*app.main"
    cd /content/Predator_60/services/core-api && venv/bin/python -m app.main > /content/api.log 2>&1 &
fi

# 3. Перевірка ZROK
if ! grep -q "sharing" /content/zrok.log 2>/dev/null; then
    restart_zrok
fi

log "🛡️ Sovereign Cluster is operational. Auto-Healing cycle complete."
