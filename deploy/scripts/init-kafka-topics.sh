#!/bin/bash
# ============================================================
# PREDATOR Analytics v55.1 — Ініціалізація Kafka Topics
# ============================================================

set -e

KAFKA_BOOTSTRAP="${KAFKA_BOOTSTRAP_SERVERS:-redpanda:9092}"

echo "🚀 Ініціалізація Kafka topics..."

# Функція для створення топіку
create_topic() {
    local topic_name=$1
    local partitions=${2:-3}
    local replication=${3:-1}
    
    echo "  📌 Створення топіку: $topic_name (partitions=$partitions, replication=$replication)"
    
    rpk topic create "$topic_name" \
        --brokers "$KAFKA_BOOTSTRAP" \
        --partitions "$partitions" \
        --replicas "$replication" \
        2>/dev/null || echo "    ⚠️ Топік $topic_name вже існує"
}

# ============================================================
# Ingestion Topics
# ============================================================
echo ""
echo "📦 Ingestion Topics:"
create_topic "predator.ingestion.raw" 6 1
create_topic "predator.ingestion.enriched" 6 1
create_topic "predator.ingestion.dlq" 3 1

# ============================================================
# Analytics Topics
# ============================================================
echo ""
echo "📊 Analytics Topics:"
create_topic "predator.analytics.cers" 3 1
create_topic "predator.analytics.signals" 3 1
create_topic "predator.analytics.anomalies" 3 1

# ============================================================
# Alerts Topics
# ============================================================
echo ""
echo "🔔 Alerts Topics:"
create_topic "predator.alerts.triggers" 3 1
create_topic "predator.alerts.notifications" 3 1

# ============================================================
# Audit Topics (WORM)
# ============================================================
echo ""
echo "📝 Audit Topics:"
create_topic "predator.audit.decisions" 3 1
create_topic "predator.audit.actions" 3 1

# ============================================================
# Перевірка
# ============================================================
echo ""
echo "✅ Список створених топіків:"
rpk topic list --brokers "$KAFKA_BOOTSTRAP"

echo ""
echo "🎉 Ініціалізація Kafka topics завершена!"
