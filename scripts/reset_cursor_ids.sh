#!/bin/bash

# PREDATOR ELITE - Cursor Identity Randomizer
# Цей скрипт скидає ідентифікатори Cursor IDE для обходу фінгерпринтингу.

STORAGE_FILE="$HOME/Library/Application Support/Cursor/User/globalStorage/storage.json"
BACKUP_FILE="${STORAGE_FILE}.bak_$(date +%Y%m%d_%H%M%S)"

echo "🦅 PREDATOR: Починаю процес рандомізації ідентифікаторів..."

if [ ! -f "$STORAGE_FILE" ]; then
    echo "❌ Помилка: Файл конфігурації не знайдено: $STORAGE_FILE"
    exit 1
fi

# Створення бекапу
cp "$STORAGE_FILE" "$BACKUP_FILE"
echo "✅ Бекап створено: $BACKUP_FILE"

# Генерація нових UUID
NEW_MACHINE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_MAC_MACHINE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_DEV_DEVICE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_SQM_ID="{$(uuidgen | tr '[:upper:]' '[:lower:]')}"

echo "🔄 Генерую нові ідентифікатори..."
echo "   machineId: $NEW_MACHINE_ID"

# Оновлення JSON за допомогою jq
jq --arg m "$NEW_MACHINE_ID" \
   --arg mm "$NEW_MAC_MACHINE_ID" \
   --arg dd "$NEW_DEV_DEVICE_ID" \
   --arg sq "$NEW_SQM_ID" \
   '.["telemetry.machineId"] = $m | .["telemetry.macMachineId"] = $mm | .["telemetry.devDeviceId"] = $dd | .["telemetry.sqmId"] = $sq' \
   "$STORAGE_FILE" > "${STORAGE_FILE}.tmp" && mv "${STORAGE_FILE}.tmp" "$STORAGE_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Ідентифікатори успішно оновлено!"
    echo "⚠️  ВАЖЛИВО: Повністю перезапустіть Cursor для застосування змін."
else
    echo "❌ Помилка під час оновлення файлу."
    mv "$BACKUP_FILE" "$STORAGE_FILE"
    exit 1
fi

# Опціонально: Очищення кешу
echo "🧹 Очистити кеш Cursor? (y/n)"
# В автономному режимі ми не можемо чекати на ввід, тому просто попередимо
echo "💡 Рекомендується також видалити ~/Library/Caches/Cursor вручну."
