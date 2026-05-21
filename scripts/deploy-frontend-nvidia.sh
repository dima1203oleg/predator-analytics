#!/bin/bash
# ═══════════════════════════════════════════════════
# Деплой frontend на NVIDIA сервер (K3s)
# ═══════════════════════════════════════════════════
set -e

SERVER="dima@194.177.1.240 -p 6666"
NAMESPACE="predator-v61"
POD_NAME=$(ssh -o StrictHostKeyChecking=no $SERVER "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && kubectl get pods -n $NAMESPACE | grep frontend | grep Running | awk '{print \$1}' | head -1")

echo "=== Копіювання dist на сервер ==="
rsync -avz --delete apps/predator-analytics-ui/dist/ $SERVER:/tmp/predator-frontend-dist/

echo "=== Оновлення файлів в поді ==="
ssh -o StrictHostKeyChecking=no $SERVER "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && kubectl cp /tmp/predator-frontend-dist/ $NAMESPACE/$POD_NAME:/usr/share/nginx/html/ && kubectl exec -n $NAMESPACE $POD_NAME -- nginx -s reload"

echo "=== Деплой завершено ==="
echo "Перевірка: https://30ditqc28551.share.zrok.io"
