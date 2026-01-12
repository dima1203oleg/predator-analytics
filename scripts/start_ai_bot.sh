#!/bin/bash
# Quick Launch Script for Predator AI Bot v3.0

echo "🚀 Запуск Predator AI Bot v3.0..."

# Activate venv if exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Check dependencies
python3 -m pip install -q google-generativeai aiogram python-dotenv psutil asyncpg redis

# Launch bot
python3 backend/orchestrator/agents/telegram_bot_v3.py
