#!/usr/bin/env python3
"""🦅 PREDATOR SENTINEL: Telegram Monitor Service
Running continuously to intercept intelligence.
"""

import asyncio
from datetime import datetime
import logging
import os
import random
import sys
import time

# Adjust path to access app modules
sys.path.append(os.path.join(os.getcwd(), 'services/api_gateway'))

from sqlalchemy import select

from app.connectors.telegram_channel import telegram_channel_connector
from app.models import DataSource
from app.services.customs_service import customs_service
from libs.core.database import get_db_ctx

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - [SENTINEL] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("telegram_sentinel")

TARGET_CHANNELS = [
    "Customs_of_Ukraine",
    "ne_mytnytsya",
    "robert_ua"
]

async def mock_surveillance_loop():
    """Fallback loop if no credentials provided."""
    logger.warning("⚠️ No Telegram Credentials found! Running in SIMULATION MODE.")
    logger.info("Generating synthetic intelligence reports...")

    while True:
        await asyncio.sleep(10) # Generate every 10 seconds

        fake_news = [
            "Нові правила оформлення гуманітарної допомоги на кордоні з Польщею.",
            "Затримки в порту Констанца через погодні умови. Очікується зміщення графіків.",
            "Зміни в керівництві Одеської митниці. Новий в.о. начальника приступив до виконання.",
            "Виявлено спробу контрабанди техніки Apple на пункті пропуску Краківець.",
            "Увага! Оновлення класифікатора УКТЗЕД з 1 березня."
        ]

        msg = {
            "id": int(time.time()),
            "channel_name": random.choice(TARGET_CHANNELS),
            "text": random.choice(fake_news),
            "date": datetime.now(),
            "views": random.randint(100, 5000)
        }

        logger.info(f"Generated synthetic report: {msg['text'][:50]}...")
        await customs_service.ingest_intelligence([msg], source="telegram_simulation")

async def active_surveillance_loop():
    """Real monitoring loop using Telethon (User Client) or Bot API."""
    logger.info("🕵️‍♂️ Starting Active Surveillance...")

    # Check for credentials again (in case they were added at runtime)
    # Re-initialize connector to pick up new env vars if any
    if not telegram_channel_connector.is_configured:
         # Try to refresh from env
         import importlib

         from app.connectors import telegram_channel
         importlib.reload(telegram_channel)

    if not telegram_channel_connector.is_configured:
        logger.error("❌ Credentials still missing. Falling back to Mock Mode.")
        await mock_surveillance_loop()
        return

    logger.info("✅ Credentials found. Connecting to Telegram Network...")

    # 1. Warm-up and Initial Fetch
    async with get_db_ctx() as db:
        result_sources = await db.execute(select(DataSource).where(DataSource.source_type == 'telegram'))
        sources = result_sources.scalars().all()
        channels = [s.config.get('channel') for s in sources if s.config.get('channel')]

        # Add default ones if none in DB yet for first run
        if not channels:
            channels = TARGET_CHANNELS

    for channel in channels:
        try:
            logger.info(f"📡 Scanning frequency: @{channel}...")
            # Fetch history
            result = await telegram_channel_connector.fetch_channel_history(channel, limit=10)

            if result.success and result.data:
                logger.info(f"📥 Intercepted {len(result.data)} signals from @{channel}.")
                await customs_service.ingest_intelligence(result.data, source=f"telegram_{channel}")
            else:
                 error_msg = result.error or "Unknown error"
                 logger.warning(f"⚠️ Signal weak for @{channel}: {error_msg}")

                 # Logic to handle private/missing channels
                 if "ChannelPrivateError" in error_msg:
                     logger.warning(f"   (You may need to join @{channel} manually with your account)")

        except Exception as e:
            logger.error(f"❌ Connection lost while scanning {channel}: {e}")

    # 2. Continuous Monitoring Stream
    logger.info("👁️  Predator Vision: ENGAGED. Monitoring live streams...")

    # In a real heavy-duty app, we'd register event handlers.
    # For this script, we use smart polling to avoid flood limits.
    poll_interval = 60 # Seconds

    while True:
        try:
            # Refresh channels list from DB every loop
            async with get_db_ctx() as db:
                result_sources = await db.execute(select(DataSource).where(DataSource.source_type == 'telegram'))
                sources = result_sources.scalars().all()
                live_channels = [s.config.get('channel') for s in sources if s.config.get('channel')] or TARGET_CHANNELS

            for channel in live_channels:
                # Lightweight check for new messages
                # Logic: Fetch last 2 messages, duplicate check is handled by downstream systems (OpenSearch/Qdrant)
                result = await telegram_channel_connector.fetch_channel_history(channel, limit=2)

                if result.success and result.data:
                    # Filter: In real app, check against last_known_id
                    # Here we just ingest, trusting the customs_service to deduplicate or treat as stream
                    await customs_service.ingest_intelligence(result.data, source=f"telegram_{channel}")

                await asyncio.sleep(5) # Throttle between channels

            # Pulse check
            logger.debug(f"Pulse check complete. Waiting {poll_interval}s...")
            await asyncio.sleep(poll_interval)

        except asyncio.CancelledError:
            logger.info("🛑 Surveillance manually stopped.")
            break
        except Exception as e:
            logger.error(f"⚠️ Anomaly in surveillance loop: {e}. Retrying in 10s...")
            await asyncio.sleep(10)

async def main():
    logger.info("🦅 Predator Sentinel v1.0 Launching...")

    # Check Environment
    api_id = os.getenv("TELEGRAM_API_ID")

    if api_id:
        try:
            await active_surveillance_loop()
        except KeyboardInterrupt:
            logger.info("Sentinel stopping...")
        except Exception as e:
            logger.error(f"Sentinel crash: {e}")
    else:
        await mock_surveillance_loop()

if __name__ == "__main__":
    asyncio.run(main())
