#!/bin/bash
# 🛸 PREDATOR BACKEND CLEAN BOOT
# Bypasses macOS Documents folder locks by running from /tmp

TMP_DIR="/tmp/predator_backend_launch"
SOURCE_DIR="/Users/dima-mac/Documents/Predator_21"

echo "🛸 Initializing clean backend environment in $TMP_DIR..."
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR/services"
mkdir -p "$TMP_DIR/libs"

echo "📂 Copying source files (Backend, Libs, Scripts)..."
cp -R "$SOURCE_DIR/services/api-gateway" "$TMP_DIR/services/"
cp -R "$SOURCE_DIR/libs" "$TMP_DIR/"
cp -R "$SOURCE_DIR/scripts" "$TMP_DIR/"
cp "$SOURCE_DIR/.env" "$TMP_DIR/" 2>/dev/null || true

cd "$TMP_DIR"

# Create a fresh venv because the one in Documents is broken/locked
echo "🐍 Creating clean Python 3.12 environment..."
/usr/bin/python3 -m venv .venv 2>/dev/null || python3 -m venv .venv
source .venv/bin/activate

echo "📦 Installing critical dependencies..."
# Use --break-system-packages if needed, but in venv it's fine
pip install --upgrade pip
pip install fastapi uvicorn sqlalchemy asyncpg pydantic-settings redis python-multipart telethon certifi

# Set Path
export PYTHONPATH="$TMP_DIR:$TMP_DIR/services/api-gateway"
export DATABASE_URL="postgresql+asyncpg://admin:666666@localhost:5432/predator_db" # Assuming localhost for now

echo "🚀 Launching Backend on port 9080..."
cd services/api-gateway
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 9080 --reload &

echo "🦅 Launching Telegram Sentinel..."
cd "$TMP_DIR"
python3 scripts/run_telegram_monitor.py &

echo "✅ Backend and Parser are starting in the background."
echo "Check logs if the UI still shows offline."
