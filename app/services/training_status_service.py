import logging
from typing import Dict, Any

logger = logging.getLogger("app.services.training_status_service")

class TrainingStatusService:
    async def trigger_manual_training(self):
        logger.info("Manual training triggered (Mock)")
        return True

    async def get_current_status(self) -> Dict[str, Any]:
        return {
            "status": "idle",
            "last_training": None,
            "progress": 0
        }

training_status_service = TrainingStatusService()
