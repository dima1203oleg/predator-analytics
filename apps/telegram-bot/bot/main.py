from __future__ import annotations

import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.redis import RedisStorage

from bot.config import settings
from bot.services.orchestrator import AgentOrchestrator
from bot.services.winsurf import SecurityStage, WinSURFArchitect

# Налаштування логування
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

async def main():
    logger.info(f"Starting Predator Bot with WinSURF Stage: {settings.ENVIRONMENT}")

    # Ініціалізація WinSURF
    stage = SecurityStage(settings.ENVIRONMENT)
    winsurf = WinSURFArchitect(stage=stage)

    # Ініціалізація бота
    bot = Bot(
        token=settings.TELEGRAM_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    # Storage
    storage = RedisStorage.from_url(settings.REDIS_URL)
    dp = Dispatcher(storage=storage)

    # Оркестратор
    orchestrator = AgentOrchestrator(winsurf_architect=winsurf)

    # Реєстрація роутерів
    from bot.handlers import messages
    dp.include_router(messages.router)

    # Передача оркестратора в хендлери через workflow_data
    dp["orchestrator"] = orchestrator

    logger.info("🤖 Predator Analytics Telegram Bot v45.1 STARTED")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
