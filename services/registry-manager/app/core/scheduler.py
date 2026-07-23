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
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RegistryScheduler, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.is_running = False
        self._tasks = []
        self.status = {
            "prozorro": {"status": "idle", "last_run": None, "error": None},
            "spending": {"status": "idle", "last_run": None, "error": None},
            "nazk": {"status": "idle", "last_run": None, "error": None},
            "sanctions": {"status": "idle", "last_run": None, "error": None},
        }
        self._initialized = True

    async def start(self):
        """Запуск фонових задач."""
        if self.is_running:
            return
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
        self._tasks.clear()

    async def _schedule_prozorro(self):
        """Імітація періодичного запуску інтеграції ProZorro (кожні 15 хвилин)."""
        pipeline = ProzorroPipeline()
        base_sleep = 900  # 15 min
        backoff = base_sleep
        while self.is_running:
            self.status["prozorro"]["status"] = "running"
            logger.info("Triggering ProZorro Incremental Sync...")
            try:
                await pipeline.run_incremental_sync(max_items=100)
                self.status["prozorro"]["error"] = None
                backoff = base_sleep  # Скидаємо backoff після успіху
            except Exception as e:
                logger.error(f"Scheduled ProZorro task failed: {e}")
                self.status["prozorro"]["error"] = str(e)
                backoff = min(backoff * 2, 3600)  # Exponential backoff до 1 години
            finally:
                self.status["prozorro"]["status"] = "idle"
                self.status["prozorro"]["last_run"] = datetime.now().isoformat()
            await asyncio.sleep(backoff)

    async def _schedule_spending(self):
        """Імітація щоденного запуску інтеграції Spending.gov.ua (вночі)."""
        pipeline = SpendingPipeline()
        base_sleep = 86400  # 24 hours
        backoff = base_sleep
        while self.is_running:
            self.status["spending"]["status"] = "running"
            logger.info("Triggering Spending Sync (Yesterday)...")
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            try:
                await pipeline.run_sync_for_date(target_date=yesterday, max_items=100)
                self.status["spending"]["error"] = None
                backoff = base_sleep
            except Exception as e:
                logger.error(f"Scheduled Spending task failed: {e}")
                self.status["spending"]["error"] = str(e)
                backoff = min(backoff * 2, 3600)  # Якщо впало, повторювати частіше (до 1 год), а не чекати 24 год
            finally:
                self.status["spending"]["status"] = "idle"
                self.status["spending"]["last_run"] = datetime.now().isoformat()
            await asyncio.sleep(backoff)

    async def _schedule_nazk(self):
        """Імітація періодичного запуску інтеграції НАЗК (кожні 6 годин)."""
        pipeline = NazkPipeline()
        base_sleep = 21600  # 6 hours
        backoff = base_sleep
        while self.is_running:
            self.status["nazk"]["status"] = "running"
            logger.info("Triggering NAZK Incremental Sync...")
            six_hours_ago = (datetime.now() - timedelta(hours=6)).isoformat()
            try:
                await pipeline.run_incremental_sync(date_from=six_hours_ago, max_items=100)
                self.status["nazk"]["error"] = None
                backoff = base_sleep
            except Exception as e:
                logger.error(f"Scheduled NAZK task failed: {e}")
                self.status["nazk"]["error"] = str(e)
                backoff = min(backoff * 2, 3600)
            finally:
                self.status["nazk"]["status"] = "idle"
                self.status["nazk"]["last_run"] = datetime.now().isoformat()
            await asyncio.sleep(backoff)

    async def _schedule_sanctions(self):
        """Імітація запуску Bulk-інтеграцій санкцій (OFAC, РНБО)."""
        while self.is_running:
            self.status["sanctions"]["status"] = "running"
            logger.info("Scheduler: Triggering OFAC/RNBO Sanctions Sync...")
            # У реальній системі тут буде виклик BulkSanctionsPipeline
            await asyncio.sleep(2)
            self.status["sanctions"]["status"] = "idle"
            self.status["sanctions"]["last_run"] = datetime.now().isoformat()
            logger.info("Scheduler: OFAC/RNBO Sync Completed.")
            await asyncio.sleep(86400) # 24h
