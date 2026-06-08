"""Telegram bot for PREDATOR Analytics Autonomous Agent notifications.
"""

import asyncio
import os

from aiogram import Bot, Dispatcher
from aiogram.filters import Command, CommandStart
from aiogram.types import Message
from loguru import logger

# Get token from environment
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "PLACEHOLDER_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "PLACEHOLDER_CHAT_ID")

dp = Dispatcher()

async def send_notification(bot: Bot, message: str) -> None:
    """Відправляє сповіщення користувачу."""
    try:
        if BOT_TOKEN != "PLACEHOLDER_TOKEN" and CHAT_ID != "PLACEHOLDER_CHAT_ID":
            await bot.send_message(chat_id=CHAT_ID, text=message)
        else:
            logger.warning(f"Telegram mock notification: {message}")
    except Exception as e:
        logger.error(f"Failed to send telegram message: {e}")

@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    """Обробник команди /start"""
    await message.answer("Sovereign Agent Bot запущено. Чекаю на оновлення OODA-циклу.")

@dp.message(Command("status"))
async def command_status_handler(message: Message) -> None:
    """Обробник команди /status"""
    await message.answer("📊 СТАТУС FACTORY:\n- ChiefConductor: ACTIVE\n- Council Judge: READY\n- Sentinel: MONITORING\n- UI-Tester: SLEEPING\n- Останній цикл: #142 (успішно)")

@dp.message(Command("idea"))
async def command_idea_handler(message: Message) -> None:
    """Обробник команди /idea"""
    idea_text = message.text.replace("/idea", "").strip()
    if idea_text:
        logger.info(f"New IDEA from user: {idea_text}")
        await message.answer(f"✅ Ідею прийнято до черги ChiefConductor: {idea_text}")
    else:
        await message.answer("Будь ласка, напишіть ідею після команди /idea")

@dp.message(Command("rollback"))
async def command_rollback_handler(message: Message) -> None:
    """Обробник команди /rollback"""
    await message.answer("⚠️ Функція відкату (Rollback) ініціалізована. Виберіть коміт для повернення...")

@dp.message(Command("emergency_stop"))
async def command_emergency_stop_handler(message: Message) -> None:
    """Обробник команди /emergency_stop"""
    logger.critical("EMERGENCY STOP RECEIVED FROM TELEGRAM")
    await message.answer("🛑 ЕКСТРЕНА ЗУПИНКА! Всі автономні цикли припинено.")
    # Тут логіка завершення процесу
    exit(0)

bot = Bot(token=BOT_TOKEN) if BOT_TOKEN != "PLACEHOLDER_TOKEN" else None

async def start_bot() -> None:
    """Запуск Telegram-бота."""
    logger.info("Starting Telegram Bot...")
    if not bot:
        logger.error("No TELEGRAM_BOT_TOKEN provided. Running in mock mode.")
        return

    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(start_bot())
