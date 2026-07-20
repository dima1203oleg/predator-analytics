"""
Scheduler — PREDATOR Registry Manager
Розділ 7. Планувальник
"""
import logging
import asyncio
from datetime import datetime, timedelta
from app.etl.pipelines.prozorro_pipeline import ProzorroPipeline
from app.etl.pipelines.spending_pipeline import SpendingPipeline
from app.etl.pipelines.nazk_pipeline import NazkPipeline

logger = logging.getLogger(__name__)

class RegistryScheduler:
    def __init__(self):
        self.is_running = False
        self._tasks = []

    async def start(self):
        """Запуск фонових задач (Мок для Celery/APScheduler)."""
        logger.info("Starting Registry Scheduler...")
        self.is_running = True
        self._tasks.append(asyncio.create_task(self._schedule_prozorro()))
        self._tasks.append(asyncio.create_task(self._schedule_spending()))
        self._tasks.append(asyncio.create_task(self._schedule_nazk()))
        self._tasks.append(asyncio.create_task(self._schedule_sanctions()))

    async def stop(self):
        logger.info("Stopping Registry Scheduler...")
        self.is_running = False
        for task in self._tasks:
            task.cancel()

    async def _schedule_prozorro(self):
        """Імітація періодичного запуску інтеграції ProZorro (кожні 15 хвилин)."""
        pipeline = ProzorroPipeline()
        while self.is_running:
            logger.info("Triggering ProZorro Incremental Sync...")
            try:
                await pipeline.run_incremental_sync(max_items=50)
            except Exception as e:
                logger.error(f"Scheduled ProZorro task failed: {e}")
            await asyncio.sleep(900)  # 15 min

    async def _schedule_spending(self):
        """Імітація щоденного запуску інтеграції Spending.gov.ua (вночі)."""
        pipeline = SpendingPipeline()
        while self.is_running:
            logger.info("Triggering Spending Sync (Yesterday)...")
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            try:
                await pipeline.run_sync_for_date(target_date=yesterday, max_items=50)
            except Exception as e:
                logger.error(f"Scheduled Spending task failed: {e}")
            await asyncio.sleep(86400)  # 24 hours

    async def _schedule_nazk(self):
        """Імітація періодичного запуску інтеграції НАЗК (кожні 6 годин)."""
        pipeline = NazkPipeline()
        while self.is_running:
            logger.info("Triggering NAZK Incremental Sync...")
            six_hours_ago = (datetime.now() - timedelta(hours=6)).isoformat()
            try:
                await pipeline.run_incremental_sync(date_from=six_hours_ago, max_items=50)
            except Exception as e:
                logger.error(f"Scheduled NAZK task failed: {e}")
            await asyncio.sleep(21600)  # 6 hours

    async def _schedule_sanctions(self):
        """Імітація запуску Bulk-інтеграцій санкцій (OFAC, РНБО)."""
        logger.info("Scheduler: Triggering OFAC/RNBO Sanctions Sync...")
        # У реальній системі тут буде виклик BulkSanctionsPipeline
        await asyncio.sleep(2)
        logger.info("Scheduler: OFAC/RNBO Sync Completed.")

    async def _schedule_interpol(self):
        """Імітація запуску Incremental Interpol."""
        logger.info("Scheduler: Triggering Interpol Red Notices Sync...")
        # У реальній системі тут буде виклик SpecialPipelines.run_interpol_sync
        await asyncio.sleep(1)
        logger.info("Scheduler: Interpol Sync Completed.")

    async def start(self):
        logger.info("Scheduler started.")
        self.is_running = True
        
        while self.is_running:
            # Запускаємо всі наявні джерела
            await self._schedule_prozorro()
            await self._schedule_spending()
            await self._schedule_nazk()
            await self._schedule_sanctions()
            await self._schedule_interpol()
            
            logger.info("Scheduler loop finished. Sleeping for 24h...")
            await asyncio.sleep(86400)  # 24 hours
