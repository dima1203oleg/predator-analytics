#!/bin/bash

# 🦅 PREDATOR ELITE — ULTIMATE NUCLEAR RESTORE (v63.0)
# Повне очищення + Автоматичне впорскування Google Gemini API Key.

GEMINI_KEY="AIzaSyBuj5g77wELqFJ52QrMUB-wJBZ7kFKHxkQ"
CURSOR_DATA="$HOME/Library/Application Support/Cursor"
STORAGE_FILE="$CURSOR_DATA/User/globalStorage/storage.json"
SETTINGS_FILE="$CURSOR_DATA/User/settings.json"
DB_FILE="$CURSOR_DATA/User/globalStorage/state.vscdb"

echo "☢️  PREDATOR: Запуск ядерного протоколу відновлення..."

# 1. ТЕРМІНАЦІЯ
echo "🛑 Зупиняю Cursor..."
pkill -9 -f "Cursor" || true
sleep 2

# 2. ОЧИЩЕННЯ (DEEP CLEAN)
echo "🧹 Видаляю кеші та сліди банів..."
rm -rf ~/Library/Caches/Cursor
rm -rf "$CURSOR_DATA/Cache"*
rm -rf "$CURSOR_DATA/CachedData"
rm -rf "$CURSOR_DATA/GPUCache"
rm -rf "$CURSOR_DATA/logs"
rm -rf "$HOME/.cursor"

# 3. РАНДОМІЗАЦІЯ ЗАЛІЗА
if [ -f "$STORAGE_FILE" ]; then
    echo "🔄 Рандомізація ідентифікаторів..."
    chmod +w "$STORAGE_FILE"
    NEW_ID1=$(uuidgen | tr '[:upper:]' '[:lower:]')
    NEW_ID2=$(uuidgen | tr '[:upper:]' '[:lower:]')
    NEW_ID3=$(uuidgen | tr '[:upper:]' '[:lower:]')
    
    jq --arg id1 "$NEW_ID1" --arg id2 "$NEW_ID2" --arg id3 "$NEW_ID3" \
    '.["telemetry.machineId"]=$id1 | .["telemetry.macMachineId"]=$id2 | .["telemetry.devDeviceId"]=$id3' \
    "$STORAGE_FILE" > "${STORAGE_FILE}.tmp" && mv "${STORAGE_FILE}.tmp" "$STORAGE_FILE"
fi

# 4. ВПОРСКУВАННЯ GEMINI API KEY
echo "💎 Впорскування Gemini API Key..."

# Оновлення settings.json (вмикаємо використання власного ключа)
if [ ! -f "$SETTINGS_FILE" ]; then echo "{}" > "$SETTINGS_FILE"; fi
chmod +w "$SETTINGS_FILE"
jq --arg key "$GEMINI_KEY" \
'.["cursor.cpp.enableGoogleGemini"] = true | 
 .["cursor.aichat.googleApiKey"] = $key | 
 .["cursor.general.usageMode"] = "user_api_key"' \
"$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

# Оновлення state.vscdb (прописуємо ключ у базу, якщо потрібно)
if [ -f "$DB_FILE" ]; then
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key = 'cursorAuth/googleApiKey';"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/googleApiKey', '$GEMINI_KEY');"
    sqlite3 "$DB_FILE" "UPDATE itemTable SET value = 'ultra' WHERE key = 'cursorAuth/stripeMembershipType';"
fi

echo "✅ ГОТОВО! Система Predator відновлена."
echo "🚀 Запустіть Cursor. Тепер він працює через ваш Gemini Key."
open -a /Applications/Cursor.app
