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

    async def trigger_sync(self):
        """Запуск скрипта синхронізації з Colab."""
        import subprocess
        logger.info("📡 Guardian: Starting data sync to SOVEREIGN HUB (Colab Mirror)...")
        try:
            # Запускаємо скрипт синхронізації
            result = subprocess.run(["bash", "/Users/Shared/Predator_60/deploy/scripts/push_to_colab_sync.sh"], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info("✅ Guardian: Data sync successful.")
                from app.services.redis_service import get_redis_service
                redis = get_redis_service()
                await redis.set("system:last_sync", datetime.now().isoformat())
            else:
                logger.error(f"❌ Guardian: Sync failed: {result.stderr}")
        except Exception as e:
            logger.error(f"❌ Guardian: Error triggering sync: {e}")

    async def get_predictions(self) -> dict[str, Any]:
        """Прогнозування стану ресурсів на основі історії."""
        from app.services.redis_service import get_redis_service
        redis = get_redis_service()
        if not redis._connected:
            return {}
            
        try:
            raw_data = await redis._client.lrange("system:metrics:history", 0, -1)
            history = [json.loads(d) for d in raw_data]
            
            if len(history) < 2:
                return {"status": "COLLECTING_DATA", "message": "Накопичення даних для аналізу..."}
                
            # Проста лінійна апроксимація для дисків
            usage_diff = history[0]["disk"] - history[-1]["disk"]
            if usage_diff > 0:
                days_left = (100 - history[0]["disk"]) / (usage_diff / (len(history) / 12)) # 12 samples per hour
                return {
                    "status": "STABLE",
                    "disk_exhaustion_days": round(days_left, 1),
                    "recommendation": "Ресурсів достатньо. Планове очищення через 30 днів." if days_left > 30 else "Увага! Сховище буде заповнено менш ніж за місяць."
                }
            return {"status": "OPTIMAL", "message": "Споживання ресурсів стабільне."}
        except Exception:
            return {"status": "UNKNOWN"}

    async def run_loop(self):
        self.is_running = True
        logger.info("🦅 Sovereign Guardian ACTIVATED. Monitoring system health...")
        
        counter = 0
        while self.is_running:
            try:
                await self.check_tunnels()
                await self.check_system_load()
                
                # Записуємо метрики кожні 5 хвилин
                if counter % 5 == 0:
                    await self.record_metrics()
                
                # Синхронізація з Colab кожну годину (якщо цикл 60с, то кожний 60-й цикл)
                if counter % 60 == 0:
                    await self.trigger_sync()

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
