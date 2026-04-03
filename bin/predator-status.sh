#!/bin/bash
# 🦅 PREDATOR Analytics v55.1 — Моніторинг статусу (bin/predator-status.sh)

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 ДІАГНОСТИКА PREDATOR HYBRID CLOUD"
echo "═══════════════════════════════════════════════════════════════"

# 1. Поточний контекст
CONTEXT=$(kubectl config current-context 2>/dev/null)
echo "📍 Поточний контекст: ${CONTEXT:-Не встановлено}"

# 2. Перевірка Docker
if docker info >/dev/null 2>&1; then
    echo "🐳 Docker: ✅ Запущено"
else
    echo "🐳 Docker: ❌ Не запущено!"
fi

# 3. Перевірка k3d кластера
if k3d cluster list | grep -q "predator-local"; then
    STATUS=$(k3d cluster list predator-local --no-headers | awk '{print $3}')
    echo "🏗️  k3d [predator-local]: ✅ ${STATUS}"
else
    echo "🏗️  k3d [predator-local]: ❌ Не знайдено!"
fi

# 4. Стан Kubernetes Nodes
echo "🖥️  Вузли кластера:"
kubectl get nodes 2>/dev/null || echo "   ❌ Кластер недоступний"

# 5. Стан Frontend (Service)
echo "🌐 Стан Frontend (3030):"
kubectl get pods -n predator -l app=frontend -o wide 2>/dev/null || echo "   ❌ Фронтенд не розгорнуто"

# 6. Перевірка Persistence (PVC)
echo "💾 Постійне сховище (PVC):"
kubectl get pvc -n predator 2>/dev/null || echo "   ℹ️  PVC не знайдено (можливо, БД ще не деплоїлась)"

echo "═══════════════════════════════════════════════════════════════"
echo "👉 Порада: Якщо вузли 'NotReady', почекайте 1-2 хвилини."
echo "👉 Для детальних логів: kubectl logs -n predator -l app=frontend -f"
echo "═══════════════════════════════════════════════════════════════"
