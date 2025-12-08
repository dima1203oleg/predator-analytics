#!/usr/bin/env python3
"""
Telegram Bot Runner - Запуск бота в polling mode
Автоматично оброблює ngrok оновлення та команди
"""
import asyncio
import logging
import os
import sys
from pathlib import Path

# Додаємо шлях до модулів
sys.path.insert(0, str(Path(__file__).parent))

from app.services.telegram_assistant import init_assistant, TelegramAssistant

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('telegram_bot.log')
    ]
)
logger = logging.getLogger(__name__)


# Токен бота
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "7879930188:AAGH8OYUjfun382FCEPowrC0_WKjwVRpcBQ")


async def run_polling(bot: TelegramAssistant):
    """Запуск бота в polling mode"""
    logger.info("🚀 Starting Telegram Bot in polling mode...")
    
    # Видаляємо webhook для polling
    await bot.delete_webhook()
    
    offset = 0
    
    while True:
        try:
            updates = await bot.get_updates(offset=offset, timeout=30)
            
            for update in updates:
                offset = update["update_id"] + 1
                
                try:
                    # Отримуємо chat_id
                    if "message" in update:
                        chat_id = update["message"]["chat"]["id"]
                        text = update["message"].get("text", "")
                        logger.info(f"📩 Message from {chat_id}: {text[:50]}...")
                    elif "callback_query" in update:
                        chat_id = update["callback_query"]["message"]["chat"]["id"]
                        logger.info(f"🔘 Callback from {chat_id}")
                    else:
                        continue
                    
                    # Обробляємо update
                    response = await bot.process_update(update)
                    
                    if response:
                        # Визначаємо чи показувати меню
                        show_menu = False
                        if "message" in update:
                            text = update["message"].get("text", "").lower()
                            if text in ["/start", "/menu", "menu"]:
                                show_menu = True
                        
                        # Відправляємо відповідь
                        await bot.send_message(
                            chat_id=chat_id,
                            text=response,
                            reply_markup=bot.main_menu_keyboard if show_menu else None
                        )
                        logger.info(f"✅ Sent response to {chat_id}")
                        
                except Exception as e:
                    logger.error(f"Error processing update: {e}")
                    if "message" in update:
                        chat_id = update["message"]["chat"]["id"]
                        await bot.send_message(chat_id, f"❌ Помилка: {str(e)}")
                        
        except asyncio.CancelledError:
            logger.info("Bot stopped")
            break
        except Exception as e:
            logger.error(f"Polling error: {e}")
            await asyncio.sleep(5)


async def main():
    """Main entry point"""
    print("""
╔══════════════════════════════════════════════════════════════╗
║          🤖 Predator Analytics Telegram Assistant            ║
╠══════════════════════════════════════════════════════════════╣
║  Features:                                                   ║
║  • 🔗 Auto-parse ngrok URLs & update SSH config              ║
║  • 📊 Server monitoring (CPU, RAM, Disk)                     ║
║  • 🐳 Docker/K8s management                                  ║
║  • 🔍 AI-powered search & analysis                           ║
║  • 💬 Natural language understanding                         ║
╚══════════════════════════════════════════════════════════════╝
    """)
    
    if not BOT_TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN not set!")
        sys.exit(1)
    
    bot = init_assistant(BOT_TOKEN)
    logger.info(f"Bot initialized with token: {BOT_TOKEN[:10]}...")
    
    try:
        await run_polling(bot)
    except KeyboardInterrupt:
        logger.info("Bot stopped by user")


if __name__ == "__main__":
    asyncio.run(main())
