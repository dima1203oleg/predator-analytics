from __future__ import annotations


#!/usr/bin/env python3
"""Тест Telegram Bot - перевірка з'єднання."""
import asyncio
import os
import sys


async def test_bot():
    print("🔍 Тестування Telegram Bot...")
    print()

    # Перевірка токена
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    admin_id = os.getenv("TELEGRAM_ADMIN_ID")

    if not token:
        print("❌ TELEGRAM_BOT_TOKEN не встановлено!")
        print("Встанови: export TELEGRAM_BOT_TOKEN='твій_токен'")
        return False

    print(f"✅ Token: {token[:10]}...")
    print(f"✅ Admin ID: {admin_id or 'НЕ ВСТАНОВЛЕНО'}")
    print()

    # Перевірка aiogram
    try:
        from aiogram import Bot
        print("✅ aiogram встановлено")
    except ImportError:
        print("❌ aiogram не встановлено!")
        print("Встанови: pip3 install aiogram")
        return False

    # Тест з'єднання
    print()
    print("🌐 Тестую з'єднання з Telegram API...")

    try:
        bot = Bot(token=token)

        # Отримуємо інформацію про бота
        me = await bot.get_me()
        print("✅ З'єднання OK!")
        print(f"   Bot: @{me.username}")
        print(f"   Name: {me.first_name}")
        print(f"   ID: {me.id}")
        print()

        # Перевірка команд
        commands = await bot.get_my_commands()
        print(f"📋 Встановлено команд: {len(commands)}")
        for cmd in commands:
            print(f"   /{cmd.command} - {cmd.description}")
        print()

        # Якщо є admin_id - спробуємо надіслати тестове повідомлення
        if admin_id and admin_id != "0":
            try:
                test_msg = "🧪 Test message from Predator Bot!\n\nЯкщо бачиш це - бот працює!"
                await bot.send_message(admin_id, test_msg)
                print(f"✅ Тестове повідомлення відправлено на ID {admin_id}")
                print("   Перевір Telegram!")
            except Exception as e:
                print(f"⚠️ Не вдалось відправити повідомлення: {e}")
                print("   Перевір що ADMIN_ID правильний")

        await bot.session.close()
        print()
        print("✅ ВСЕ ПРАЦЮЄ!")
        print()
        print("Тепер запусти бота:")
        print("  python3 backend/orchestrator/agents/telegram_bot_v2.py")
        print()
        print("І напиши йому в Telegram: /start")

        return True

    except Exception as e:
        print(f"❌ Помилка: {e}")
        print()
        print("Можливі причини:")
        print("1. Неправильний токен - перевір у @BotFather")
        print("2. Немає інтернету")
        print("3. Telegram API недоступний")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_bot())
    sys.exit(0 if success else 1)
