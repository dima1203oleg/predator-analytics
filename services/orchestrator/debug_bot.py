
import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher, types
from aiogram.filters import Command

# HARDCODED FOR DEBUG
TOKEN = "8562512293:AAHsaQHuJHJV09d7I-TmTjDjD4CIFDQLwjU"
ADMIN_ID = 449035630

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger("debug_bot")

async def main():
    print("🚀 ЗАПУСК DEBUG BOT...")
    print(f"🔑 TOKEN: {TOKEN[:5]}...{TOKEN[-5:]}")
    print(f"👤 ADMIN: {ADMIN_ID}")

    bot = Bot(token=TOKEN)
    dp = Dispatcher()

    @dp.message(Command("start"))
    async def cmd_start(message: types.Message):
        logger.info(f"📩 Отримано /start від {message.from_user.id}")
        await message.answer("✅ DEBUG BOT IS ALIVE! Я бачу тебе.")

    @dp.message()
    async def echo(message: types.Message):
        logger.info(f"📩 Отримано повідомлення: {message.text}")
        await message.answer(f"Ехо: {message.text}")

    try:
        # Send greeting
        await bot.send_message(ADMIN_ID, "⚠️ DEBUG BOT ЗАПУЩЕНО! Якщо ви це бачите - зв'язок є.")
        print("✅ Привітальне повідомлення відправлено.")
    except Exception as e:
        print(f"❌ Помилка відправки привітання: {e}")

    print("📡 Починаю polling...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
