#!/bin/bash

# Скрипт для синхронізації файлів з Google AI Studio
# Вважає, що в папці ./ai-export є експортовані файли з AI Studio

set -e

# Args: --dry-run (only show what would change) --yes (skip commit confirmation)
DRY_RUN=0
ASSUME_YES=0
while [ "$#" -gt 0 ]; do
    case "$1" in
        --dry-run) DRY_RUN=1; shift ;;
        --yes) ASSUME_YES=1; shift ;;
        -h|--help) echo "Usage: $0 [--dry-run] [--yes]"; exit 0 ;;
        *) echo "Unknown arg: $1"; echo "Usage: $0 [--dry-run] [--yes]"; exit 1 ;;
    esac
done

echo "Перехід у корінь репозиторію..."
cd "$(dirname "$0")/.."

# detect current branch and pull the same branch (safer for feature branches)
CURRENT_BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null || echo "main")
echo "Git pull from origin $CURRENT_BRANCH..."
git pull origin "$CURRENT_BRANCH"

echo "Копіювання файлів з ai-export..."

# Копіювати frontend, якщо є
if [ -d "ai-export/frontend" ]; then
    echo "Копіювання frontend..."
    mkdir -p frontend
    # rsync allows safer sync (deletes removed files when source changed)
    rsync -a --delete ai-export/frontend/ frontend/
fi
# Копіювати backend, якщо є
if [ -d "ai-export/backend" ]; then
    echo "Копіювання backend..."
    mkdir -p backend
    rsync -a --delete ai-export/backend/ backend/
fi

# Копіювати environments, якщо є конфіги
if [ -d "ai-export/environments" ]; then
    echo "Копіювання environments..."
    mkdir -p environments
    rsync -a --delete ai-export/environments/ environments/
fi

echo "Git add змінених файлів..."
# Build list of paths that exist before adding to git (avoid git pathspec errors)
ADD_PATHS=()
for p in frontend backend environments; do
    if [ -d "$p" ]; then
        ADD_PATHS+=("$p/")
    fi
done

    if [ ${#ADD_PATHS[@]} -eq 0 ]; then
    echo "Немає змінних папок для додавання (frontend/backend/environments не існують)."
    else
        echo "Додаю для гіта: ${ADD_PATHS[*]}"
        if [ "$DRY_RUN" -eq 1 ]; then
            echo "--dry-run: пропускаю git add/commit/push (лише покажу зміни)..."
        else
            git add "${ADD_PATHS[@]}"
        fi
    fi

echo "Git commit, якщо є зміни..."
if git diff --cached --quiet; then
    echo "Немає змін для коміту."
else
        if [ "$DRY_RUN" -eq 1 ]; then
        echo "--dry-run: є зміни для коміту. Ось список змінених файлів:" 
        git --no-pager diff --name-only --cached || true
    else
        if [ "$ASSUME_YES" -eq 0 ]; then
            read -p "Є зміни — виконати git commit і push? [y/N]: " yn
            case "$yn" in
                [Yy]* ) ;;
                * ) echo "Відмінено користувачем."; exit 0 ;;
            esac
        fi
        git commit -m "Sync from AI Studio: $(date +%Y-%m-%d_%H:%M)" || true
        echo "Git push origin $CURRENT_BRANCH..."
        git push origin "$CURRENT_BRANCH"
    fi
fi

echo "Синхронізація завершена!"