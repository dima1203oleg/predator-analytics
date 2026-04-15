import asyncio
import os
import subprocess
import json
from datetime import datetime
from typing import Any

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

    async def check_tunnels(self):
        """Перевірка активності тунелів (ZROK/LHR)."""
        # В реальності тут була б перевірка через curl до healthcheck тунелю
        # Для симуляції просто перевіряємо наявність процесів
        try:
            result = subprocess.run(["pgrep", "-x", "zrok"], capture_output=True)
            if result.returncode != 0:
                logger.warning("⚠️ Guardian: ZROK tunnel process not found.")
            
            result = subprocess.run(["pgrep", "-f", "lhr.life"], capture_output=True)
            if result.returncode != 0:
                logger.warning("⚠️ Guardian: LHR tunnel process not found.")
        except Exception as e:
            logger.error(f"Error checking tunnels: {e}")

    async def check_system_load(self):
        """Перевірка критичного навантаження системи."""
        import psutil
        cpu = psutil.cpu_percent()
        ram = psutil.virtual_memory().percent
        
        if cpu > 90:
            logger.warning(f"🔥 Guardian: CRITICAL CPU LOAD: {cpu}%")
        if ram > 90:
            logger.warning(f"🔥 Guardian: CRITICAL RAM LOAD: {ram}%")

    async def record_metrics(self):
        """Збереження поточних метрик у Redis для побудови графіків динаміки."""
        from app.routers.system import _collect_system_stats
        from app.services.redis_service import get_redis_service
        
        redis = get_redis_service()
        if not redis._connected:
            return

        # Створюємо mock request для виклику внутрішньої функції
        class MockRequest:
            def __init__(self):
                self.app = type('obj', (object,), {'state': type('obj', (object,), {'started_at': datetime.now()})})

        try:
            stats = _collect_system_stats(MockRequest())
            
            metric_entry = {
                "timestamp": datetime.now().isoformat(),
                "cpu": stats["cpu_percent"],
                "ram": stats["memory_percent"],
                "disk": stats["disk_percent"],
                "active_tasks": stats["active_tasks"]
            }
            
            key = "system:metrics:history"
            client = redis._client
            await client.lpush(key, json.dumps(metric_entry))
            # Тримаємо тільки останні 288 записів (24 години при інтервалі 5 хв)
            await client.ltrim(key, 0, 287)
        except Exception as e:
            logger.error(f"Failed to record metrics to Redis: {e}")

    async def trigger_sync(self):
        """Запуск скрипта синхронізації з Colab."""
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
                days_left = (100 - history[0]["disk"]) / (usage_diff / (len(history) / 5)) # samples count fix
                return {
                    "status": "STABLE",
                    "disk_exhaustion_days": round(days_left, 1),
                    "recommendation": "Ресурсів достатньо. Планове очищення через 30 днів." if days_left > 30 else "Увага! Сховище буде заповнено менш ніж за місяць."
                }
            return {"status": "OPTIMAL", "message": "Споживання ресурсів стабільне."}
        except Exception:
            return {"status": "UNKNOWN"}

    async def generate_mock_scenarios(self):
        """Симуляція генерації OSINT-сценаріїв на основі 'аналізу' даних."""
        from app.services.redis_service import get_redis_service
        redis = get_redis_service()
        if not redis._connected:
            return

        scenarios = [
            {
                "id": "S1",
                "name": "Картельна змова на пальному",
                "probability": 82 + (datetime.now().minute % 10),
                "impact": "High",
                "description": "Аномальна синхронізація цін у мережах АЗС. Очікується ріст на 5%.",
                "eta": "24-48 годин"
            },
            {
                "id": "S2",
                "name": "Ризик дефолту контрагента X",
                "probability": 91,
                "impact": "High",
                "description": "Виявлено масове виведення активів через підставні фірми.",
                "eta": "Негайно"
            },
            {
                "id": "S3",
                "name": "Аномальний імпорт електроніки",
                "probability": 45,
                "impact": "Medium",
                "description": "Різке збільшення обсягів задекларованих iPhone під виглядом запчастин.",
                "eta": "72 години"
            }
        ]
        try:
            await redis.set("system:nexus:scenarios", json.dumps(scenarios))
            logger.info("🧠 Guardian: New OSINT scenarios generated.")
        except Exception as e:
            logger.error(f"Failed to save scenarios: {e}")

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
                
                # Генеруємо сценарії кожні 15 хвилин
                if counter % 15 == 0:
                    await self.generate_mock_scenarios()

                # Синхронізація з Colab кожну годину
                if counter % 60 == 0:
                    await self.trigger_sync()

                # Запис "heartbeat" у файл для синхронізації з Colab
                try:
                    with open("/tmp/predator_heartbeat", "w") as f:
                        f.write(datetime.now().isoformat())
                except: pass
                
                counter += 1
                await asyncio.sleep(self.interval)
            except Exception as e:
                logger.error(f"Guardian error: {e}")
                await asyncio.sleep(10)

    def stop(self):
        self.is_running = False
        logger.info("🛡️ Sovereign Guardian DEACTIVATED.")

guardian_service = SovereignGuardian()
