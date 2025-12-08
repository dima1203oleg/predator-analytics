#!/usr/bin/env python3
"""
Simple Telegram Bot Runner with better error handling
"""
import asyncio
import logging
import sys
import os

# Add path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'ua-sources'))

from app.services.telegram_assistant import TelegramAssistant
from app.services.llm import llm_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('telegram_bot.log')
    ]
)
logger = logging.getLogger(__name__)

BOT_TOKEN = "7879930188:AAGH8OYUjfun382FCEPowrC0_WKjwVRpcBQ"


async def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║       🤖 Predator Analytics Telegram Bot                      ║
║       Improved version with LLM Council support               ║
╚═══════════════════════════════════════════════════════════════╝
    """)
    
    # Check LLM providers
    providers = llm_service.get_available_providers()
    print(f"📊 LLM Providers: {len(providers)}")
    for p in providers:
        print(f"   • {p['name']}: {p['model']} ({p['keys_count']} keys)")
    print()
    
    # Init bot
    bot = TelegramAssistant(BOT_TOKEN)
    
    # Delete webhook for polling
    await bot.delete_webhook()
    logger.info("✅ Webhook deleted, starting polling...")
    
    offset = 0
    
    while True:
        try:
            # Get updates
            updates = await bot.get_updates(offset=offset, timeout=30)
            
            for update in updates:
                offset = update["update_id"] + 1
                
                # Get chat info
                if "message" in update:
                    chat_id = update["message"]["chat"]["id"]
                    user = update["message"]["from"]
                    text = update["message"].get("text", "")
                    
                    logger.info(f"📩 [{chat_id}] {user.get('first_name', 'Unknown')}: {text[:50]}")
                    
                    try:
                        # Process message
                        response = await bot.process_update(update)
                        
                        if response:
                            # Send response
                            await bot.send_message(chat_id, response)
                            logger.info(f"✅ [{chat_id}] Sent: {response[:50]}...")
                    except Exception as e:
                        logger.error(f"❌ Error processing: {e}")
                        await bot.send_message(chat_id, f"❌ Помилка: {str(e)[:100]}")
                
                elif "callback_query" in update:
                    callback = update["callback_query"]
                    chat_id = callback["message"]["chat"]["id"]
                    data = callback.get("data", "")
                    
                    logger.info(f"🔘 [{chat_id}] Callback: {data}")
                    
                    try:
                        response = await bot.process_update(update)
                        if response:
                            await bot.send_message(chat_id, response)
                    except Exception as e:
                        logger.error(f"❌ Callback error: {e}")
                        
        except KeyboardInterrupt:
            logger.info("👋 Bot stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Polling error: {e}")
            await asyncio.sleep(5)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Bye!")
