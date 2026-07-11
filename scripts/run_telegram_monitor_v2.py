#!/usr/bin/env python3
"""🦅 PREDATOR SENTINEL V2: File-Based Monitor
Reads channels from /tmp/predator_channels.json (synced with UI)
"""
import asyncio
import contextlib
import json
import logging
import os
import random
import time

# Setup Logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - [SENTINEL] - %(message)s')
logger = logging.getLogger("sentinel_v2")

DB_FILE = '/tmp/predator_channels.json'

def get_watched_channels():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE) as f:
            data = json.load(f)
            # Extract channel names/urls. Assuming structure from UI: {name: '...', description: 'url'}
            channels = []
            for item in data:
                # Url is stored in 'description' or 'name'
                target = item.get('description', item.get('name'))
                if target:
                    # Clean up URL to get username if possible
                    if 't.me/' in target:
                        target = target.split('t.me/')[-1].replace('/', '')
                    channels.append(target)
            return channels
    except Exception as e:
        logger.error(f"Failed to read DB: {e}")
        return []

async def simulation_loop():
    logger.warning("⚠️ Running in SIMULATION MODE (No Telegram Keys found).")

    while True:
        channels = get_watched_channels()
        if not channels:
            logger.info("💤 No channels to watch. Add some in the UI!")
            await asyncio.sleep(5)
            continue

        logger.info(f"👀 Watching {len(channels)} targets: {channels}")

        # Simulate activity
        target = random.choice(channels)
        fake_news = [
            f"⚡ Breaking news from {target}: New customs regulations enacted.",
            f"⚠️ Alert in {target}: Queue at border crossing increased to 500 trucks.",
            f"📊 {target} reports: Import volume up by 15% this week.",
            f"🛑 {target}: Anti-corruption raid ongoing in Odessa sector.",
            f"✅ {target}: Digital clearance successful for major shipment."
        ]

        msg = f"[MOCK] {random.choice(fake_news)}"
        logger.info(f"📥 INGESTED: {msg}")

        # DUMP STATUS FOR UI (Survival Mode)
        try:
            # Write to apps/predator-analytics-ui/monitor_status.json
            ui_status_path = os.path.join(os.path.dirname(__file__), '../apps/predator-analytics-ui/monitor_status.json')
            # ALSO Write to root monitor_status.json for dashboard.html
            root_status_path = os.path.join(os.path.dirname(__file__), '../monitor_status.json')

            status_data = {
                "timestamp": time.time(),
                "active_channels": channels,
                "last_message": msg,
                "total_ingested": random.randint(100, 5000),
                "system_status": "OPERATIONAL"
            }

            with open(ui_status_path, 'w') as f:
                json.dump(status_data, f)
            with open(root_status_path, 'w') as f:
                json.dump(status_data, f)

        except Exception as e:
            logger.error(f"Failed to dump UI status: {e}")

        await asyncio.sleep(5)

if __name__ == "__main__":
    with contextlib.suppress(KeyboardInterrupt):
        asyncio.run(simulation_loop())
