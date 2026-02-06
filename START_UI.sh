#!/bin/bash
# ===========================================
# 🎯 PREDATOR Analytics v30 - Quick Start
# ===========================================

echo "🚀 Запуск PREDATOR Analytics UI..."
cd /Users/dima-mac/Documents/Predator_21/apps/predator-analytics-ui

echo ""
echo "📦 Встановлення залежностей..."
npm install --legacy-peer-deps

echo ""
echo "🌐 UI доступний на: http://localhost:3030"
echo "   Ctrl+C щоб зупинити"
echo ""

npm run dev -- --port 3030 --host
