"""Drift Detection Service — PREDATOR Analytics v61.0-ELITE.

Моніторинг стабільності ML-моделей та аналіз розподілу ризиків.
Виявляє суттєві зміни в статистичних показниках (Score Drift).
"""
from datetime import UTC, datetime, timedelta
import logging
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import RiskScore
from app.services.kafka_service import KafkaService

logger = logging.getLogger(__name__)

class DriftMonitor:
    """Сервіс для виявлення статистичного дрейфу моделей."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.kafka = KafkaService()

    async def analyze_tenant_drift(self, tenant_id: UUID | str) -> dict[str, Any]:
        """Аналіз дрейфу CERS скорів для конкретного тенанта за останній тиждень."""
        now = datetime.now(UTC)
        last_week = now - timedelta(days=7)
        previous_week = now - timedelta(days=14)

        # 1. Середній бал за поточний тиждень
        current_avg = await self._get_avg_score(tenant_id, last_week, now)
        # 2. Середній бал за попередній тиждень
        previous_avg = await self._get_avg_score(tenant_id, previous_week, last_week)

        if previous_avg == 0:
            return {"drift_detected": False, "message": "Недостатньо даних для порівняння"}

        drift_percent = ((current_avg - previous_avg) / previous_avg) * 100

        drift_detected = abs(drift_percent) > 15.0 # Поріг 15% згідно ТЗ

        if drift_detected:
            await self._alert_drift(tenant_id, drift_percent, current_avg, previous_avg)

        return {
            "tenant_id": str(tenant_id),
            "drift_detected": drift_detected,
            "drift_percent": round(drift_percent, 2),
            "current_avg": round(current_avg, 2),
            "previous_avg": round(previous_avg, 2),
            "timestamp": now.isoformat()
        }

    async def _get_avg_score(self, tenant_id: UUID | str, start_date: datetime, end_date: datetime) -> float:
        """Отримання середнього значення CERS."""
        stmt = select(func.avg(RiskScore.cers)).where(
            RiskScore.tenant_id == str(tenant_id),
            RiskScore.score_date >= start_date,
            RiskScore.score_date <= end_date
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0.0

    async def _alert_drift(self, tenant_id: UUID | str, percent: float, current: float, previous: float):
        """Відправка алерту про виявлений дрейф."""
        alert_msg = {
            "event": "MODEL_DRIFT_DETECTED",
            "tenant_id": str(tenant_id),
            "severity": "SEV-2",
            "details": f"Виявлено дрейф показників ризику: {percent:.1f}%. Поточне сер.: {current:.2f}, попереднє: {previous:.2f}",
            "timestamp": datetime.now(UTC).isoformat()
        }

        await self.kafka.send_message(
            f"tenant.{tenant_id}.risk.alerts",
            alert_msg
        )
        logger.warning(f"🚨 DRIFT ALERT [Tenant {tenant_id}]: {percent:.1f}% shift detected!")
