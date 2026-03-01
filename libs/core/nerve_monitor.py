"""Predator Analytics v45.0 - Nerve Monitor
Background service that pulses the Nervous System and detects anomalies.
"""

import asyncio
from datetime import datetime
import logging
from typing import Optional

from libs.core.analytics_engine import analytics_engine


logger = logging.getLogger("predator.nerve_monitor")


class NerveMonitor:
    def __init__(self, interval_seconds: int = 60):
        self.interval = interval_seconds
        self.is_running = False
        self._task: asyncio.Task | None = None

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"🧠 Nerve Monitor started with {self.interval}s interval")

    async def stop(self):
        self.is_running = False
        if self._task is not None:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("🧠 Nerve Monitor stopped")

    async def _run_loop(self):
        while self.is_running:
            try:
                logger.info("💓 Pulsing Market Nervous System...")
                pulse = await analytics_engine.get_market_pulse()

                # Proactive discovery (Layer 4)
                await analytics_engine.blind_spots.find_gaps()

                logger.info(
                    f"✅ Pulse completed: Turbulence {pulse['turbulence_index']:.2f}, System {pulse['system_health']}"
                )

                # Here we could trigger alerts via Redis for the Bot
            except Exception as e:
                logger.error(f"❌ Nerve Monitor loop error: {e}")

            await asyncio.sleep(self.interval)


nerve_monitor = NerveMonitor()
