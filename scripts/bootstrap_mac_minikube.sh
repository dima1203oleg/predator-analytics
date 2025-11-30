#!/bin/bash

# Скрипт для ініціалізації minikube та ArgoCD на MacBook Pro M3 (arm64)
# Цей скрипт встановлює необхідні інструменти, запускає кластер та розгортає ArgoCD

set -e  # Вихід при помилці

echo "Перевірка та встановлення minikube, kubectl та helm через Homebrew..."

# Перевірка та встановлення minikube
if ! command -v minikube &> /dev/null; then
    echo "Встановлюю minikube..."
    brew install minikube
else
    echo "minikube вже встановлено."
fi

# Перевірка та встановлення kubectl
if ! command -v kubectl &> /dev/null; then
    echo "Встановлюю kubectl..."
    brew install kubectl
else
    echo "kubectl вже встановлено."
fi

# Перевірка та встановлення helm
if ! command -v helm &> /dev/null; then
    echo "Встановлюю helm..."
    brew install helm
else
    echo "helm вже встановлено."
fi

DOCKER_RAM=$(docker system info --format '{{.MemTotal}}' 2>/dev/null | awk '{print int($1/1024/1024)}')
if [ -z "$DOCKER_RAM" ] || [ "$DOCKER_RAM" -lt 6000 ]; then
    RAM=3072
    echo "[INFO] Docker Desktop RAM: ${DOCKER_RAM:-unknown} MB. Запуск minikube з 3072MB RAM."
else
    RAM=8192
    echo "[INFO] Docker Desktop RAM: $DOCKER_RAM MB. Запуск minikube з 8192MB RAM."
fi

echo "Запуск кластера minikube з 4 CPU, $RAM MB RAM та драйвером docker..."
minikube start --cpus=4 --memory=${RAM}mb --driver=docker || {
    echo "\n[ERROR] Не вдалося запустити minikube з $RAM MB RAM. Спробуйте вручну: minikube start --memory=3072mb"
    exit 1
}

echo "Створення namespace argocd..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "Завантаження та розгортання ArgoCD через офіційний install.yaml..."
# Завантажуємо останню версію install.yaml з офіційного репозиторію
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Очікування готовності ArgoCD..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# In-cluster HTTP health-check for ArgoCD API (runs a temporary curl pod inside the cluster)
echo "Перевірка HTTP-здоров'я ArgoCD (in-cluster)..."
TRIES=20
SLEEP=5
HC_OK=0
for i in $(seq 1 "$TRIES"); do
    HC_POD="argocd-healthcheck-$(date +%s%N)"
    # run a short-lived pod that curls the internal service
    OUT=$(kubectl -n argocd run --rm --restart=Never --image=curlimages/curl "$HC_POD" --command -- sh -c 'curl -skS https://argocd-server:8080/healthz' 2>/dev/null || true)
    if [ -n "$OUT" ]; then
        echo "ArgoCD health endpoint response: $OUT"
        HC_OK=1
        break
    fi
    echo "  waiting for ArgoCD HTTP health (attempt $i/$TRIES) ..."
    sleep $SLEEP
done

if [ "$HC_OK" -ne 1 ]; then
    echo "⚠️  Попередження: не вдалось перевірити HTTP-здоров'я ArgoCD за $((TRIES*SLEEP))s. Подивіться логи: kubectl -n argocd logs deployment/argocd-server"
else
    echo "✅ ArgoCD HTTP health-check в порядку"
fi

echo "Збереження kubeconfig у файл kubeconfig-mac.yaml..."
cp ~/.kube/config kubeconfig-mac.yaml

echo "Інформація для доступу до ArgoCD:"
echo "Команда для port-forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "Після запуску port-forward, відкрийте https://localhost:8080 у браузері"

# Отримання admin-пароля — пробуємо кілька відомих імен секретів та ключів
echo "Отримую admin-пароль ArgoCD (перевірка відомих секретів)..."
ARGOCD_PASSWORD=""
for s in argocd-initial-admin-secret argocd-secret; do
    if kubectl -n argocd get secret "$s" >/dev/null 2>&1; then
        # спробуємо кілька ключів у секреті, які зустрічаються у різних версіях
        for key in password admin\.password; do
            val=$(kubectl -n argocd get secret "$s" -o jsonpath="{.data.$key}" 2>/dev/null || true)
            if [ -n "$val" ]; then
                # декодуємо base64 якщо потрібно
                if echo "$val" | base64 --decode >/dev/null 2>&1; then
                    ARGOCD_PASSWORD=$(echo "$val" | base64 --decode 2>/dev/null || true)
                else
                    ARGOCD_PASSWORD="$val"
                fi
                break 2
            fi
        done
    fi
done

if [ -n "$ARGOCD_PASSWORD" ]; then
    echo "Admin-пароль ArgoCD: $ARGOCD_PASSWORD"
    echo "Логін: admin"
else
    echo "Увага: не вдалося знайти admin-пароль у відомих секретах argocd (argocd-initial-admin-secret, argocd-secret)."
    echo "Виконайте: kubectl -n argocd get secrets і гляньте ім'я секрету для admin-пароля, або отримайте його вручну через kubectl describe secret <name> -n argocd"
fi

echo "Скрипт завершено успішно!"