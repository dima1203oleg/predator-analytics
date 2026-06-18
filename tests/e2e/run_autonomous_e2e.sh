#!/bin/bash

# 🦅 Autonomous E2E Test Runner для PREDATOR Analytics v61.0-ELITE
# Повністю автоматизований запуск наскрізного тесту імпорту Excel

# Не зупиняємось при помилках для кращої діагностики
set +e  

# Конфігурація
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
FRONTEND_DIR="$PROJECT_ROOT/apps/predator-analytics-ui"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKEND_MODE="${1:-auto}"  # auto, local, remote

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функція логування
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Функція перевірки доступності сервісів
check_services() {
    log_info "Перевірка доступності сервісів..."
    
    # Перевірка UI
    log_info "Перевірка UI на порту 3030..."
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3030 | grep -q "200\|302"; then
        log_success "UI доступний на порту 3030"
    else
        log_error "UI недоступний на порту 3030"
        log_info "Спроба запуску UI..."
        cd "$FRONTEND_DIR"
        npm run dev &
        UI_PID=$!
        sleep 10
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:3030 | grep -q "200\|302"; then
            log_success "UI успішно запущено"
        else
            log_error "Не вдалося запустити UI"
            exit 1
        fi
    fi
    
    # Перевірка NVIDIA сервера
    log_info "Перевірка доступності NVIDIA сервера..."
    if ssh -o ConnectTimeout=5 predator-server "echo 'NVIDIA server is accessible'" > /dev/null 2>&1; then
        log_success "NVIDIA сервер доступний"
    else
        log_error "NVIDIA сервер недоступний"
        log_info "Перевірте SSH конфігурацію для predator-server"
        exit 1
    fi
    
    # Перевірка тестового файлу
    TEST_FILE="/Users/dima1203/Desktop/Березень_2024_repacked.xlsx"
    if [ -f "$TEST_FILE" ]; then
        FILE_SIZE=$(du -h "$TEST_FILE" | cut -f1)
        log_success "Тестовий файл знайдено: $TEST_FILE ($FILE_SIZE)"
    else
        log_error "Тестовий файл не знайдено: $TEST_FILE"
        exit 1
    fi
}

# Функція встановлення залежностей
install_dependencies() {
    log_info "Перевірка залежностей..."
    
    cd "$FRONTEND_DIR"
    
    # Перевірка node_modules
    if [ ! -d "node_modules" ]; then
        log_info "Встановлення npm залежностей..."
        npm install
    fi
    
    # Перевірка Playwright
    if ! npx playwright --version > /dev/null 2>&1; then
        log_info "Встановлення Playwright..."
        npx playwright install chromium
    else
        log_success "Playwright вже встановлено"
    fi
    
    # Перевірка Python залежностей на NVIDIA
    if [ "$BACKEND_MODE" != "local" ]; then
        log_info "Перевірка Python залежностей на NVIDIA сервері..."
        
        # Пошук правильного контейнера бекенду
        BACKEND_CONTAINER=$(ssh predator-server "docker ps --format '{{.Names}}' | grep -E 'backend|api|core' | head -1" 2>/dev/null || echo "")
        
        if [ -z "$BACKEND_CONTAINER" ]; then
            log_warning "Бекенд контейнер не знайдено на NVIDIA сервері"
            log_info "Спроба локального запуску..."
            
            # Перевіряємо локальний бекенд
            if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|404"; then
                log_success "Локальний бекенд доступний на порту 8000"
                BACKEND_MODE="local"
            else
                log_warning "Локальний бекенд недоступний"
                log_info "Продовжуємо в UI-Only режимі (без валідації баз даних)"
                BACKEND_MODE="ui-only"
            fi
        else
            log_success "Знайдено бекенд контейнер: $BACKEND_CONTAINER"
            ssh predator-server "docker exec $BACKEND_CONTAINER pip list | grep -q 'qdrant-client\|opensearch-py' || docker exec $BACKEND_CONTAINER pip install qdrant-client opensearch-py > /dev/null 2>&1"
            log_success "Python залежності перевірено"
            BACKEND_MODE="remote"
        fi
    else
        log_info "Локальний режим встановлено через аргумент"
        # Перевіряємо локальний бекенд
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|404"; then
            log_success "Локальний бекенд доступний на порту 8000"
        else
            log_warning "Локальний бекенд недоступний, перехід в UI-Only режим"
            BACKEND_MODE="ui-only"
        fi
    fi
}

# Функція підготовки звітної директорії
prepare_report_dir() {
    log_info "Підготовка директорії для звітів..."
    mkdir -p "$REPORT_DIR"
    log_success "Директорія звітів готова: $REPORT_DIR"
}

# Функція запуску Playwright тесту
run_playwright_test() {
    log_info "Запуск автономного E2E тесту..."
    
    cd "$FRONTEND_DIR"
    
    # Експортуємо режим бекенду для тесту
    export BACKEND_MODE="$BACKEND_MODE"
    if [ ! -z "$BACKEND_CONTAINER" ]; then
        export BACKEND_CONTAINER="$BACKEND_CONTAINER"
    fi
    
    # Запуск тесту
    npx playwright test e2e/autonomous-excel-import.spec.ts \
        --reporter=html,list \
        --output=playwright-report \
        --headed=false \
        --browser=chromium
    
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        log_success "Playwright тест успішно пройдено"
    else
        log_error "Playwright тест завершено з помилками (код: $TEST_EXIT_CODE)"
    fi
    
    return $TEST_EXIT_CODE
}

