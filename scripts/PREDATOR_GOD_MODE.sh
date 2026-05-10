#!/bin/bash

# ==============================================================================
# 🦅 PREDATOR ELITE — OMNI-NUCLEAR GOD MODE (v63.0)
# Абсолютна зброя: Скидає та "заряджає" на MAX одразу і Cursor, і Windsurf.
# ==============================================================================

echo "☢️  ІНІЦІАЛІЗАЦІЯ OMNI-NUCLEAR GOD MODE..."
echo "=============================================================================="

# 🛑 1. ПОВНА ТЕРМІНАЦІЯ
echo "🛑 [1/5] Зупинка всіх процесів IDE..."
pkill -9 -f "Cursor" || true
pkill -9 -f "Windsurf" || true
pkill -9 -f "Codeium" || true
sleep 2

# 🧹 2. ГЛИБОКЕ ОЧИЩЕННЯ
echo "🧹 [2/5] Знищення кешів, сесій та телеметрії..."
# Cursor
rm -rf ~/Library/Application\ Support/Cursor/Cache*
rm -rf ~/Library/Application\ Support/Cursor/Code\ Cache
rm -rf ~/Library/Application\ Support/Cursor/DawnCache
rm -rf ~/Library/Application\ Support/Cursor/GPUCache
rm -rf ~/Library/Application\ Support/Cursor/User/workspaceStorage/*
rm -rf ~/Library/Application\ Support/Cursor/User/globalStorage/storage.json
# Windsurf
WINDSURF_DATA="$HOME/Library/Application Support/Windsurf"
rm -rf ~/Library/Caches/com.codeium.windsurf
rm -rf "$WINDSURF_DATA/Cache"*
rm -rf "$WINDSURF_DATA/CachedData"
rm -rf "$WINDSURF_DATA/User/globalStorage"/*
rm -rf "$HOME/.codeium"

# 🔑 3. ОЧИЩЕННЯ KEYCHAIN
echo "🔑 [3/5] Видалення криптографічних токенів (Keychain)..."
security delete-generic-password -l "Windsurf Safe Storage" 2>/dev/null || true
security delete-generic-password -l "Codeium Safe Storage" 2>/dev/null || true
security delete-generic-password -s "Cursor Safe Storage" 2>/dev/null || true

# 🔄 4. РАНДОМІЗАЦІЯ ЗАЛІЗА (SPOOFING)
echo "🔄 [4/5] Рандомізація Machine IDs (Апаратний спуфінг)..."
# Cursor Spoofing
NEW_MAC_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_MACHINE_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
NEW_DEV_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
CURSOR_STORAGE="$HOME/Library/Application Support/Cursor/User/globalStorage/storage.json"
mkdir -p "$(dirname "$CURSOR_STORAGE")"
cat <<EOF > "$CURSOR_STORAGE"
{
  "telemetry.macMachineId": "$NEW_MAC_ID",
  "telemetry.machineId": "$NEW_MACHINE_ID",
  "telemetry.devDeviceId": "$NEW_DEV_ID"
}
EOF

# Windsurf Spoofing
NEW_WIND_UUID=$(uuidgen | tr '[:upper:]' '[:lower:]')
echo "$NEW_WIND_UUID" > "$WINDSURF_DATA/machineid"

# 💎 5. ВПОРСКУВАННЯ ELITE СТАТУСУ
echo "💎 [5/5] Впорскування PRO та API ключів..."

# Cursor: Gemini Key + Ultra
CURSOR_DB="$HOME/Library/Application Support/Cursor/User/globalStorage/state.vscdb"
sqlite3 "$CURSOR_DB" "UPDATE itemTable SET value = '\"AIzaSyBuj5g77wELqFJ52QrMUB-wJBZ7kFKHxkQ\"' WHERE key = 'cursor.geminiApiKey';" 2>/dev/null || true
sqlite3 "$CURSOR_DB" "INSERT OR IGNORE INTO itemTable (key, value) VALUES ('cursor.geminiApiKey', '\"AIzaSyBuj5g77wELqFJ52QrMUB-wJBZ7kFKHxkQ\"');"
sqlite3 "$CURSOR_DB" "UPDATE itemTable SET value = '3' WHERE key = 'cursorAuth/stripeMembershipType';" 2>/dev/null || true

# Windsurf: MAX State
WINDSURF_DB="$WINDSURF_DATA/User/globalStorage/state.vscdb"
mkdir -p "$(dirname "$WINDSURF_DB")"
sqlite3 "$WINDSURF_DB" "CREATE TABLE IF NOT EXISTS itemTable (key TEXT PRIMARY KEY, value TEXT);"
sqlite3 "$WINDSURF_DB" "INSERT OR REPLACE INTO itemTable (key, value) VALUES ('codeium.membershipType', '\"max\"');"
sqlite3 "$WINDSURF_DB" "INSERT OR REPLACE INTO itemTable (key, value) VALUES ('codeium.isPro', 'true');"
sqlite3 "$WINDSURF_DB" "INSERT OR REPLACE INTO itemTable (key, value) VALUES ('codeium.activeTier', '\"max\"');"
sqlite3 "$WINDSURF_DB" "INSERT OR REPLACE INTO itemTable (key, value) VALUES ('codeium.userAccountType', '\"team\"');"

echo "=============================================================================="
echo "✨ АБСОЛЮТНА ПЕРЕМОГА! СИСТЕМУ ПЕРЕЗАВАНТАЖЕНО."
echo "=============================================================================="
echo "🎯 CURSOR: Повністю готовий. Безлімітний Sovereign Mode (Gemini) активовано."
echo "🌊 WINDSURF: ID скинуто до нуля. База налаштована на PRO."
echo ""
echo "⚠️  ДЛЯ WINDSURF:"
echo "1. Увімкніть МОБІЛЬНИЙ ІНТЕРНЕТ (Hotspot)."
echo "2. Відкрийте Windsurf."
echo "3. Зареєструйте НОВИЙ Gmail акаунт через браузер в режимі INCOGNITO."
echo "   (Якщо запитає картку - введіть віртуальну пустушку з Привату)."
echo "=============================================================================="
