from datetime import UTC, datetime
import logging
from typing import Any


logger = logging.getLogger("app.services.training_status_service")


class TrainingStatusService:
    async def trigger_manual_training(self):
        logger.info("Manual training triggered (Mock)")
        return True

    async def get_current_status(self) -> dict[str, Any]:
        return {
            "status": "idle",
            "last_training": None,
            "progress": 0,
            "timestamp": datetime.now(UTC).isoformat(),
        }

    async def get_latest_status(self) -> dict[str, Any]:
        """Alias for get_current_status used by v25 routes."""
        return await self.get_current_status()


training_status_service = TrainingStatusService()
