#!/bin/bash
# PREDATOR v30 — ULTIMATE PRODUCTION DEPLOYER
# Мова: Українська | Runtime: Python 3.12 | Mode: AUTO-SUCCESS

# Stop on error, but allow custom error handling
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Determine script location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$SCRIPT_DIR"
LOG_FILE="$ROOT_DIR/deploy_history.log"

# Function to log messages
log() {
    local timestamp=$(date +"%Y-%m-%d %H:%M:%S")
    echo -e "${timestamp} $1" | tee -a "$LOG_FILE"
}

# ASCII Art Banner
print_banner() {
    clear
    echo -e "${CYAN}"
    echo "█▀█ █▀█ █▀▀ █▀▄ ▄▀█ ▀█▀ █▀█ █▀█"
    echo "█▀▀ █▀▄ ██▄ █▄▀ █▀█ ░█░ █▄█ █▀▄"
    echo -e "${NC}"
    echo -e "${BLUE}  >>> ULTIMATE DEPLOYER v30.1 <<<  ${NC}"
    echo "======================================"
}

check_prerequisites() {
    log "${YELLOW}🔍 Перевірка системних вимог...${NC}"

    if ! command -v kubectl &> /dev/null; then
        log "${RED}❌ kubectl не знайдено!${NC}"
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        log "${RED}❌ helm не знайдено!${NC}"
        exit 1
    fi

    local ctx=$(kubectl config current-context)
    log "✅ Контекст K8s: ${GREEN}$ctx${NC}"
}

confirm_deploy() {
    if [[ "$1" == "-y" ]]; then
        return
    fi
    echo -n "Розпочати деплой в namespace predator-prod? (y/N): "
    read ans
    if [[ "$ans" != "y" ]]; then
        log "⛔ Деплой скасовано користувачем."
        exit 0
    fi
}

main() {
    print_banner
    check_prerequisites
    confirm_deploy "$1"

    log "${BLUE}🚀 Початок процедури розгортання...${NC}"

    # 1. Clean Secrets
    log "${YELLOW}🧹 Очищення конфліктних секретів (щоб уникнути помилок Helm)...${NC}"
    kubectl delete secret predator-secrets -n predator-prod --ignore-not-found

    # 2. Helm Dependency Update
    log "${YELLOW}🛠 Підготовка Helm Chart...${NC}"
    if [ -d "$ROOT_DIR/helm/predator" ]; then
        cd "$ROOT_DIR/helm/predator"

        # Remove old lock to force refresh
        rm -f Chart.lock

        if helm dependency update; then
             log "${GREEN}✅ Залежності оновлено.${NC}"
        else
             log "${RED}❌ Помилка оновлення залежностей!${NC}"
             exit 1
        fi

        cd "$ROOT_DIR"
    else
        log "${RED}❌ Директорія helm/predator не знайдена за адресою $ROOT_DIR/helm/predator${NC}"
        exit 1
    fi

    # 3. Helm Upgrade
    log "${CYAN}🚀 Запуск Helm Upgrade (Atomic Mode)...${NC}"

    set +e # Вимикаємо exit-on-error, щоб обробити помилку самостійно

    helm upgrade --install predator-prod ./helm/predator \
      -f ./helm/values/prod.yaml \
      --namespace predator-prod \
      --create-namespace \
      --timeout 15m0s \
      --atomic \
      --wait \
      --debug

    STATUS=$?
    set -e

    if [ $STATUS -eq 0 ]; then
        log "${GREEN}✅ SUCCESS: PREDATOR v30 успішно розгорнуто!${NC}"
    else
        log "${RED}❌ FAILURE: Помилка деплою. Відкат виконано автоматично (atomic).${NC}"
        # Показати логи останнього failed поду
        echo "Діагностика..."
        kubectl get pods -n predator-prod | grep -v Running
        exit 1
    fi

    # 4. Final Status
    log "🔍 Статус компонентів:"
    kubectl get pods -n predator-prod

    log "${GREEN}🏁 Деплой скрипт завершив роботу.${NC}"
}

# Run main function
main "$@"
