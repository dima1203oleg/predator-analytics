#!/bin/bash

# =============================================================================
# Sync from AI Studio to Local Repository
# Predator Analytics v19.0.0
# 
# Цей скрипт синхронізує зміни з AI Studio до локального репозиторію
# та пушить їх на GitHub для GitOps деплою
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Конфігурація
AI_STUDIO_PROJECT="${AI_STUDIO_PROJECT:-/path/to/ai-studio/project}"
BRANCH="${BRANCH:-main}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Predator Analytics - Sync from AI Studio                        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# 1. Перевірка git статусу
# =============================================================================
echo -e "${YELLOW}📋 Перевірка git статусу...${NC}"

cd "$REPO_ROOT"

if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Є незакомічені зміни в репозиторії${NC}"
    git status --short
    echo ""
    read -p "Продовжити? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# =============================================================================
# 2. Pull останні зміни з GitHub
# =============================================================================
echo ""
echo -e "${YELLOW}📥 Pull останні зміни з GitHub...${NC}"

git fetch origin
git pull origin "$BRANCH" --rebase || {
    echo -e "${RED}❌ Помилка при pull. Вирішіть конфлікти вручну.${NC}"
    exit 1
}

echo -e "${GREEN}✓ Pull успішний${NC}"

# =============================================================================
# 3. Синхронізація файлів з AI Studio (якщо вказано шлях)
# =============================================================================
if [ -d "$AI_STUDIO_PROJECT" ]; then
    echo ""
    echo -e "${YELLOW}🔄 Синхронізація з AI Studio...${NC}"
    
    # Список директорій для синхронізації
    SYNC_DIRS=(
        "backend/app"
        "frontend/src"
        "scripts"
    )
    
    for dir in "${SYNC_DIRS[@]}"; do
        if [ -d "$AI_STUDIO_PROJECT/$dir" ]; then
            echo "  → Синхронізую $dir"
            rsync -av --delete \
                --exclude='__pycache__' \
                --exclude='node_modules' \
                --exclude='.git' \
                --exclude='*.pyc' \
                --exclude='.env' \
                "$AI_STUDIO_PROJECT/$dir/" "$REPO_ROOT/$dir/"
        fi
    done
    
    echo -e "${GREEN}✓ Синхронізація завершена${NC}"
else
    echo ""
    echo -e "${YELLOW}ℹ️  AI Studio шлях не вказано (AI_STUDIO_PROJECT)${NC}"
    echo "   Пропускаю синхронізацію файлів"
fi

# =============================================================================
# 4. Перевірка Zero Simulation
# =============================================================================
echo ""
echo -e "${YELLOW}🔍 Zero Simulation Check...${NC}"

if [ -x "$SCRIPT_DIR/check_zero_simulation.sh" ]; then
    "$SCRIPT_DIR/check_zero_simulation.sh" || {
        echo -e "${RED}❌ Zero Simulation Check не пройдено!${NC}"
        exit 1
    }
else
    echo -e "${YELLOW}⚠️  Скрипт перевірки не знайдено${NC}"
fi

# =============================================================================
# 5. Commit та Push
# =============================================================================
echo ""
echo -e "${YELLOW}📤 Commit та Push...${NC}"

if [ -n "$(git status --porcelain)" ]; then
    git add -A
    
    # Формуємо commit message
    TIMESTAMP=$(date +"%Y-%m-%d %H:%M")
    CHANGED_FILES=$(git diff --cached --name-only | wc -l)
    
    COMMIT_MSG="sync: AI Studio update @ $TIMESTAMP

Changed files: $CHANGED_FILES
Source: AI Studio → GitHub
Environment: Multi-env GitOps"
    
    git commit -m "$COMMIT_MSG"
    git push origin "$BRANCH"
    
    echo -e "${GREEN}✓ Зміни запушені на GitHub${NC}"
else
    echo -e "${GREEN}ℹ️  Немає змін для commit${NC}"
fi

# =============================================================================
# 6. Тригер ArgoCD синхронізації (опційно)
# =============================================================================
echo ""
echo -e "${YELLOW}🔄 ArgoCD синхронізація...${NC}"

if command -v argocd &> /dev/null; then
    echo "  → Синхронізую ArgoCD applications..."
    
    for app in predator-macbook predator-nvidia predator-oracle; do
        argocd app sync "$app" --async 2>/dev/null || echo "  ⚠️  $app: не вдалося синхронізувати"
    done
else
    echo -e "${YELLOW}ℹ️  ArgoCD CLI не встановлено${NC}"
    echo "   Синхронізація відбудеться автоматично через webhook"
fi

# =============================================================================
# 7. Підсумок
# =============================================================================
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Синхронізація завершена!                                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "📌 GitHub: https://github.com/dima1203oleg/predator-analytics"
echo "📌 Branch: $BRANCH"
echo ""
echo "ArgoCD автоматично синхронізує зміни на всі 3 середовища:"
echo "  • MacBook (dev-local)"
echo "  • NVIDIA (lab-gpu)"
echo "  • Oracle (cloud-canary)"
echo ""
