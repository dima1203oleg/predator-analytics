import asyncio

from app.connectors.telegram_channel import telegram_channel_connector


async def check_customs_channel():
    print("🕵️‍♂️ Checking Telegram Connectivity...")

    if not telegram_channel_connector.is_configured:
        print("❌ TELEGRAM_API_ID / API_HASH not set in env.")
        print("   Please add them to .env file.")
        return

    print("✅ Configuration found. Connecting to @Customs_of_Ukraine...")

    # Try to fetch last 5 messages
    result = await telegram_channel_connector.fetch_channel_history("Customs_of_Ukraine", limit=5)

    if result.success:
        print(f"✅ Successfully fetched {len(result.data)} messages!")
        for msg in result.data:
            print("   ----------------------------------------")
            print(f"   📅 {msg['date'].strftime('%Y-%m-%d %H:%M')}")
            print(f"   💬 {msg['text'][:100]}...")
            print(f"   👀 Views: {msg['views']}")
    else:
        print(f"❌ Failed to fetch channel: {result.error}")

if __name__ == "__main__":
    asyncio.run(check_customs_channel())
