import asyncio
import os
import subprocess
from datetime import datetime

from predator_common.logging import get_logger

logger = get_logger("core_api.guardian")

class SovereignGuardian:
    """
    Sovereign Guardian (v56.4.5)
    Автономний сервіс самовідновлення. Моніторить стан баз та тунелів.
    """

    def __init__(self, interval: int = 60):
        self.interval = interval
        self.is_running = False

    async def record_metrics(self):
        """Збереження поточних метрик у Redis для побудови графіків динаміки."""
        from app.routers.system import _collect_system_stats
        from app.services.redis_service import get_redis_service
        from fastapi import Request
        
        redis = get_redis_service()
        if not redis._connected:
            return

        # Створюємо mock request для виклику внутрішньої функції
        class MockRequest:
            def __init__(self):
                self.app = type('obj', (object,), {'state': type('obj', (object,), {'started_at': datetime.now()})})

        stats = _collect_system_stats(MockRequest())
        
        metric_entry = {
            "timestamp": datetime.now().isoformat(),
            "cpu": stats["cpu_percent"],
            "ram": stats["memory_percent"],
            "disk": stats["disk_percent"],
            "active_tasks": stats["active_tasks"]
        }
        
        key = "system:metrics:history"
        try:
            # Додаємо в початок списку
            client = redis._client
            await client.lpush(key, json.dumps(metric_entry))
            # Тримаємо тільки останні 288 записів (24 години при інтервалі 5 хв)
            await client.ltrim(key, 0, 287)
        except Exception as e:
            logger.error(f"Failed to record metrics to Redis: {e}")

    async def run_loop(self):
        self.is_running = True
        logger.info("🦅 Sovereign Guardian ACTIVATED. Monitoring system health...")
        
        counter = 0
        while self.is_running:
            try:
                await self.check_tunnels()
                await self.check_system_load()
                
                # Записуємо метрики кожні 5 хвилин (якщо цикл 60с, то кожний 5-й цикл)
                if counter % 5 == 0:
                    await self.record_metrics()
                
                # Запис "heartbeat" у файл для синхронізації з Colab
                with open("/tmp/predator_heartbeat", "w") as f:
                    f.write(datetime.now().isoformat())
                
                counter += 1
                await asyncio.sleep(self.interval)
            except Exception as e:
                logger.error(f"Guardian error: {e}")
                await asyncio.sleep(10)

    def stop(self):
        self.is_running = False
        logger.info("🛡️ Sovereign Guardian DEACTIVATED.")

guardian_service = SovereignGuardian()
