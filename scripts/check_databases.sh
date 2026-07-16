#!/bin/bash

# 🦅 PREDATOR Analytics v66.0-ELITE — Моніторинг баз даних
# Скрипт для перевірки статусу всіх баз даних на Linux сервері

echo "🦅 PREDATOR ANALYTICS v66.0-ELITE — СТАТУС БАЗ ДАНИХ"
echo "======================================================"

# Налаштування
# Оновіть HOST на відповідний Linux сервер (NVIDIA)
HOST="${1:-localhost}"
POSTGRES_PORT="${2:-5432}"
NEO4J_PORT="${3:-7474}"
REDIS_PORT="${4:-6379}"
OPENSEARCH_PORT="${5:-9200}"
QDRANT_PORT="${6:-6333}"
CLICKHOUSE_PORT="${7:-8123}"
MINIO_PORT="${8:-9000}"

# Кольори
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функція для перевірки порту
check_port() {
    local service=$1
    local port=$2
    local description=$3
    
    if nc -z "$HOST" "$port" 2>/dev/null; then
        echo -e "${GREEN}✅${NC} $service ($description) - Порт $port відкритий"
        return 0
    else
        echo -e "${RED}❌${NC} $service ($description) - Порт $port закритий"
        return 1
    fi
}

# Функція для перевірки HTTP endpoint
check_http() {
    local service=$1
    local url=$2
    local description=$3
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status" -ge 200 ] && [ "$status" -lt 400 ]; then
        echo -e "${GREEN}✅${NC} $service ($description) - HTTP $status"
        return 0
    else
        echo -e "${RED}❌${NC} $service ($description) - HTTP $status"
        return 1
    fi
}

# Перевірка PostgreSQL
echo -e "\n🐘 PostgreSQL (SSOT):"
check_port "PostgreSQL" "$POSTGRES_PORT" "Primary DB"
if nc -z "$HOST" "$POSTGRES_PORT" 2>/dev/null; then
    echo -e "${GREEN}   ├─ Керуюча база даних: Активна${NC}"
    echo -e "${GREEN}   ├─ Роль: SSOT (метадані, транзакції)${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Перевірка Neo4j
echo -e "\n🕸️ Neo4j (Graph):"
check_port "Neo4j" "$NEO4J_PORT" "Graph DB"
if nc -z "$HOST" "$NEO4J_PORT" 2>/dev/null; then
    check_http "Neo4j HTTP" "http://$HOST:$NEO4J_PORT" "HTTP API"
    echo -e "${GREEN}   ├─ Графова база даних: Активна${NC}"
    echo -e "${GREEN}   ├─ Роль: Детектор зв'язків (фрод, власність)${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Перевірка Redis
echo -e "\n⚡ Redis (Cache):"
check_port "Redis" "$REDIS_PORT" "Cache"
if nc -z "$HOST" "$REDIS_PORT" 2>/dev/null; then
    echo -e "${GREEN}   ├─ Кеш: Активний${NC}"
    echo -e "${GREEN}   ├─ Роль: Швидка пам'ять (сесії, черги)${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Перевірка OpenSearch
echo -e "\n🔍 OpenSearch (Search):"
check_port "OpenSearch" "$OPENSEARCH_PORT" "Search"
if nc -z "$HOST" "$OPENSEARCH_PORT" 2>/dev/null; then
    check_http "OpenSearch" "http://$HOST:$OPENSEARCH_PORT" "HTTP API"
    echo -e "${GREEN}   ├─ Повнотекстовий пошук: Активний${NC}"
    echo -e "${GREEN}   ├─ Роль: Текстова розвідка${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Перевірка Qdrant
echo -e "\n🧠 Qdrant (Vector):"
check_port "Qdrant" "$QDRANT_PORT" "Vector DB"
if nc -z "$HOST" "$QDRANT_PORT" 2>/dev/null; then
    check_http "Qdrant" "http://$HOST:$QDRANT_PORT" "HTTP API"
    echo -e "${GREEN}   ├─ Векторна пам'ять: Активна${NC}"
    echo -e "${GREEN}   ├─ Роль: AI пам'ять (embeddings)${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Перевірка ClickHouse
echo -e "\n📊 ClickHouse (OLAP):"
check_port "ClickHouse" "$CLICKHOUSE_PORT" "OLAP"
if nc -z "$HOST" "$CLICKHOUSE_PORT" 2>/dev/null; then
    echo -e "${GREEN}   ├─ Аналітична база: Активна${NC}"
    echo -e "${GREEN}   ├─ Роль: Аналітичний мозок (агрегації)${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Перевірка MinIO
echo -e "\n📦 MinIO (S3):"
check_port "MinIO" "$MINIO_PORT" "Object Storage"
if nc -z "$HOST" "$MINIO_PORT" 2>/dev/null; then
    check_http "MinIO" "http://$HOST:$MINIO_PORT" "HTTP API"
    echo -e "${GREEN}   ├─ Об'єктне сховище: Активне${NC}"
    echo -e "${GREEN}   ├─ Роль: Фізичне сховище (файли, PDF)${NC}"
    echo -e "${GREEN}   └─ Статус: READY${NC}"
fi

# Загальний статус
echo -e "\n======================================================"
echo -e "📋 Підсумок стану інфраструктури:"
echo -e "   - PostgreSQL (SSOT): Метадані та транзакції"
echo -e "   - Neo4j (Graph): Граф зв'язків та фрод-детекція"
echo -e "   - Redis (Cache): Кешування та сесії"
echo -e "   - OpenSearch (Search): Повнотекстовий пошук"
echo -e "   - Qdrant (Vector): Векторна пам'ять для AI"
echo -e "   - ClickHouse (OLAP): Аналітика та агрегації"
echo -e "   - MinIO (S3): Зберігання файлів та документів"
echo -e "======================================================"
echo -e "⚠️  Архітектура: NVIDIA Compute Node (...200)"
echo -e "🔗 Локальний доступ: MacBook (IDE + Frontend)"
echo -e "======================================================"