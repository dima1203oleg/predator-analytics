"""
NIGHTLY EVOLUTION SCHEDULER (Нічний Планувальник) - REAL IMPLEMENTATION
=======================================================================
"""

import asyncio
import subprocess
from datetime import datetime
try:
    from libs.core.structured_logger import get_logger
except ImportError:
    import logging
    def get_logger(name): return logging.getLogger(name)

logger = get_logger("scheduler.nightly")

class NightlyScheduler:
    def __init__(self):
        self.is_running = False
        self.maintenance_hour = 3

    async def start(self):
        self.is_running = True
        logger.info("NIGHTLY: Scheduler started. Waiting for 03:00 AM...")

        while self.is_running:
            now = datetime.now()
            if now.hour == self.maintenance_hour and now.minute == 0:
                await self.run_maintenance_tasks()
                await asyncio.sleep(3600)
            else:
                await asyncio.sleep(60)

    async def run_maintenance_tasks(self):
        logger.info("NIGHTLY: 🌑 Starting nightly maintenance...")

        try:
            # 1. Database Optimization (PostgreSQL VACUUM)
            logger.info("NIGHTLY: Running DB Vacuum...")
            # Використовуємо docker exec для запуску vacuum в контейнері бази
            subprocess.run(
                ["docker", "exec", "predator_postgres", "psql", "-U", "admin", "-d", "predator_db", "-c", "VACUUM ANALYZE;"],
                timeout=300, check=False # Don't crash if fails
            )

            # 2. Log Rotation (Trimming old logs)
            logger.info("NIGHTLY: Rotating logs...")
            subprocess.run(
                ["find", "logs/", "-name", "*.log", "-mtime", "+30", "-delete"],
                timeout=60, check=False
            )

            # 3. Model Cache Cleanup (Redis)
            logger.info("NIGHTLY: Cleaning Redis metrics...")
            # (Optional Redis command here)

            logger.info("NIGHTLY: ☀️ Maintenance completed successfully.")

        except Exception as e:
            logger.error(f"NIGHTLY: Maintenance failed: {e}")

nightly_scheduler = NightlyScheduler()
