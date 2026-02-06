from __future__ import annotations

from datetime import datetime
import json
import logging
import os
from typing import Any, Dict


# Використовуємо redis.asyncio (сучасний підхід замість deprecated aioredis)
try:
    import redis.asyncio as aioredis
except ImportError:
    import redis as aioredis  # Fallback

logger = logging.getLogger("services.training_status")

class TrainingStatusService:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        self._redis = None

    async def _get_redis(self):
        if self._redis is None:
            self._redis = aioredis.from_url(self.redis_url, decode_responses=True)
        return self._redis

    async def get_latest_status(self) -> dict[str, Any]:
        """Fetch the latest training status from Redis."""
        try:
            redis = await self._get_redis()
            status_raw = await redis.get("system:training_status")

            if status_raw:
                return json.loads(status_raw)

            return {
                "timestamp": datetime.now().isoformat(),
                "stage": "training",
                "message": "Система очікує накопичення даних для навчання",
                "status": "idle",
                "progress": 0
            }
        except Exception as e:
            logger.exception(f"Failed to fetch training status: {e}")
            return {
                "status": "error",
                "message": f"Помилка отримання статусу: {e!s}",
                "progress": 0
            }

    async def get_metrics_history(self) -> dict[str, Any]:
        """Fetch history of training metrics (loss, accuracy) from Redis list."""
        try:
            redis = await self._get_redis()
            history_raw = await redis.lrange("system:training_history", 0, 50)

            history = []
            for item in history_raw:
                try:
                    history.append(json.loads(item))
                except:
                    continue

            # Return in chronological order
            return {"history": history[::-1]}
        except Exception as e:
            logger.exception(f"Failed to fetch training history: {e}")
            return {"history": []}

    async def update_status(self, status: dict[str, Any]):
        """Update current status and push to history if it contains metrics."""
        try:
            redis = await self._get_redis()
            await redis.set("system:training_status", json.dumps(status))

            # If metrics are present, add to history
            if "metrics" in status:
                point = {
                    "timestamp": datetime.now().isoformat(),
                    "loss": status["metrics"].get("loss"),
                    "accuracy": status["metrics"].get("accuracy"),
                    "epoch": status["metrics"].get("epoch")
                }
                await redis.lpush("system:training_history", json.dumps(point))
                await redis.ltrim("system:training_history", 0, 100) # Keep last 100 points
            return True
        except Exception as e:
            logger.exception(f"Failed to update training status: {e}")
            return False

    async def trigger_manual_training(self) -> bool:
        """Set a trigger in Redis for the Orchestrator to start training."""
        try:
            redis = await self._get_redis()
            await redis.set("trigger:manual_training", "1", ex=300)
            return True
        except Exception as e:
            logger.exception(f"Failed to trigger manual training: {e}")
            return False

training_status_service = TrainingStatusService()
