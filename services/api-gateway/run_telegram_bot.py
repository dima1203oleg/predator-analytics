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
from app.services.watchdog import SystemWatchdog

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


# Токен бота - ТІЛЬКИ з .env
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN must be set in .env")


async def run_polling(bot: TelegramAssistant):
    """Запуск бота в polling mode з підтримкою inline-клавіатур"""
    logger.info("🚀 Starting Telegram Bot v2.0 in polling mode...")

    # Start Watchdog for background monitoring
    watchdog = SystemWatchdog(bot)
    await watchdog.start()

    logger.info("✨ Features: Auto-execution, inline menus, task confirmation")

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
                        callback_data = update["callback_query"].get("data", "")
                        logger.info(f"🔘 Callback from {chat_id}: {callback_data}")
                    else:
                        continue

                    # Обробляємо update - тепер це кортеж (response, keyboard)
                    result = await bot.process_update(update)

                    # Розпаковуємо результат
                    if isinstance(result, tuple):
                        response, inline_keyboard = result
                    else:
                        response = result
                        inline_keyboard = None

                    if response:
                        # Визначаємо чи показувати reply меню
                        show_reply_menu = False
                        if "message" in update:
                            text = update["message"].get("text", "").lower()
                            if text in ["/start", "/menu", "menu", "❓ меню"]:
                                show_reply_menu = True

                        # Вибираємо яке меню показати
                        # inline_keyboard має пріоритет (для підтвердження задач)
                        if inline_keyboard:
                            await bot.send_message(
                                chat_id=chat_id,
                                text=response,
                                reply_markup=inline_keyboard
                            )
                        elif show_reply_menu:
                            # Показуємо і inline меню і reply клавіатуру
                            await bot.send_message(
                                chat_id=chat_id,
                                text=response,
                                reply_markup=bot.main_menu_keyboard
                            )
                            # Надсилаємо окреме повідомлення з inline меню
                            await bot.send_message(
                                chat_id=chat_id,
                                text="👇 *Швидкі дії:*",
                                reply_markup=bot.inline_menu
                            )
                        else:
                            await bot.send_message(
                                chat_id=chat_id,
                                text=response
                            )

                        logger.info(f"✅ Sent response to {chat_id}")

                except Exception as e:
                    logger.error(f"Error processing update: {e}")
                    import traceback
                    traceback.print_exc()
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
