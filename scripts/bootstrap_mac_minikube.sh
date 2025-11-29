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

echo "Запуск кластера minikube з 4 CPU, 8GB RAM та драйвером docker..."
# Драйвер docker підтримується на Mac M3; якщо проблеми — можна спробувати hyperkit
minikube start --cpus=4 --memory=8g --driver=docker

echo "Створення namespace argocd..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

echo "Завантаження та розгортання ArgoCD через офіційний install.yaml..."
# Завантажуємо останню версію install.yaml з офіційного репозиторію
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

echo "Очікування готовності ArgoCD..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "Збереження kubeconfig у файл kubeconfig-mac.yaml..."
cp ~/.kube/config kubeconfig-mac.yaml

echo "Інформація для доступу до ArgoCD:"
echo "Команда для port-forward: kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo "Після запуску port-forward, відкрийте https://localhost:8080 у браузері"

# Отримання admin-пароля
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "Admin-пароль ArgoCD: $ARGOCD_PASSWORD"
echo "Логін: admin"

echo "Скрипт завершено успішно!"