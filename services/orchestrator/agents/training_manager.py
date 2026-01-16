import logging
import docker
import json
from datetime import datetime

logger = logging.getLogger(__name__)

class TrainingManager:
    """
    Manages the H2O LLM Studio training process via Docker integration.
    Part of the Infinite Self-Improvement Loop.
    Localized in Ukrainian for Predator v25.
    """

    def __init__(self, redis_client=None):
        try:
            self.client = docker.from_env()
        except Exception:
            self.client = None
            logger.warning("Docker client unavailable. Training functionality will be limited.")

        self.redis = redis_client
        self.h2o_container_name = "h2o-llm-studio"
        self.min_training_samples = 100

    async def notify(self, message: str, status: str = "processing", progress: int = 0):
        """Send localized training updates to Redis for the UI"""
        if not self.redis:
            return

        event = {
            "timestamp": datetime.now().isoformat(),
            "stage": "training",
            "message": message,
            "status": status,
            "progress": progress
        }
        await self.redis.publish("predator:training_updates", json.dumps(event))
        await self.redis.set("system:training_status", json.dumps(event), ex=3600)

    async def check_data_and_train(self, dataset_size: int, config_name: str = "default_experiment.yaml") -> bool:
        """
        Перевіряє передумови для навчання. Розраховано на Predator v25.
        """
        logger.info(f"Checking training prerequisites. Dataset size: {dataset_size}")

        if dataset_size >= self.min_training_samples:
            await self.notify("🚀 Поріг даних досягнуто! Запуск автономного донавчання...", "start", 5)
            return await self.trigger_training(config_name)
        else:
            # check manual trigger from UI
            if self.redis:
                trigger = await self.redis.get("trigger:manual_training")
                if trigger:
                    await self.redis.delete("trigger:manual_training")
                    await self.notify("🔘 Ручний запуск навчання активовано користувачем...", "start", 10)
                    return await self.trigger_training(config_name)

            return False

    async def trigger_training(self, config_name: str) -> bool:
        """
        Виконує команду навчання всередині контейнера H2O.
        """
        if not self.client:
            await self.notify("❌ Помилка: Docker клієнт не ініціалізовано. Навчання неможливе.", "error")
            return False

        try:
            container = self.client.containers.get(self.h2o_container_name)
            command = f"python train.py -C /configs/{config_name}"

            logger.info(f"Executing training in {self.h2o_container_name}: {command}")
            container.exec_run(command, detach=True)

            await self.notify("✅ Процес навчання успішно ініціалізовано.", "running", 25)
            # Simulated progress reporting for UI feedback
            return True

        except docker.errors.NotFound:
            await self.notify(f"❌ Контейнер {self.h2o_container_name} не знайдено.", "error")
            return False
        except Exception as e:
            await self.notify(f"❌ Помилка запуску навчання: {str(e)}", "error")
            return False

    def get_training_status(self) -> str:
        """
        Перевіряє системний статус H2O LLM Studio.
        """
        if not self.client: return "OFFLINE"
        try:
            container = self.client.containers.get(self.h2o_container_name)
            return "RUNNING" if container.status == "running" else "IDLE"
        except:
            return "MISSING"
