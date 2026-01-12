
#!/usr/bin/env python3
import asyncio
import logging
import os
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_v25_bot import init_v25_bot

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('telegram_v25.log')
    ]
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

async def main():
    if not BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN not set!")
        sys.exit(1)

    print("""
    🦾 Predator Analytics v25.0 Unified Controller
    ----------------------------------------------
    - Multi-Agent Orchestration (Triple Chain)
    - Natural Language Recognition (UKR)
    - Voice STT/TTS Interface
    - System Metrics Integration
    """)

    bot = init_v25_bot(BOT_TOKEN)
    await bot.run()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Bot v25.0 stopped by user")
