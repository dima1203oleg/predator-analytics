#!/bin/bash
# 🦅 PREDATOR Analytics v55.1 — Перемикач контекстів (bin/predator-context.sh)

if [ "$1" = "imac" ]; then
    if [ ! -f ~/.kube/config-imac ]; then
        echo "❌ Помилка: ~/.kube/config-imac не знайдено!"
        echo "👉 Виконайте на MacBook: scp predator-server:~/.kube/config ~/.kube/config-imac"
        echo "👉 Потім замініть 127.0.0.1 на IP iMac у файлі ~/.kube/config-imac"
        return 1
    fi
    export KUBECONFIG=~/.kube/config-imac
    echo "🦅 [PREDATOR] Контекст змінено на iMac Cloud (k3d)"
    kubectl cluster-info | grep "Kubernetes control plane"
elif [ "$1" = "local" ]; then
    export KUBECONFIG=~/.kube/config
    echo "💻 [PREDATOR] Контекст змінено на Local MacBook"
    kubectl cluster-info | grep "Kubernetes control plane"
else
    echo "Використання: source bin/predator-context.sh [local|imac]"
    echo "Поточний контекст:"
    kubectl config current-context 2>/dev/null || echo "Контекст не встановлено"
fi
