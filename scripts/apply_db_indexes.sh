#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# Predator Analytics - Apply Database Indexes Migration
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

echo "🚀 Predator Analytics - Database Optimization"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-predator_db}
DB_USER=${DB_USER:-predator}
MIGRATION_FILE="migrations/001_add_performance_indexes.sql"

echo -e "${YELLOW}⚠️  ВАЖЛИВО: Це створить багато indexes. Може зайняти 5-10 хвилин${NC}"
echo ""
echo "Параметри підключення:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Ask for confirmation
read -p "Продовжити? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Скасовано"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Файл $MIGRATION_FILE не знайдено${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 Крок 1/4: Backup database...${NC}"

# Create backup
BACKUP_FILE="backups/predator_db_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p backups

if command -v docker &> /dev/null; then
    echo "Використання Docker..."
    docker exec postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE
else
    echo "Використання pg_dump..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > $BACKUP_FILE
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backup створено: $BACKUP_FILE${NC}"
else
    echo -e "${RED}❌ Backup failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 Крок 2/4: Перевірка існуючих indexes...${NC}"

if command -v docker &> /dev/null; then
    EXISTING_INDEXES=$(docker exec postgres psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
else
    EXISTING_INDEXES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
fi

echo "Існуючих performance indexes: $EXISTING_INDEXES"

echo ""
echo -e "${YELLOW}📊 Крок 3/4: Застосування migration...${NC}"
echo "Це може зайняти кілька хвилин. Не переривайте процес!"
echo ""

if command -v docker &> /dev/null; then
    docker exec -i postgres psql -U $DB_USER -d $DB_NAME < $MIGRATION_FILE
else
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $MIGRATION_FILE
fi

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migration застосовано успішно${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Rollback з backup:"
    echo "  docker exec -i postgres psql -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
    exit 1
fi

echo ""
echo -e "${YELLOW}📊 Крок 4/4: Перевірка результатів...${NC}"

if command -v docker &> /dev/null; then
    NEW_INDEXES=$(docker exec postgres psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
else
    NEW_INDEXES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
fi

CREATED_INDEXES=$((NEW_INDEXES - EXISTING_INDEXES))

echo ""
echo "════════════════════════════════════════════"
echo -e "${GREEN}✅ MIGRATION COMPLETED!${NC}"
echo "════════════════════════════════════════════"
echo ""
echo "Статистика:"
echo "  • Indexes до:    $EXISTING_INDEXES"
echo "  • Indexes після: $NEW_INDEXES"
echo "  • Створено:      $CREATED_INDEXES нових indexes"
echo ""
echo "Backup збережено в: $BACKUP_FILE"
echo ""

# Optional: Show index sizes
echo "Топ-10 найбільших indexes:"
if command -v docker &> /dev/null; then
    docker exec postgres psql -U $DB_USER -d $DB_NAME -c "
        SELECT
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) AS size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 10;
    "
else
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT
            tablename,
            indexname,
            pg_size_pretty(pg_relation_size(indexrelid)) AS size
        FROM pg_stat_user_indexes
        WHERE schemaname = 'public'
        ORDER BY pg_relation_size(indexrelid) DESC
        LIMIT 10;
    "
fi

echo ""
echo -e "${GREEN}🎯 Next: Test query performance${NC}"
echo ""
echo "Приклад:"
echo "  docker exec postgres psql -U predator -d predator_db"
echo "  \\timing on"
echo "  SELECT * FROM documents WHERE source_type = 'customs' ORDER BY created_at DESC LIMIT 100;"
echo ""
echo "Очікуване покращення: 10-20x швидше 🚀"
echo ""
