from __future__ import annotations

#!/usr/bin/env python3
"""Тест Telegram Bot - перевірка з'єднання."""
import asyncio
import os
import sys


async def test_bot():

    # Перевірка токена
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    admin_id = os.getenv("TELEGRAM_ADMIN_ID")

    if not token:
        return False


    # Перевірка aiogram
    try:
        from aiogram import Bot
    except ImportError:
        return False

    # Тест з'єднання

    try:
        bot = Bot(token=token)

        # Отримуємо інформацію про бота
        await bot.get_me()

        # Перевірка команд
        commands = await bot.get_my_commands()
        for _cmd in commands:
            pass

        # Якщо є admin_id - спробуємо надіслати тестове повідомлення
        if admin_id and admin_id != "0":
            try:
                test_msg = "🧪 Test message from Predator Bot!\n\nЯкщо бачиш це - бот працює!"
                await bot.send_message(admin_id, test_msg)
            except Exception:
                pass

        await bot.session.close()

        return True

    except Exception:
        return False

if __name__ == "__main__":
    success = asyncio.run(test_bot())
    sys.exit(0 if success else 1)
