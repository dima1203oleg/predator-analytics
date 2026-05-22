#!/bin/bash
# ═══════════════════════════════════════════════════
# Деплой frontend на NVIDIA сервер (K3s)
# ═══════════════════════════════════════════════════
set -e

SERVER="dima@194.177.1.240 -p 6666"
NAMESPACE="predator-v61"
POD_NAME=$(ssh -o StrictHostKeyChecking=no $SERVER "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && kubectl get pods -n $NAMESPACE | grep frontend | grep Running | awk '{print \$1}' | head -1")

echo "=== Копіювання dist на сервер ==="
rsync -avz --delete --rsh="ssh -F /Users/Shared/Predator_60/.ssh.config.optimized -o StrictHostKeyChecking=no" apps/predator-analytics-ui/dist/ predator-server:/tmp/predator-frontend-dist/

echo "=== Оновлення файлів в поді ==="
ssh -o StrictHostKeyChecking=no $SERVER "export KUBECONFIG=/etc/rancher/k3s/k3s.yaml && kubectl exec -n $NAMESPACE $POD_NAME -- rm -rf /usr/share/nginx/html/assets /usr/share/nginx/html/index.html /usr/share/nginx/html/sw.js /usr/share/nginx/html/manifest* /usr/share/nginx/html/registerSW.js /usr/share/nginx/html/workbox* && tar -czf - -C /tmp/predator-frontend-dist . | kubectl exec -i -n $NAMESPACE $POD_NAME -- tar -xzf - -C /usr/share/nginx/html/ && kubectl exec -n $NAMESPACE $POD_NAME -- nginx -s reload"

echo "=== Деплой завершено ==="
echo "Перевірка: https://30ditqc28551.share.zrok.io"
