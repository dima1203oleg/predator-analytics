"""Autonomous Agent Trigger — PREDATOR Analytics v56.5-ELITE.

Запускає автономні AGI-розслідування на основі результатів інгестії.
"""
import logging
import httpx
from typing import Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

class AutonomousTrigger:
    """Сервіс для ініціації автономних завдань в Antigravity Orchestrator."""

    def __init__(self):
        self.settings = get_settings()
        # В реальному середовищі URL береться з конфігу (наприклад, http://core-api:8000)
        self.api_url = "http://localhost:8000/api/v1/antigravity/tasks"

    async def trigger_investigation(
        self, 
        entity_name: str, 
        edrpou: str, 
        risk_score: float,
        reason: str = "High risk detected during ingestion"
    ) -> bool:
        """Надіслати запит на створення автономної задачі."""
        if risk_score < 70:
            return False

        logger.info(f"🚀 Triggering autonomous investigation for {entity_name} (Risk: {risk_score})")
        
        payload = {
            "description": f"Поглиблене OSINT-розслідування компанії {entity_name} (ЄДРПОУ {edrpou}). Причина: {reason}.",
            "priority": "high",
            "max_budget_usd": 15.0
        }

        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                response = await client.post(self.api_url, json=payload)
                if response.status_code == 200:
                    logger.info("Successfully created AGI task.")
                    return True
                else:
                    logger.error(f"Failed to create AGI task: {response.text}")
                    return False
            except Exception as e:
                logger.error(f"Error calling Antigravity API: {e}")
                return False
