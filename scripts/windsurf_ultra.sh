#!/bin/bash

# 🦅 PREDATOR ELITE — WINDSURF ULTRA BYPASS (v1.0)
# Повне очищення та впорскування статусу PRO/TEAM для Windsurf.

WINDSURF_DATA="$HOME/Library/Application Support/Windsurf"
DB_FILE="$WINDSURF_DATA/User/globalStorage/state.vscdb"
STORAGE_FILE="$WINDSURF_DATA/User/globalStorage/storage.json"

echo "🌊 WINDSURF: Активація протоколу ELITE..."

# 1. ТЕРМІНАЦІЯ
echo "🛑 Зупиняю Windsurf..."
pkill -9 -f "Windsurf" || true
sleep 2

# 2. ОЧИЩЕННЯ
echo "🧹 Очищення кешів та ідентифікаторів..."
rm -rf ~/Library/Caches/com.codeium.windsurf
rm -rf "$WINDSURF_DATA/Cache"*
rm -rf "$WINDSURF_DATA/logs"

# 3. РАНДОМІЗАЦІЯ МАШИНИ
if [ -f "$STORAGE_FILE" ]; then
    echo "🔄 Рандомізація Machine IDs..."
    NEW_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
    jq --arg id "$NEW_ID" '.["telemetry.machineId"]=$id | .["telemetry.macMachineId"]=$id' "$STORAGE_FILE" > "${STORAGE_FILE}.tmp" && mv "${STORAGE_FILE}.tmp" "$STORAGE_FILE"
fi

# 4. ВПОРСКУВАННЯ СТАТУСУ (STATE.VSCDB)
if [ -f "$DB_FILE" ]; then
    echo "💉 Впорскування статусу PRO..."
    
    # Видаляємо старі записи
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE '%membership%';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE '%isPro%';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE '%tier%';"
    
    # Впорскуємо нові ключі для Windsurf (Codeium)
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.membershipType', 'pro');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.isPro', 'true');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.activeTier', 'pro');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('codeium.userAccountType', 'team');"
    
    echo "✅ Статус PRO активовано в базі даних."
fi

# 5. ОЧИЩЕННЯ KEYCHAIN (Codeium зберігає токени там)
echo "🔑 Очищення застарілих токенів Keychain..."
security delete-generic-password -l "Windsurf Safe Storage" 2>/dev/null || true
security delete-generic-password -l "Codeium Safe Storage" 2>/dev/null || true

echo "✨ ГОТОВО! Windsurf оновлено до Ultra/Pro."
echo "🚀 Запустіть Windsurf та увійдіть (бажано з новим акаунтом)."
open -a /Applications/Windsurf.app
