#!/bin/bash

# Скрипт для ініціалізації k3s та ArgoCD на NVIDIA-сервері
# Запускати на NVIDIA-сервері з sudo

set -e

echo "Перевірка та встановлення k3s..."

# Перевірка, чи k3s вже встановлено
if ! command -v k3s &> /dev/null; then
    echo "Встановлюю k3s..."
    curl -sfL https://get.k3s.io | sh -
    # Дочекатися запуску
    sleep 10
else
    echo "k3s вже встановлено."
fi

echo "Перевірка kubectl..."
# k3s має свій kubectl
if ! command -v kubectl &> /dev/null; then
    echo "kubectl не знайдено, використовую k3s kubectl..."
    alias kubectl='k3s kubectl'
fi

echo "Створення namespace argocd..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "Завантаження та розгортання ArgoCD через install.yaml..."
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Очікування готовності ArgoCD..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "Інформація для доступу до ArgoCD:"
echo "Команда для port-forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "Після запуску port-forward, відкрийте https://localhost:8080 у браузері"

# Отримання admin-пароля
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "Admin-пароль ArgoCD: $ARGOCD_PASSWORD"
echo "Логін: admin"

echo "Збереження kubeconfig у файл kubeconfig-nvidia.yaml..."
cp /etc/rancher/k3s/k3s.yaml kubeconfig-nvidia.yaml
# Змінити server на зовнішній IP, якщо потрібно

echo "Скрипт завершено успішно!"