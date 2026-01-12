"""
Power Monitor Service
Відстежує перебої електропостачання та веде реєстр роботи сервера
"""
import asyncio
import logging
import os
import json
from datetime import datetime, timedelta
from typing import List, Dict
import redis.asyncio as aioredis

logger = logging.getLogger("power_monitor")

class PowerMonitor:
    """Моніторинг електропостачання та uptime сервера"""

    def __init__(self, redis_url: str, telegram_bot=None):
        self.redis_url = redis_url
        self.telegram_bot = telegram_bot
        self.redis = None
        self.last_heartbeat = None
        self.power_on_time = None
        self.is_running = False

    async def initialize(self):
        """Ініціалізація сервісу"""
        try:
            self.redis = await aioredis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5
            )
            await self.redis.ping()
            logger.info("✅ Power Monitor initialized")

            # Перевіряємо чи це перезапуск після вимкнення
            await self._check_power_restoration()

        except Exception as e:
            logger.error(f"❌ Power Monitor init failed: {e}")
            self.redis = None

    async def _check_power_restoration(self):
        """Перевіряє чи був перебій з електропостачанням"""
        if not self.redis:
            return

        try:
            # Отримуємо останній heartbeat
            last_seen_json = await self.redis.get("power:last_heartbeat")

            if last_seen_json:
                last_seen_data = json.loads(last_seen_json)
                last_seen = datetime.fromisoformat(last_seen_data["timestamp"])
                now = datetime.now()

                # Якщо різниця більше 5 хвилин - була відсутність
                downtime = now - last_seen

                if downtime > timedelta(minutes=5):
                    # Був перебій!
                    await self._log_power_outage(last_seen, now, downtime)

                    # Відправляємо нотифікацію
                    message = (
                        f"⚡ **ЕЛЕКТРОПОСТАЧАННЯ ВІДНОВЛЕНО!**\n\n"
                        f"🔴 Вимкнено: {last_seen.strftime('%Y-%m-%d %H:%M:%S')}\n"
                        f"🟢 Увімкнено: {now.strftime('%Y-%m-%d %H:%M:%S')}\n"
                        f"⏱️ Тривалість перебою: {self._format_duration(downtime)}\n\n"
                        f"🖥️ Сервер повністю відновлено!"
                    )

                    await self._send_notification(message, priority="high")
                else:
                    logger.info(f"✅ Normal restart detected (downtime: {downtime})")
            else:
                # Перший запуск
                logger.info("🆕 First power monitor run")

            # Записуємо час запуску
            self.power_on_time = datetime.now()
            await self.redis.set("power:startup_time", self.power_on_time.isoformat())

        except Exception as e:
            logger.error(f"Error checking power restoration: {e}")

    async def _log_power_outage(self, off_time: datetime, on_time: datetime, duration: timedelta):
        """Логує перебій електропостачання в реєстр"""
        if not self.redis:
            return

        try:
            outage_record = {
                "id": f"outage_{int(off_time.timestamp())}",
                "power_off": off_time.isoformat(),
                "power_on": on_time.isoformat(),
                "duration_seconds": int(duration.total_seconds()),
                "duration_human": self._format_duration(duration)
            }

            # Зберігаємо в список всіх перебоїв
            await self.redis.lpush("power:outages_history", json.dumps(outage_record))

            # Тримаємо останні 100 записів
            await self.redis.ltrim("power:outages_history", 0, 99)

            # Оновлюємо статистику
            total_outages = await self.redis.incr("power:total_outages")
            total_downtime = await self.redis.incrby(
                "power:total_downtime_seconds",
                int(duration.total_seconds())
            )

            logger.info(f"📝 Logged power outage #{total_outages}: {duration}")

        except Exception as e:
            logger.error(f"Error logging outage: {e}")

    async def start_monitoring(self):
        """Запускає моніторинг (heartbeat кожні 30 секунд)"""
        self.is_running = True
        logger.info("🔄 Power monitoring started (heartbeat: 30s)")

        while self.is_running:
            try:
                await self._send_heartbeat()
                await asyncio.sleep(30)  # Кожні 30 секунд
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(30)

    async def _send_heartbeat(self):
        """Відправляє heartbeat сигнал"""
        if not self.redis:
            return

        try:
            heartbeat_data = {
                "timestamp": datetime.now().isoformat(),
                "uptime_seconds": self._get_uptime_seconds()
            }

            await self.redis.set(
                "power:last_heartbeat",
                json.dumps(heartbeat_data),
                ex=300  # Expires after 5 minutes
            )

            self.last_heartbeat = datetime.now()

            # Кожні 30 хвилин відправляємо звіт про uptime
            uptime_minutes = self._get_uptime_seconds() / 60
            if uptime_minutes > 0 and uptime_minutes % 30 < 0.5:
                await self._send_uptime_report()

        except Exception as e:
            logger.error(f"Heartbeat send error: {e}")

    async def _send_uptime_report(self):
        """Відправляє звіт про uptime"""
        uptime = self._get_uptime_seconds()

        message = (
            f"💚 **UPTIME REPORT**\n\n"
            f"🟢 Сервер працює: {self._format_duration(timedelta(seconds=uptime))}\n"
            f"⚡ Статус: Stable\n"
            f"📅 Запуск: {self.power_on_time.strftime('%Y-%m-%d %H:%M:%S') if self.power_on_time else 'Unknown'}"
        )

        await self._send_notification(message, priority="low")

    def _get_uptime_seconds(self) -> int:
        """Повертає uptime в секундах"""
        if not self.power_on_time:
            return 0
        return int((datetime.now() - self.power_on_time).total_seconds())

    def _format_duration(self, duration: timedelta) -> str:
        """Форматує тривалість у читабельний вигляд"""
        total_seconds = int(duration.total_seconds())

        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        parts = []
        if days > 0:
            parts.append(f"{days}d")
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        if seconds > 0 or not parts:
            parts.append(f"{seconds}s")

        return " ".join(parts)

    async def get_outages_history(self, limit: int = 10) -> List[Dict]:
        """Отримує історію перебоїв"""
        if not self.redis:
            return []

        try:
            outages_json = await self.redis.lrange("power:outages_history", 0, limit - 1)
            return [json.loads(o) for o in outages_json]
        except Exception as e:
            logger.error(f"Error getting outages history: {e}")
            return []

    async def get_statistics(self) -> Dict:
        """Отримує статистику електропостачання"""
        if not self.redis:
            return {}

        try:
            total_outages = await self.redis.get("power:total_outages") or 0
            total_downtime = await self.redis.get("power:total_downtime_seconds") or 0
            startup_time_str = await self.redis.get("power:startup_time")

            uptime = self._get_uptime_seconds()

            stats = {
                "current_uptime": self._format_duration(timedelta(seconds=uptime)),
                "current_uptime_seconds": uptime,
                "startup_time": startup_time_str,
                "total_outages": int(total_outages),
                "total_downtime": self._format_duration(timedelta(seconds=int(total_downtime))),
                "total_downtime_seconds": int(total_downtime),
                "average_outage_duration": self._format_duration(
                    timedelta(seconds=int(total_downtime) // max(int(total_outages), 1))
                ) if int(total_outages) > 0 else "0s"
            }

            return stats

        except Exception as e:
            logger.error(f"Error getting statistics: {e}")
            return {}

    async def _send_notification(self, message: str, priority: str = "normal"):
        """Відправляє нотифікацію через Telegram"""
        if self.telegram_bot and hasattr(self.telegram_bot, 'send_power_notification'):
            try:
                await self.telegram_bot.send_power_notification(message, priority)
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")

        # Також публікуємо в Redis PubSub
        if self.redis:
            try:
                await self.redis.publish("predator:events", json.dumps({
                    "id": f"power_{int(datetime.now().timestamp())}",
                    "timestamp": datetime.now().isoformat(),
                    "stage": "power",
                    "message": message,
                    "status": "info" if priority == "low" else "warning" if priority == "high" else "processing",
                    "priority": priority
                }))
            except Exception as e:
                logger.error(f"Failed to publish event: {e}")

        logger.info(f"⚡ Power notification: {message[:100]}")

    async def stop(self):
        """Зупиняє моніторинг"""
        self.is_running = False

        if self.redis:
            # Зберігаємо фінальний heartbeat перед вимкненням
            await self._send_heartbeat()

        logger.info("🛑 Power Monitor stopped")


async def main():
    """Standalone запуск Power Monitor для тестування"""
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

    monitor = PowerMonitor(redis_url=REDIS_URL)
    await monitor.initialize()

    try:
        await monitor.start_monitoring()
    except KeyboardInterrupt:
        await monitor.stop()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
