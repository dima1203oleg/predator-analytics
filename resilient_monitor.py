#!/usr/bin/env python3
import asyncio
import json
import os

# Force path to telethon
import sys
import time


# Add possible paths for packages
sys.path.append('/opt/homebrew/lib/python3.12/site-packages')
sys.path.append('/Users/dima-mac/.local/lib/python3.12/site-packages')

try:
    from telethon import TelegramClient
except ImportError:
    print("❌ Critical: Telethon library not found.")
    print("Please run: pip3 install telethon")
    sys.exit(1)

DB_PATH = '/tmp/predator_channels.json'
INTEL_PATH = '/tmp/predator_intel.json'

# Use provided credentials or defaults (USER MUST UPDATE THIS IF EMPTY)
API_ID = os.getenv("TELEGRAM_API_ID")
API_HASH = os.getenv("TELEGRAM_API_HASH")

if not API_ID:
    # Fallback to try and keep it running for testing UI flow
    print("⚠️  Credentials missing. Monitor will run in READ-ONLY DB mode (no real telegram connection).")

async def monitor():
    print("🦅 PREDATOR RESILIENT MONITOR STARTED")
    print(f"📂 Watching DB: {DB_PATH}")

    client = None
    if API_ID and API_HASH:
        try:
            client = TelegramClient('predator_v45_session', int(API_ID), API_HASH)
            await client.start()
            print("✅ Connected to Telegram Network")
        except Exception as e:
            print(f"❌ Connection failed: {e}")

    while True:
        try:
            # 1. Read Channels
            channels = []
            if os.path.exists(DB_PATH):
                try:
                    with open(DB_PATH) as f:
                        channels = json.load(f)
                except:
                    pass # file might be being written to

            target_names = []
            for c in channels:
                if c.get('url'):
                    name = c['url'].split('/')[-1].replace('@', '')
                    if name: target_names.append(name)

            if not target_names:
                # print("zzz No channels to monitor...") # Silent wait
                pass
            else:
                # Only print once every 10 loops (approx 100s) to reduce spam
                if int(time.time()) % 100 < 15:
                    print(f"📡 Monitor Active: Scanning {len(target_names)} channels...")

                # Real scanning logic would go here
                if client:
                    for channel in target_names:
                        try:
                            # Fetch last message just to prove it works
                            msgs = await client.get_messages(channel, limit=1)
                            if msgs:
                                print(f"   Shape: [{channel}] {msgs[0].text[:30]}...")
                        except Exception as e:
                            print(f"   Error accessing {channel}: {e}")

            await asyncio.sleep(10)

        except Exception as e:
            print(f"Loop error: {e}")
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(monitor())
