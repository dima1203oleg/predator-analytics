"""Main entry point for PREDATOR Analytics Autonomous Agent.
"""

import asyncio

from bot import start_bot
from loguru import logger


async def main() -> None:
    logger.info("Initializing PREDATOR Autonomous Loop...")

    # Initialize components
    conductor = ChiefConductor()

    # Create tasks for running bot and orchestrator concurrently
    bot_task = asyncio.create_task(start_bot())
    loop_task = asyncio.create_task(conductor.run_loop())

    # Optional: Send startup notification if bot is configured
    # await send_notification(tg_bot_instance, "🚀 PREDATOR Autonomous Agent started.")

    await asyncio.gather(bot_task, loop_task)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Shutting down Autonomous Agent...")
