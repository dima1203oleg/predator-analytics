#!/usr/bin/env bash
# =============================================================
# PREDATOR Analytics v55.1
# Створення Kafka топіків
# Використання: ./deploy/scripts/create-kafka-topics.sh
# =============================================================
set -euo pipefail

KAFKA_BOOTSTRAP="${KAFKA_BOOTSTRAP:-kafka:9092}"
REPLICAS="${KAFKA_REPLICAS:-1}"
PARTITIONS="${KAFKA_PARTITIONS:-6}"
RETENTION_MS="${KAFKA_RETENTION_MS:-604800000}"  # 7 днів

echo "🟡 Підключення до Kafka: ${KAFKA_BOOTSTRAP}"

# Функція створення топіку
create_topic() {
    local topic_name="$1"
    local partitions="${2:-$PARTITIONS}"
    local retention="${3:-$RETENTION_MS}"

    echo "📌 Створення топіку: ${topic_name}"
    kafka-topics.sh \
        --bootstrap-server "${KAFKA_BOOTSTRAP}" \
        --create \
        --if-not-exists \
        --topic "${topic_name}" \
        --partitions "${partitions}" \
        --replication-factor "${REPLICAS}" \
        --config retention.ms="${retention}" \
        --config cleanup.policy=delete
}

# ============================================================
# Топіки інгестії
# ============================================================
create_topic "predator.ingestion.raw"          6
create_topic "predator.ingestion.normalized"   6
create_topic "predator.ingestion.errors"       3
create_topic "predator.ingestion.dlq"          3 "-1"  # Безстрокове зберігання DLQ

# ============================================================
# Топіки ризик-скорингу
# ============================================================
create_topic "predator.risk.recalculate"       6
create_topic "predator.risk.results"           6

# ============================================================
# Топіки сповіщень
# ============================================================
create_topic "predator.alerts.new"             3
create_topic "predator.alerts.notifications"   3

# ============================================================
# Топіки графу
# ============================================================
create_topic "predator.graph.update"           6
create_topic "predator.graph.snapshots"        1

# ============================================================
# Системні топіки
# ============================================================
create_topic "predator.system.health"          1
create_topic "predator.system.audit"           3 "-1"  # WORM: безстрокове

echo "✅ Всі топіки Kafka створено успішно!"

# Вивести список топіків
echo ""
echo "📋 Список топіків:"
kafka-topics.sh \
    --bootstrap-server "${KAFKA_BOOTSTRAP}" \
    --list | grep "^predator"