# Функція збору результатів
collect_results() {
    log_info "Збір результатів тестування..."
    
    # Копіювання Playwright звітів
    if [ -d "$FRONTEND_DIR/playwright-report" ]; then
        cp -r "$FRONTEND_DIR/playwright-report" "$REPORT_DIR/playwright-report-$TIMESTAMP"
        log_success "Playwright звіт скопійовано"
    fi
    
    # Пошук нових звітів валідації
    find "$REPORT_DIR" -name "autonomous-e2e-report-$TIMESTAMP*" -type f -exec cp {} "$REPORT_DIR/latest/" \; 2>/dev/null || true
    
    # Створення символічного посилання на останній звіт
    LATEST_DIR="$REPORT_DIR/latest"
    mkdir -p "$LATEST_DIR"
    
    if [ -f "$REPORT_DIR/autonomous-e2e-report-$TIMESTAMP.json" ]; then
        cp "$REPORT_DIR/autonomous-e2e-report-$TIMESTAMP.json" "$LATEST_DIR/report.json"
        log_success "Останній JSON звіт оновлено"
    fi
    
    if [ -f "$REPORT_DIR/autonomous-e2e-report-$TIMESTAMP.md" ]; then
        cp "$REPORT_DIR/autonomous-e2e-report-$TIMESTAMP.md" "$LATEST_DIR/report.md"
        log_success "Останній Markdown звіт оновлено"
    fi
}

# Функція генерації фінального звіту
generate_final_report() {
    log_info "Генерація фінального звіту..."
    
    FINAL_REPORT="$REPORT_DIR/final-report-$TIMESTAMP.md"
    
    cat > "$FINAL_REPORT" << EOF
# 🦅 Autonomous E2E Test Final Report

**PREDATOR Analytics v61.0-ELITE**  
**Timestamp**: $(date)  
**Test Run**: $TIMESTAMP

## Execution Summary

- **Test File**: $TEST_FILE
- **File Size**: $(du -h "$TEST_FILE" | cut -f1)
- **UI URL**: http://localhost:3030
- **NVIDIA Server**: predator-server
- **Test Duration**: $SECONDS seconds

## Test Status

EOF

    # Додавання статусу з останнього звіту
    if [ -f "$LATEST_DIR/report.json" ]; then
        FINAL_STATUS=$(python3 -c "import json; print(json.load(open('$LATEST_DIR/report.json'))['final_status'])" 2>/dev/null || echo "UNKNOWN")
        
        if [ "$FINAL_STATUS" = "PASS" ]; then
            echo "✅ **FINAL STATUS: PASS**" >> "$FINAL_REPORT"
        else
            echo "❌ **FINAL STATUS: FAIL**" >> "$FINAL_REPORT"
        fi
        
        echo "" >> "$FINAL_REPORT"
        
        # Додавання детальної інформації
        python3 -c "
import json
with open('$LATEST_DIR/report.json') as f:
    data = json.load(f)
    
print('## Performance Metrics')
print(f'- Upload Time: {data[\"performance_metrics\"][\"upload_time\"] / 1000:.2f}s')
print(f'- ETL Time: {data[\"performance_metrics\"][\"etl_time\"] / 1000:.2f}s')
print(f'- Validation Time: {data[\"performance_metrics\"][\"validation_time\"] / 1000:.2f}s')
print(f'- Total Time: {data[\"performance_metrics\"][\"total_time\"] / 1000 / 60:.2f} minutes')
print()
" >> "$FINAL_REPORT" 2>/dev/null || true
    else
        echo "❌ **FINAL STATUS: UNKNOWN** (No report file found)" >> "$FINAL_REPORT"
    fi
    
    cat >> "$FINAL_REPORT" << EOF

## Next Steps

- Перегляньте детальний звіт: \`$LATEST_DIR/report.md\`
- Перегляньте HTML звіт: \`$REPORT_DIR/playwright-report-$TIMESTAMP/index.html\`
- Для повторного запуску виконайте: \`bash $SCRIPT_DIR/run_autonomous_e2e.sh\`

---
Generated by Autonomous E2E Test Runner
EOF

    log_success "Фінальний звіт збережено: $FINAL_REPORT"
}

# Функція очистки
cleanup() {
    log_info "Очистка тимчасових ресурсів..."
    
    # Зупинка UI якщо було запущено
    if [ ! -z "$UI_PID" ]; then
        kill $UI_PID 2>/dev/null || true
        log_success "UI зупинено"
    fi
    
    log_success "Очищення завершено"
}

# Головна функція
main() {
    log_info "🦅 Початок Autonomous E2E Test..."
    log_info "Timestamp: $TIMESTAMP"
    
    # Обробка сигналів для коректної очистки
    trap cleanup EXIT INT TERM
    
    # Перевірка середовища
    check_services
    
    # Встановлення залежностей
    install_dependencies
    
    # Підготовка директорії
    prepare_report_dir
    
    # Запуск тесту
    run_playwright_test
    TEST_RESULT=$?
    
    # Збір результатів
    collect_results
    
    # Фінальний звіт
    generate_final_report
    
    # Фінальний статус
    if [ $TEST_RESULT -eq 0 ]; then
        log_success "🦅 Autonomous E2E Test успішно завершено!"
        exit 0
    else
        log_error "🦅 Autonomous E2E Test завершено з помилками"
        exit 1
    fi
}

# Запуск
main "$@"