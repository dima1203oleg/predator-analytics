#!/bin/bash

###############################################################################
# MCP Platform на NVIDIA (34.185.226.240) - Команди для управління
###############################################################################

KUBECONFIG="/Users/dima-mac/Documents/Predator_21/kubeconfig_remote"
NAMESPACE="mcp-platform"
NVIDIA_IP="34.185.226.240"

export KUBECONFIG

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  MCP Platform - Статус на NVIDIA ($NVIDIA_IP)            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "1️⃣  Статус подів:"
kubectl -n "$NAMESPACE" get pods 2>/dev/null || echo "❌ Namespace ще не готовий"

echo ""
echo "2️⃣  Статус сервісів:"
kubectl -n "$NAMESPACE" get svc 2>/dev/null || echo "❌ Сервіси не розгорнені"

echo ""
echo "3️⃣  Статус deployment:"
kubectl -n "$NAMESPACE" get deployment 2>/dev/null || echo "❌ Deployments не розгорнені"

echo ""
echo "4️⃣  Events:"
kubectl -n "$NAMESPACE" get events --sort-by='.lastTimestamp' 2>/dev/null | tail -10 || echo "❌ Events недоступні"

echo ""
echo "5️⃣  Логи (останні 20 рядків):"
POD=$(kubectl -n "$NAMESPACE" get pods -o name | head -1 2>/dev/null)
if [ -n "$POD" ]; then
  kubectl -n "$NAMESPACE" logs "$POD" --tail=20 2>/dev/null
else
  echo "❌ Жодного пода не знайдено"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  КОРИСНІ КОМАНДИ                           ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Стежити за логами в реальному часі:                       ║"
echo "║  kubectl -n $NAMESPACE logs -f deployment/mcp-platform    ║"
echo "║                                                            ║"
echo "║ Підключитися до контейнера:                               ║"
echo "║  kubectl -n $NAMESPACE exec -it <pod-name> -- bash       ║"
echo "║                                                            ║"
echo "║ Port-forward для локального доступу:                      ║"
echo "║  kubectl -n $NAMESPACE port-forward svc/mcp-platform \\\  ║"
echo "║    8000:8000                                              ║"
echo "║                                                            ║"
echo "║ Видалити deployment:                                      ║"
echo "║  helm uninstall mcp-platform -n $NAMESPACE               ║"
echo "╚════════════════════════════════════════════════════════════╝"
