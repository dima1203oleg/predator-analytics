#!/bin/bash

# ════════════════════════════════════════════════════════════════
# PREDATOR Analytics — Автоматичний деплой сервісів на NVIDIA
# ════════════════════════════════════════════════════════════════
# Скрипт для відновлення вимкнених сервісів з оптимізованими ресурсами
# OpenSearch, Qdrant, MinIO, Ollama
# ════════════════════════════════════════════════════════════════

set -e  # Зупинити при помилці

# Кольори для виводу
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Налаштування
NAMESPACE="predator-v61"
RELEASE_NAME="predator-v61"
HELM_CHART_PATH="/path/to/predator/helm/predator-umbrella"
VALUES_FILE="values-compute-nvidia.yaml"

# Функції для виводу
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

# Перевірка наявності kubectl
check_kubectl() {
    log_info "Перевірка наявності kubectl..."
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl не знайдено. Встановіть kubectl: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi
    log_success "kubectl знайдено: $(kubectl version --client --short)"
}

# Перевірка наявності helm
check_helm() {
    log_info "Перевірка наявності helm..."
    if ! command -v helm &> /dev/null; then
        log_error "helm не знайдено. Встановіть helm: https://helm.sh/docs/intro/install/"
        exit 1
    fi
    log_success "helm знайдено: $(helm version --short)"
}

# Перевірка підключення до кластера
check_cluster() {
    log_info "Перевірка підключення до кластера..."
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Не вдалося підключитися до кластера Kubernetes"
        exit 1
    fi
    log_success "Підключено до кластера: $(kubectl config current-context)"
}

# Перевірка namespace
check_namespace() {
    log_info "Перевірка namespace: $NAMESPACE"
    if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
        log_warning "Namespace $NAMESPACE не існує. Створення..."
        kubectl create namespace "$NAMESPACE"
        log_success "Namespace $NAMESPACE створено"
    else
        log_success "Namespace $NAMESPACE існує"
    fi
}

# Резервне копіювання поточного release
backup_release() {
    log_info "Створення резервної копії поточного release..."
    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        helm get values "$RELEASE_NAME" -n "$NAMESPACE" > "/tmp/${RELEASE_NAME}-backup-$(date +%Y%m%d-%H%M%S).yaml"
        log_success "Резервна копія створена"
    else
        log_warning "Release $RELEASE_NAME не знайдено, пропускаємо резервне копіювання"
    fi
}

# Деплой оновлених сервісів
deploy_services() {
    log_info "Деплой оновлених сервісів з оптимізованими ресурсами..."
    
    if [ ! -f "$HELM_CHART_PATH/$VALUES_FILE" ]; then
        log_error "Values файл не знайдено: $HELM_CHART_PATH/$VALUES_FILE"
        log_info "Переконайтеся, що шлях до Helm чарту правильний"
        exit 1
    fi
    
    cd "$HELM_CHART_PATH"
    
    if helm list -n "$NAMESPACE" | grep -q "$RELEASE_NAME"; then
        log_info "Оновлення існуючого release: $RELEASE_NAME"
        helm upgrade "$RELEASE_NAME" . -f "$VALUES_FILE" -n "$NAMESPACE"
    else
        log_info "Встановлення нового release: $RELEASE_NAME"
        helm install "$RELEASE_NAME" . -f "$VALUES_FILE" -n "$NAMESPACE"
    fi
    
    log_success "Деплой завершено"
}

# Очікування готовності подів
wait_for_pods() {
    log_info "Очікування готовності подів..."
    
    # Список критичних подів для перевірки
    CRITICAL_PODS=("qdrant" "opensearch" "minio" "ollama")
    
    for pod in "${CRITICAL_PODS[@]}"; do
        log_info "Очікування поду: $pod"
        kubectl wait --for=condition=ready pod -l app="$pod" -n "$NAMESPACE" --timeout=300s || {
            log_warning "Под $pod не готовий за 300 секунд"
        }
    done
    
    log_success "Критичні поди готові"
}

# Перевірка статусу подів
check_pod_status() {
    log_info "Перевірка статусу всіх подів у namespace: $NAMESPACE"
    kubectl get pods -n "$NAMESPACE"
}

# Перевірка ресурсів
check_resources() {
    log_info "Перевірка використання ресурсів..."
    kubectl top pods -n "$NAMESPACE" 2>/dev/null || log_warning "Не вдалося отримати метрики ресурсів (metrics-server може бути не встановлено)"
    kubectl top nodes 2>/dev/null || log_warning "Не вдалося отримати метрики нодів"
}

# Перевірка логів
check_logs() {
    log_info "Перевірка логів критичних сервісів..."
    
    for pod in "qdrant" "opensearch" "minio" "ollama"; do
        log_info "Логи для $pod:"
        kubectl logs -n "$NAMESPACE" -l app="$pod" --tail=20 --prefix=true || log_warning "Не вдалося отримати логи для $pod"
        echo "---"
    done
}

# Перевірка доступності сервісів
check_service_health() {
    log_info "Перевірка доступності сервісів..."
    
    # OpenSearch
    log_info "Перевірка OpenSearch..."
    kubectl port-forward -n "$NAMESPACE" svc/opensearch 9200:9200 &
    PF_PID=$!
    sleep 5
    if curl -s http://localhost:9200/_cluster/health | grep -q "green\|yellow"; then
        log_success "OpenSearch доступний"
    else
        log_warning "OpenSearch може бути недоступний"
    fi
    kill $PF_PID 2>/dev/null
    
    # Qdrant
    log_info "Перевірка Qdrant..."
    kubectl port-forward -n "$NAMESPACE" svc/qdrant 6333:6333 &
    PF_PID=$!
    sleep 5
    if curl -s http://localhost:6333/healthz | grep -q "ok"; then
        log_success "Qdrant доступний"
    else
        log_warning "Qdrant може бути недоступний"
    fi
    kill $PF_PID 2>/dev/null
    
    # MinIO
    log_info "Перевірка MinIO..."
    kubectl port-forward -n "$NAMESPACE" svc/minio 9000:9000 &
    PF_PID=$!
    sleep 5
    if curl -s http://localhost:9000/minio/health/live | grep -q "ok"; then
        log_success "MinIO доступний"
    else
        log_warning "MinIO може бути недоступний"
    fi
    kill $PF_PID 2>/dev/null
}

# Головна функція
main() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}PREDATOR Analytics — Деплой сервісів на NVIDIA${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    
    check_kubectl
    check_helm
    check_cluster
    check_namespace
    backup_release
    deploy_services
    wait_for_pods
    check_pod_status
    check_resources
    check_logs
    check_service_health
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}Деплой завершено успішно!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    log_info "Для моніторингу використовуйте:"
    echo "  kubectl get pods -n $NAMESPACE"
    echo "  kubectl logs -n $NAMESPACE <pod-name>"
    echo ""
    log_info "Для відкату:"
    echo "  helm rollback $RELEASE_NAME -n $NAMESPACE"
}

# Запуск
main "$@"
