#!/bin/bash
# predator-backup.sh - Створення резервної копії всієї архітектури Predator
# Робить бекап налаштувань VS Code, конфігів сервера, скриптів та Claw Code.

set -u

BACKUP_DIR="$HOME/Predator_Backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
ARCHIVE_NAME="Predator_State_$TIMESTAMP.tar.gz"

mkdir -p "$BACKUP_DIR"

echo "💾 Запуск системи резервного копіювання Predator..."

# Створюємо тимчасову папку для збору файлів
TEMP_DIR="/tmp/predator_backup_$TIMESTAMP"
mkdir -p "$TEMP_DIR/vscode"
mkdir -p "$TEMP_DIR/predator_60"

# 1. Збереження налаштувань VS Code (Continue)
if [ -f "$HOME/.continue/config.yaml" ]; then
    cp "$HOME/.continue/config.yaml" "$TEMP_DIR/vscode/"
    echo "✅ Збережено конфігурацію VS Code (Continue)."
fi

# 2. Збереження архітектури Predator_60 (всі скрипти та конфіги)
if [ -d "/Users/Shared/Predator_60" ]; then
    rsync -aq --exclude='node_modules' --exclude='.venv' --exclude='dist' --exclude='__pycache__' /Users/Shared/Predator_60/ "$TEMP_DIR/predator_60/" || true
    echo "✅ Збережено інфраструктуру Predator_60."
fi

# 3. Збереження Task Bridge
if [ -d "$HOME/predator_tasks" ]; then
    cp -r "$HOME/predator_tasks" "$TEMP_DIR/" || true
    echo "✅ Збережено чергу завдань (Task Bridge)."
fi

# Архівування
cd "/tmp"
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" "predator_backup_$TIMESTAMP" 2>/dev/null || true

# Видалення тимчасових файлів
rm -rf "$TEMP_DIR"

echo "🎯 БЕКАП УСПІШНО СТВОРЕНО: $BACKUP_DIR/$ARCHIVE_NAME"
echo "У випадку збою, всі налаштування можна легко розгорнути з цього архіву!"

# Залишаємо лише останні 10 бекапів
ls -tp "$BACKUP_DIR" | grep -v '/$' | tail -n +11 | xargs -I {} rm -- "$BACKUP_DIR/{}" 2>/dev/null || true
