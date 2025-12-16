#!/bin/bash
# Script to consolidate Telegram bot files and cleanup legacy code

echo "Backing up old Telegram files..."
mkdir -p apps/self-improve-orchestrator/legacy_telegram
cp apps/self-improve-orchestrator/telegram_*.py apps/self-improve-orchestrator/legacy_telegram/ 2>/dev/null || echo "No files to backup"

echo "Creating launcher for new Modular Bot..."
cat <<EOF > apps/self-improve-orchestrator/run_bot.py
import asyncio
import os
import sys

# Ensure we can import from parent directories
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from telegram.bot import main

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
EOF

echo "Done. You can now run the bot with: python apps/self-improve-orchestrator/run_bot.py"
