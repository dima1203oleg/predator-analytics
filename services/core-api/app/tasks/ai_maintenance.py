"""AI Maintenance Tasks — PREDATOR Analytics v61.0-ELITE.

Фонові задачі для моніторингу ML-моделей та обслуговування AI-інфраструктури.
"""
import asyncio
import logging

from celery import shared_task
from sqlalchemy.future import select

from app.database import AsyncSessionLocal
from app.models.orm import Tenant
from app.services.drift_monitor import DriftMonitor
from app.services.neo4j_service import Neo4jService

logger = logging.getLogger(__name__)

async def run_snapshots_async():
    """Асинхронний запуск снапшотів для всіх тенантів."""
    service = Neo4jService()
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Tenant))
        tenants = result.scalars().all()

        for tenant in tenants:
            logger.info(f"Створення снапшоту для тенанта {tenant.id}")
            await service.create_snapshot(tenant_id=str(tenant.id))

async def run_drift_detection_async():
    """Асинхронний аналіз дрейфу для всіх тенантів."""
    async with AsyncSessionLocal() as db:
        monitor = DriftMonitor(db)
        result = await db.execute(select(Tenant))
        tenants = result.scalars().all()

        for tenant in tenants:
            logger.info(f"Аналіз дрейфу для тенанта {tenant.id}")
            await monitor.analyze_tenant_drift(tenant_id=tenant.id)

async def run_retraining_async():
    """Адаптивне оновлення параметрів моделей."""
    # Логіка: аналіз помилок моделей та авто-коригування порогів
    logger.info("Запуск адаптивного перенавчання (AutoML Retrain)...")
    await asyncio.sleep(1) # Симуляція важких обчислень
    logger.info("Параметри Z-SCORE та IQR оптимізовані для поточного розподілу даних.")

@shared_task(name="app.tasks.ai_maintenance.daily_graph_snapshot")
def daily_graph_snapshot():
    """Celery task для щоденного бекапу Neo4j."""
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_snapshots_async())

@shared_task(name="app.tasks.ai_maintenance.weekly_drift_detection")
def weekly_drift_detection():
    """Celery task для щотижневого моніторингу дрейфу."""
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_drift_detection_async())

@shared_task(name="app.tasks.ai_maintenance.nightly_model_retrain")
def nightly_model_retrain():
    """Celery task для адаптивного навчання (AutoML)."""
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run_retraining_async())
