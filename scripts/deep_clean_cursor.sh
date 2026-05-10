#!/bin/bash

# PREDATOR ELITE — Deep Clean & Ultra Bypass
# Очищення кешів Extension Host та встановлення статусу ULTRA.

CURSOR_DATA="$HOME/Library/Application Support/Cursor"
DB_FILE="$CURSOR_DATA/User/globalStorage/state.vscdb"
STORAGE_FILE="$CURSOR_DATA/User/globalStorage/storage.json"
TOKEN="crsr_d3527a32b6269b0d60d722bf1fd8e0d35c693073b88f0652f18faa83fd4a48bc"

echo "🦅 PREDATOR: Глибоке очищення та ULTRA Bypass..."
echo "================================================"

# 1. Термінація Cursor
echo "🛑 [1/6] Зупинка Cursor..."
pkill -9 -f "Cursor" 2>/dev/null || true
sleep 3

# 2. Очищення кешів (основних)
echo "🧹 [2/6] Очищення кешів..."
rm -rf ~/Library/Caches/Cursor
rm -rf "$CURSOR_DATA/Cache"
rm -rf "$CURSOR_DATA/CachedData"
rm -rf "$CURSOR_DATA/CachedExtensions"
rm -rf "$CURSOR_DATA/CachedExtensionVSIXs"
rm -rf "$CURSOR_DATA/Code Cache"
rm -rf "$CURSOR_DATA/GPUCache"
rm -rf "$CURSOR_DATA/Service Worker"
rm -rf "$CURSOR_DATA/WebStorage"
rm -rf "$CURSOR_DATA/blob_storage"
rm -rf "$CURSOR_DATA/Session Storage"
rm -rf "$CURSOR_DATA/Local Storage"
rm -rf "$CURSOR_DATA/IndexedDB"
rm -rf "$CURSOR_DATA/DawnCache"
rm -rf "$CURSOR_DATA/DawnWebGPUCache"

# 3. Очищення Extension Host logs
echo "📋 [3/6] Очищення логів Extension Host..."
rm -rf "$CURSOR_DATA/logs"
rm -rf "$CURSOR_DATA/exthost Crash Reports"

# 4. Очищення workspace storage
echo "🗂️  [4/6] Очищення workspace storage..."
find "$CURSOR_DATA/User/workspaceStorage" -name "*.vscdb-journal" -delete 2>/dev/null
find "$CURSOR_DATA/User/workspaceStorage" -name "*.vscdb-wal" -delete 2>/dev/null

# 5. Рандомізація ID
if [ -f "$STORAGE_FILE" ]; then
    echo "🔄 [5/6] Рандомізація ідентифікаторів..."
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
    echo "   ✅ Новий machineId: $NEW_MACHINE_ID"
fi

# 6. Впровадження Ultra-статусу
if [ -f "$DB_FILE" ]; then
    echo "💉 [6/6] Впровадження ULTRA-статусу..."
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE 'cursorAuth/accessToken';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE 'cursorAuth/stripeMembershipType';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE 'cursorAuth/stripeSubscriptionStatus';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE 'cursorAuth/cachedHasActiveSubscription';"
    sqlite3 "$DB_FILE" "DELETE FROM itemTable WHERE key LIKE 'cursorAuth/cachedMembershipType';"
    
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/accessToken', '$TOKEN');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/stripeMembershipType', 'ultra');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/stripeSubscriptionStatus', 'active');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/cachedHasActiveSubscription', 'true');"
    sqlite3 "$DB_FILE" "INSERT INTO itemTable (key, value) VALUES ('cursorAuth/cachedMembershipType', 'ultra');"
    echo "   ✅ ULTRA-статус встановлено."
fi

echo ""
echo "================================================"
echo "✨ ГОТОВО! Cursor повністю очищено та оновлено до ULTRA."
echo "🚀 Запустіть Cursor заново."
echo "================================================"
