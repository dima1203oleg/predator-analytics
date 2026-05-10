#!/bin/bash

# PREDATOR ELITE - Ultimate Cursor Bypass (v63.0)
# Автоматизований інструмент для обходу trial-обмежень та впровадження Pro-статусу.

TOKEN="crsr_f9e8937ebd63dfecf06ea06270114a950f92e0d9ae8097b40a291544f3608a6f"
STORAGE_FILE="$HOME/Library/Application Support/Cursor/User/globalStorage/storage.json"
DB_FILE="$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"

echo "🦅 PREDATOR ELITE BYPASS: Ініціалізація..."

# 1. Термінація Cursor
echo "🛑 Зупиняю Cursor..."
pkill -9 "Cursor" || true
sleep 2

# 2. Очищення кешу
echo "🧹 Глибоке очищення кешу..."
rm -rf ~/Library/Caches/Cursor
rm -rf "$HOME/Library/Application Support/Cursor/Cache"*
rm -rf "$HOME/Library/Application Support/Cursor/CachedData"
rm -rf "$HOME/Library/Application Support/Cursor/Code Cache"
rm -rf "$HOME/Library/Application Support/Cursor/GPUCache"

# 3. Рандомізація ID у storage.json
if [ -f "$STORAGE_FILE" ]; then
    echo "🔄 Рандомізація ідентифікаторів у storage.json..."
    chmod +w "$STORAGE_FILE"
    
    NEW_MACHINE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    NEW_MAC_MACHINE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    NEW_DEV_DEVICE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    NEW_SQM_ID="{$(uuidgen | tr '[:upper:]' '[:lower:]')}"

    jq --arg m "$NEW_MACHINE_ID" \
       --arg mm "$NEW_MAC_MACHINE_ID" \
       --arg dd "$NEW_DEV_DEVICE_ID" \
       --arg sq "$NEW_SQM_ID" \
       '.["telemetry.machineId"] = $m | .["telemetry.macMachineId"] = $mm | .["telemetry.devDeviceId"] = $dd | .["telemetry.sqmId"] = $sq' \
       "$STORAGE_FILE" > "${STORAGE_FILE}.tmp" && mv "${STORAGE_FILE}.tmp" "$STORAGE_FILE"
    
    echo "✅ Нові ID встановлено: $NEW_MACHINE_ID"
else
    echo "⚠️ storage.json не знайдено, пропускаю."
fi

# 4. Патчинг бази даних state.vscdb (Впровадження Pro токена)
if [ -f "$DB_FILE" ]; then
    echo "💉 Впорскування Pro-токена у state.vscdb..."
    
    # Видаляємо старі ключі
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key = 'cursorAuth/accessToken';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key = 'cursorAuth/stripeMembershipType';"
    
    # Вставляємо нові значення
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/accessToken', '$TOKEN');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/stripeMembershipType', 'pro');"
    
    echo "✅ Токен впорскнуто. Статус: PRO."
else
    echo "❌ Помилка: Базу даних $DB_FILE не знайдено!"
fi

# 5. Захист від перезапису (опціонально)
# chmod 444 "$STORAGE_FILE" # Робимо файл тільки для читання

echo "✨ ПРЕДАТОР: Обхід завершено успішно!"
echo "🚀 Тепер запустіть Cursor та перевірте статус."
