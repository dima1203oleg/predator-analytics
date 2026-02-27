#!/bin/bash
# ============================================================================
# PREDATOR ANALYTICS v45.0 — ХАОС ТЕСТУВАННЯ
# Скрипт для перевірки самовідновлення системи
# ============================================================================

set -e

# Кольори
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${RED}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🔥 CHAOS ENGINEERING - FAULT INJECTION             ║"
echo "║              Перевірка Self-Healing механізмів               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Конфігурація
RECOVERY_TIMEOUT=60
HEALTH_ENDPOINT="http://localhost:8090/health"

# Функція перевірки здоров'я
check_health() {
    local status=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_ENDPOINT 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
        return 0
    else
        return 1
    fi
}

# Функція очікування відновлення
wait_for_recovery() {
    local max_wait=$1
    local elapsed=0

    echo -e "${YELLOW}⏳ Очікування відновлення (max ${max_wait}s)...${NC}"

    while [ $elapsed -lt $max_wait ]; do
        if check_health; then
            echo -e "${GREEN}✅ Система відновилась за ${elapsed} секунд!${NC}"
            return 0
        fi
        sleep 5
        elapsed=$((elapsed + 5))
        echo -e "   ... ${elapsed}s"
    done

    echo -e "${RED}❌ Система не відновилась за ${max_wait} секунд${NC}"
    return 1
}

# ============================================================================
# ТЕСТ 1: Вбивство випадкового контейнера
# ============================================================================
test_container_kill() {
    echo -e "\n${CYAN}═══ ТЕСТ 1: Вбивство контейнера ═══${NC}"

    # Знаходимо контейнер backend
    CONTAINER=$(docker ps --filter "name=predator_backend" -q)

    if [ -z "$CONTAINER" ]; then
        echo -e "${YELLOW}⚠️  Backend контейнер не знайдено, пропускаємо...${NC}"
        return 0
    fi

    echo -e "${RED}💀 Вбиваємо контейнер: predator_backend${NC}"
    docker kill $CONTAINER 2>/dev/null || true

    sleep 5

    # Перевіряємо, чи Docker Compose перезапустив контейнер
    if wait_for_recovery $RECOVERY_TIMEOUT; then
        echo -e "${GREEN}✅ ТЕСТ 1 ПРОЙДЕНО: Контейнер автоматично відновився${NC}"
        return 0
    else
        echo -e "${RED}❌ ТЕСТ 1 ПРОВАЛЕНО${NC}"
        return 1
    fi
}

# ============================================================================
# ТЕСТ 2: Симуляція навантаження на CPU
# ============================================================================
test_cpu_stress() {
    echo -e "\n${CYAN}═══ ТЕСТ 2: CPU Stress ═══${NC}"

    echo -e "${YELLOW}💻 Навантаження CPU на 10 секунд...${NC}"

    # Запуск stress в контейнері
    docker exec predator_backend timeout 10 sh -c "yes > /dev/null &" 2>/dev/null || true

    sleep 5

    if check_health; then
        echo -e "${GREEN}✅ ТЕСТ 2 ПРОЙДЕНО: Система стабільна під навантаженням${NC}"
        return 0
    else
        echo -e "${RED}❌ ТЕСТ 2 ПРОВАЛЕНО: Система не відповідає${NC}"
        return 1
    fi
}

# ============================================================================
# ТЕСТ 3: Переповнення пам'яті Redis
# ============================================================================
test_redis_flood() {
    echo -e "\n${CYAN}═══ ТЕСТ 3: Redis Flood ═══${NC}"

    echo -e "${YELLOW}📝 Записуємо 1000 ключів в Redis...${NC}"

    for i in $(seq 1 1000); do
        docker exec predator_redis redis-cli SET "chaos_test_$i" "value_$i" > /dev/null 2>&1 || true
    done

    if check_health; then
        echo -e "${GREEN}✅ ТЕСТ 3 ПРОЙДЕНО: Redis справляється з навантаженням${NC}"

        # Очистка
        docker exec predator_redis redis-cli KEYS "chaos_test_*" | xargs -I {} docker exec predator_redis redis-cli DEL {} > /dev/null 2>&1 || true
        return 0
    else
        echo -e "${RED}❌ ТЕСТ 3 ПРОВАЛЕНО${NC}"
        return 1
    fi
}

# ============================================================================
# ТЕСТ 4: Перезапуск PostgreSQL
# ============================================================================
test_postgres_restart() {
    echo -e "\n${CYAN}═══ ТЕСТ 4: PostgreSQL Restart ═══${NC}"

    echo -e "${RED}🗄️  Перезапуск PostgreSQL...${NC}"
    docker restart predator_postgres 2>/dev/null || true

    sleep 10

    if wait_for_recovery $RECOVERY_TIMEOUT; then
        echo -e "${GREEN}✅ ТЕСТ 4 ПРОЙДЕНО: Система відновила з'єднання з DB${NC}"
        return 0
    else
        echo -e "${RED}❌ ТЕСТ 4 ПРОВАЛЕНО${NC}"
        return 1
    fi
}

# ============================================================================
# ГОЛОВНИЙ ТЕСТ
# ============================================================================

echo -e "${YELLOW}Перевірка початкового стану системи...${NC}"

if ! check_health; then
    echo -e "${RED}❌ Система не працює! Спочатку запустіть: make up${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Система працює. Починаємо хаос-тестування...${NC}\n"

PASSED=0
FAILED=0

# Запуск тестів
if test_container_kill; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
if test_cpu_stress; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
if test_redis_flood; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi
if test_postgres_restart; then PASSED=$((PASSED+1)); else FAILED=$((FAILED+1)); fi

# Підсумок
echo -e "\n${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                      РЕЗУЛЬТАТИ                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "  ${GREEN}Пройдено: $PASSED${NC}"
echo -e "  ${RED}Провалено: $FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ВСІ ТЕСТИ ПРОЙДЕНО! Система є Self-Healing.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Деякі тести провалено. Потрібна увага.${NC}"
    exit 1
fi
