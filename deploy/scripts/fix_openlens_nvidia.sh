#!/bin/bash
# fix_openlens_nvidia.sh
# Автоматичне підключення OpenLens до NVIDIA кластера

NVIDIA_IP="194.177.1.240"
KUBECONFIG_PATH="$HOME/.kube/config"

echo "🔗 Отримання kubeconfig з NVIDIA..."
ssh NVIDIA-sovereign "export PATH=\$PATH:/opt/homebrew/bin:/usr/local/bin; k3d kubeconfig get predator-full-stack" > /tmp/new_nvidia_kubeconfig

if [ $? -eq 0 ]; then
    echo "⚙️ Налаштування IP адреси..."
    sed -i '' "s/0.0.0.0/$NVIDIA_IP/g" /tmp/new_nvidia_kubeconfig
    
    echo "📦 Оновлення локального kubeconfig..."
    # Використовуємо kubectl для злиття
    KUBECONFIG=$KUBECONFIG_PATH:/tmp/new_nvidia_kubeconfig kubectl config view --flatten > /tmp/merged_kubeconfig
    mv /tmp/merged_kubeconfig $KUBECONFIG_PATH
    
    echo "✅ Готово! Тепер вибери контекст 'k3d-predator-full-stack' в OpenLens."
else
    echo "❌ Помилка: Кластер на NVIDIA ще не запущений або недоступний."
fi
