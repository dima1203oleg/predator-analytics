#!/bin/bash

# 🦅 PREDATOR ELITE — WINDSURF NUCLEAR PRO (v2.0)
# Повне очищення, рандомізація заліза та активація PRO для Windsurf.

WINDSURF_DATA="$HOME/Library/Application Support/Windsurf"
DB_FILE="$WINDSURF_DATA/User/globalStorage/state.vscdb"
STORAGE_FILE="$WINDSURF_DATA/User/globalStorage/storage.json"
MACHINE_FILE="$WINDSURF_DATA/machineid"

echo "☢️  WINDSURF: Запуск ядерного протоколу PRO..."

# 1. ТЕРМІНАЦІЯ
echo "🛑 Зупиняю Windsurf..."
pkill -9 -f "Windsurf" || true
pkill -9 -f "Codeium" || true
sleep 2

# 2. ГЛИБОКЕ ОЧИЩЕННЯ
echo "🧹 Видаляю старі сесії та кеші..."
rm -rf ~/Library/Caches/com.codeium.windsurf
rm -rf "$WINDSURF_DATA/Cache"*
rm -rf "$WINDSURF_DATA/CachedData"
rm -rf "$WINDSURF_DATA/User/globalStorage"/*
rm -rf "$HOME/.codeium"

# 3. РАНДОМІЗАЦІЯ ЗАЛІЗА (Це найважливіше для нового тріалу)
echo "🔄 Рандомізація Machine ID..."
NEW_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "$NEW_UUID" > "$MACHINE_FILE"

if [ -f "$STORAGE_FILE" ]; then
    chmod +w "$STORAGE_FILE"
    jq --arg id "$NEW_UUID" '.["telemetry.machineId"]=$id | .["telemetry.macMachineId"]=$id | .["telemetry.devDeviceId"]=$id' \
    "$STORAGE_FILE" > "${STORAGE_FILE}.tmp" && mv "${STORAGE_FILE}.tmp" "$STORAGE_FILE"
fi

# 4. ОЧИЩЕННЯ KEYCHAIN
echo "🔑 Видаляю зашифровані токени..."
security delete-generic-password -l "Windsurf Safe Storage" 2>/dev/null || true
security delete-generic-password -l "Codeium Safe Storage" 2>/dev/null || true

# 5. ВПОРСКУВАННЯ PRO СТАТУСУ В НОВУ БАЗУ
echo "💉 Підготовка локального PRO-статусу..."
mkdir -p "$(dirname "$DB_FILE")"
sqlite3 "$DB_FILE" "CREATE TABLE itemTable (key TEXT PRIMARY KEY, value TEXT);"
sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.membershipType', '\"pro\"');"
sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.isPro', 'true');"
sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.activeTier', '\"pro\"');"
sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.userAccountType', '\"team\"');"

echo "✅ ГОТОВО! Windsurf скинуто до заводських налаштувань з PRO-профілем."
echo "🚀 ВАЖЛИВО: Використовуйте НОВУ пошту та VPN при першому вході."
open -a /Applications/Windsurf.app
