#!/bin/bash
# fix_openlens_imac.sh
# Автоматичне підключення OpenLens до iMac кластера

IMAC_IP="192.168.0.199"
KUBECONFIG_PATH="$HOME/.kube/config"

echo "🔗 Отримання kubeconfig з iMac..."
ssh imac-sovereign "export PATH=\$PATH:/opt/homebrew/bin:/usr/local/bin; k3d kubeconfig get predator-full-stack" > /tmp/new_imac_kubeconfig

if [ $? -eq 0 ]; then
    echo "⚙️ Налаштування IP адреси..."
    sed -i '' "s/0.0.0.0/$IMAC_IP/g" /tmp/new_imac_kubeconfig
    
    echo "📦 Оновлення локального kubeconfig..."
    # Використовуємо kubectl для злиття
    KUBECONFIG=$KUBECONFIG_PATH:/tmp/new_imac_kubeconfig kubectl config view --flatten > /tmp/merged_kubeconfig
    mv /tmp/merged_kubeconfig $KUBECONFIG_PATH
    
    echo "✅ Готово! Тепер вибери контекст 'k3d-predator-full-stack' в OpenLens."
else
    echo "❌ Помилка: Кластер на iMac ще не запущений або недоступний."
fi
