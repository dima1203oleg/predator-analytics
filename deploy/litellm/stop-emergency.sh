#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🛑 STOP EMERGENCY MODE
# ═══════════════════════════════════════════════════════════════

echo "🛑 Зупиняємо EMERGENCY MODE..."
echo "═══════════════════════════════════════════════════════════════"

cd "$(dirname "$0")"

# Зупинити Docker контейнер
echo "1️⃣  Зупиняємо ULTRA-ROUTER..."
docker-compose -f docker-compose-router.yml down

# Зупинити Ollama
echo "2️⃣  Зупиняємо Ollama..."
pkill -f "ollama serve" || echo "⚠️  Ollama не запущена"

echo ""
echo "✅ EMERGENCY MODE зупинено!"
echo ""
echo "Коли NVIDIA повернеться:"
echo "  Все автоматично переключиться назад на NVIDIA"
echo "  (дякуючи fallback механізму в .env.remote)"
