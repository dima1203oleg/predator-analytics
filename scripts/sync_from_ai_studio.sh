#!/bin/bash

# Скрипт для синхронізації файлів з Google AI Studio
# Вважає, що в папці ./ai-export є експортовані файли з AI Studio

set -e

echo "Перехід у корінь репозиторію..."
cd "$(dirname "$0")/.."

echo "Git pull з origin main..."
git pull origin main

echo "Копіювання файлів з ai-export..."

# Копіювати frontend, якщо є
if [ -d "ai-export/frontend" ]; then
    echo "Копіювання frontend..."
    cp -r ai-export/frontend/* frontend/ 2>/dev/null || mkdir -p frontend && cp -r ai-export/frontend/* frontend/
fi

# Копіювати backend, якщо є
if [ -d "ai-export/backend" ]; then
    echo "Копіювання backend..."
    cp -r ai-export/backend/* backend/ 2>/dev/null || mkdir -p backend && cp -r ai-export/backend/* backend/
fi

# Копіювати environments, якщо є конфіги
if [ -d "ai-export/environments" ]; then
    echo "Копіювання environments..."
    cp -r ai-export/environments/* environments/ 2>/dev/null || mkdir -p environments && cp -r ai-export/environments/* environments/
fi

echo "Git add змінених файлів..."
git add frontend/ backend/ environments/

echo "Git commit, якщо є зміни..."
if git diff --cached --quiet; then
    echo "Немає змін для коміту."
else
    git commit -m "Sync from AI Studio: $(date +%Y-%m-%d_%H:%M)"
fi

echo "Git push origin main..."
git push origin main

echo "Синхронізація завершена!"