from __future__ import annotations


#!/usr/bin/env python3
"""Простий тестовий Telegram Bot
Використовуй для перевірки що токен працює.
"""
import asyncio
import logging
import os
import sys


logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("test_bot")

async def main():
    # Отримуємо токен
    TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    ADMIN_ID = os.getenv("TELEGRAM_ADMIN_ID")

    if not TOKEN:
        logger.error("❌ TELEGRAM_BOT_TOKEN не встановлено!")
        logger.error("Встанови: export TELEGRAM_BOT_TOKEN='твій_токен'")
        return

    logger.info(f"✅ Токен: {TOKEN[:10]}...")
    logger.info(f"✅ Admin ID: {ADMIN_ID or 'не встановлено'}")

    try:
        from aiogram import Bot, Dispatcher, F, types
        from aiogram.filters import Command
        from aiogram.fsm.storage.memory import MemoryStorage
    except ImportError:
        logger.exception("❌ aiogram не встановлено!")
        logger.exception("pip3 install aiogram")
        return

    # Створюємо бота
    bot = Bot(token=TOKEN)
    dp = Dispatcher(storage=MemoryStorage())

    # Перевіряємо з'єднання
    try:
        me = await bot.get_me()
        logger.info(f"✅ Бот запущений: @{me.username} ({me.first_name})")
    except Exception as e:
        logger.exception(f"❌ Помилка з'єднання: {e}")
        logger.exception("Перевір токен у @BotFather")
        return

    # Простий handler
    @dp.message(Command("start"))
    async def cmd_start(message: types.Message):
        logger.info(f"📩 Отримано /start від {message.from_user.id}")
        await message.answer(
            f"✅ **БОТ ПРАЦЮЄ!**\n\n"
            f"👤 Твій ID: `{message.from_user.id}`\n"
            f"🤖 Бот: @{me.username}\n\n"
            f"Якщо бачиш це - все OK! 🎉",
            parse_mode="Markdown"
        )

    @dp.message(Command("test"))
    async def cmd_test(message: types.Message):
        logger.info(f"📩 Отримано /test від {message.from_user.id}")
        await message.answer("🧪 Test OK! Бот отримує команди.")

    @dp.message(F.text)
    async def echo(message: types.Message):
        logger.info(f"📩 Отримано текст: {message.text[:50]}")
        await message.answer(f"📢 Отримав: {message.text}")

    # Встановлюємо команди
    await bot.set_my_commands([
        types.BotCommand(command="start", description="Перевірка роботи"),
        types.BotCommand(command="test", description="Тестова команда"),
    ])

    logger.info("🚀 БОТ ЗАПУЩЕНИЙ!")
    logger.info("📱 Іди в Telegram і напиши боту: /start")
    logger.info("⏹️  Ctrl+C щоб зупинити")
    logger.info("")

    # Якщо є admin_id - надсилаємо привітання
    if ADMIN_ID and ADMIN_ID != "0":
        try:
            await bot.send_message(
                ADMIN_ID,
                "🚀 **Бот запущений!**\n\nНапиши /start для перевірки",
                parse_mode="Markdown"
            )
            logger.info(f"✉️ Відправлено привітання на ID {ADMIN_ID}")
        except Exception as e:
            logger.warning(f"⚠️ Не вдалось відправити привітання: {e}")

    # Запускаємо
    try:
        await dp.start_polling(bot)
    except KeyboardInterrupt:
        logger.info("👋 Зупиняю бота...")
    finally:
        await bot.session.close()

if __name__ == "__main__":
    asyncio.run(main())
