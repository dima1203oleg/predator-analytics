"""Data Freshness Monitor — PREDATOR Analytics (T1.3).

Celery завдання для моніторингу свіжості джерел і генерації SEV-2 алертів.
"""
import asyncio
from datetime import UTC, datetime, timedelta
import logging

from sqlalchemy import select

from app.database import async_session_maker
from app.models.orm import IngestionJob, Tenant
from app.services.kafka_service import get_kafka_service

logger = logging.getLogger(__name__)

# Пороги свіжості для різних джерел
CRITICAL_SOURCES = {
    "customs": timedelta(hours=6),
    "youcontrol": timedelta(hours=24),
    "opensanctions": timedelta(days=7),
    "rnbo": timedelta(hours=12),
}

async def _check_freshness_async() -> None:
    """Асинхронна логіка перевірки свіжості даних."""
    now = datetime.now(UTC)
    kafka = get_kafka_service()

    async with async_session_maker() as session:
        # Отримуємо всіх активних тенантів
        result = await session.execute(select(Tenant.id))
        tenant_ids = [str(t_id) for t_id in result.scalars().all()]

        # Для спрощення, перевіряємо останній успішний IngestionJob для джерел
        for source, threshold in CRITICAL_SOURCES.items():
            # Тут в реальності треба мапити source на тип IngestionJob (dataset_type)
            # Припустимо, що dataset_type == source

            # Шукаємо останню успішну джобу
            stmt = (
                select(IngestionJob)
                .where(
                    IngestionJob.dataset_type == source,
                    IngestionJob.status == "completed"
                )
                .order_by(IngestionJob.completed_at.desc())
                .limit(1)
            )
            job_result = await session.execute(stmt)
            job = job_result.scalars().first()

            is_stale = False
            last_updated = None

            if not job:
                # Даних взагалі не було
                is_stale = True
            elif job.completed_at and (now - job.completed_at.replace(tzinfo=UTC)) > threshold:
                # Дані застаріли
                is_stale = True
                last_updated = job.completed_at

            if is_stale:
                logger.warning(f"Data source '{source}' is stale. Threshold: {threshold}")

                # Генеруємо алерти для кожного тенанта
                for tenant_id in tenant_ids:
                    # Публікуємо алерт через Kafka (TZ v5.0 §5.4: SEV-2 alert + publish до risk.alerts)
                    # В ідеалі - створити Alert у БД, або сервіс Alert-ів сам його створить з Kafka
                    await kafka.publish_alert_triggered(
                        alert_id=f"freshness-{source}-{int(now.timestamp())}",
                        tenant_id=tenant_id,
                        alert_type="data_freshness_violation",
                        severity="SEV-2",
                        payload={
                            "source": source,
                            "threshold_seconds": threshold.total_seconds(),
                            "last_updated": last_updated.isoformat() if last_updated else None,
                        }
                    )


def check_data_freshness() -> None:
    """Синхронна обгортка для Celery."""
    asyncio.run(_check_freshness_async())
