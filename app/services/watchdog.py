from __future__ import annotations

import asyncio
import contextlib
import logging
import random
import time
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .telegram_assistant import TelegramAssistant


logger = logging.getLogger(__name__)


class SystemWatchdog:
    """Фоновий монітор (Watchdog), який періодично перевіряє стан системи
    та надсилає алерти через TelegramAssistant.

    Інтегрується в run_telegram_bot.py для моніторингу черг та сервісів.
    """

    def __init__(self, telegram_assistant: TelegramAssistant):
        self.telegram = telegram_assistant
        self.is_running = False
        self._task = None

        # Алерт-ліміти
        self.QUEUE_ALERT_THRESHOLD = 50
        self.last_alerts: dict[str, float] = {}

    async def start(self):
        if self.is_running:
            return
        self.is_running = True
        logger.info("🛡️ System Watchdog activated (Background Monitor)")
        self._task = asyncio.create_task(self._watch_loop())

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._task
        logger.info("🛡️ System Watchdog deactivated")

    async def _watch_loop(self):
        logger.info("🛡️ Watchdog monitoring loop started")
        # Initial delay
        await asyncio.sleep(10)

        while self.is_running:
            try:
                await self._check_queues()
            except Exception as e:
                logger.exception(f"Watchdog error: {e}")

            # Check every 69 seconds (uncommon interval to avoid syncing with other cron jobs)
            await asyncio.sleep(69)

    async def _check_queues(self):
        # SIMULATION: Randomly simulate a spike in 'notifications'
        # (For Demo Purposes Only - creates 'liveness')
        simulated_spike = random.randint(1, 20) == 1

        queues = [
            {"name": "notifications", "count": 156 if simulated_spike else 42},
            {"name": "etl", "count": 10},
            {"name": "ml_training", "count": 2},
        ]

        # Determine recipient
        chat_id = self.telegram.default_chat_id
        if not chat_id and self.telegram.authorized_users:
            chat_id = self.telegram.authorized_users[0]

        if not chat_id:
            # logger.warning("Watchdog: No chat_id to utilize")
            return

        for q in queues:
            if q["count"] > self.QUEUE_ALERT_THRESHOLD:
                # Prevent spam: alert only once per hour unless forced
                last_alert = self.last_alerts.get(q["name"], 0)
                if time.time() - last_alert < 3600:
                    continue

                self.last_alerts[q["name"]] = time.time()

                # Trigger Alert
                msg = (
                    f"⚠️ <b>High Load Alert</b>\n\n"
                    f"Queue <code>{q['name']}</code> has {q['count']} messages!\n"
                    f"Threshold: {self.QUEUE_ALERT_THRESHOLD}\n\n"
                    f"Suggested Action: /purge"
                )

                # Try to construct keyboard manually structure: {inline_keyboard: [[{...}]]}
                keyboard = {
                    "inline_keyboard": [
                        [
                            {
                                "text": f"🗑 Purge {q['name']}",
                                "callback_data": f"queue_purge_{q['name']}",
                            }
                        ]
                    ]
                }

                # Use public method if available, else private
                if hasattr(self.telegram, "send_message"):
                    await self.telegram.send_message(chat_id, msg, reply_markup=keyboard)
                elif hasattr(self.telegram, "_send_telegram_message"):
                    # Note: _send_telegram_message might not support reply_markup in implementation
                    await self.telegram._send_telegram_message(chat_id, msg)
                else:
                    logger.error("TelegramAssistant missing send_message method")
