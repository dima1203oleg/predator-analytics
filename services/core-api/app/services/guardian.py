import asyncio
from datetime import datetime
import json
import subprocess
from typing import Any

from predator_common.logging import get_logger

logger = get_logger("core_api.guardian")

class SovereignGuardian:
    """Sovereign Guardian (v63.0-ELITE)
    Автономний сервіс самовідновлення. Моніторить стан баз та тунелів.
    Інтегрований з War-gaming Engine для динамічного моделювання загроз.
    """

    def __init__(self, interval: int = 60):
        self.interval = interval
        self.is_running = False

    async def check_tunnels(self):
        """Перевірка активності тунелів (ZROK/LHR)."""
        try:
            # Перевірка ZROK
            result = subprocess.run(["pgrep", "-x", "zrok"], capture_output=True)
            if result.returncode != 0:
                logger.warning("⚠️ Guardian: ZROK tunnel process not found. Attempting RESTART...")
                # Спроба перезапуску
                subprocess.run(["systemctl", "restart", "zrok"], capture_output=False)

            # Перевірка LHR (LocalHostRun)
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
        """Збереження поточних метрик у Redis."""
        from app.routers.system import _collect_system_stats
        from app.services.valkey_service import get_valkey_service

        redis = get_valkey_service()
        if not redis._connected:
            return

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
            await redis._client.lpush(key, json.dumps(metric_entry))
            await redis._client.ltrim(key, 0, 287)
        except Exception as e:
            logger.error(f"Failed to record metrics: {e}")

    async def trigger_sync(self):
        """Синхронізація з Colab."""
        logger.info("📡 Guardian: Starting data sync...")
        import os
        script_path = os.getenv("SYNC_SCRIPT_PATH", "/app/deploy/scripts/push_to_colab_sync.sh")
        if not os.path.exists(script_path):
            script_path = "/Users/Shared/Predator_60/deploy/scripts/push_to_colab_sync.sh"
            
        if not os.path.exists(script_path):
            logger.warning(f"⚠️ Guardian: Sync script not found at {script_path}")
            return

        try:
            result = subprocess.run(["bash", script_path], capture_output=True, text=True)
            if result.returncode == 0:
                logger.info("✅ Guardian: Data sync successful.")
            else:
                logger.error(f"❌ Guardian: Sync failed: {result.stderr}")
        except Exception as e:
            logger.error(f"❌ Guardian: Error triggering sync: {e}")

    async def get_predictions(self) -> dict[str, Any]:
        """Прогнозування стану ресурсів."""
        from app.services.valkey_service import get_valkey_service
        redis = get_valkey_service()
        if not redis._connected: return {}

        try:
            raw_data = await redis._client.lrange("system:metrics:history", 0, -1)
            history = [json.loads(d) for d in raw_data]
            if len(history) < 2: return {"status": "COLLECTING_DATA"}
            usage_diff = history[0]["disk"] - history[-1]["disk"]
            if usage_diff > 0:
                days_left = (100 - history[0]["disk"]) / (usage_diff / (len(history) / 5))
                return {"status": "STABLE", "disk_exhaustion_days": round(days_left, 1)}
            return {"status": "OPTIMAL"}
        except Exception: return {"status": "UNKNOWN"}

    async def generate_active_scenarios(self):
        """Генерація реальних OSINT-сценаріїв через War-gaming Engine."""
        from app.services.valkey_service import get_valkey_service
        from app.services.wargaming_engine import wargaming_engine

        redis = get_valkey_service()
        if not redis._connected: return

        try:
            scenarios = await wargaming_engine.generate_scenarios()
            await redis.set("system:nexus:scenarios", json.dumps(scenarios))
            logger.info(f"🧠 Guardian: {len(scenarios)} dynamic OSINT scenarios generated.")
        except Exception as e:
            logger.error(f"Failed to save scenarios: {e}")

    async def run_loop(self):
        self.is_running = True
        logger.info("🦅 Sovereign Guardian ACTIVATED.")
        counter = 0
        while self.is_running:
            try:
                await self.check_tunnels()
                await self.check_system_load()
                if counter % 5 == 0: await self.record_metrics()
                if counter % 15 == 0: await self.generate_active_scenarios()
                if counter % 60 == 0: await self.trigger_sync()

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
