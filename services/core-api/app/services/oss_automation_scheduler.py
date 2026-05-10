"""
Планувальник фонових задач на базі APScheduler (Apache License 2.0, opensource).

Додає планові «пульси» автоматизації поверх asyncio-фабрики: синхронізація оркестратора,
розширювані cron-події без пропрієтарних залежностей.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from predator_common.logging import get_logger

if TYPE_CHECKING:
    from fastapi import FastAPI

logger = get_logger("core_api.oss_scheduler")


def create_oss_automation_scheduler(app: "FastAPI", interval_minutes: int) -> AsyncIOScheduler:
    """Створює AsyncIOScheduler із завданнями розширення автоматизації."""
    scheduler = AsyncIOScheduler()

    interval_minutes = max(5, interval_minutes)

    async def oss_automation_pulse() -> None:
        """Періодичний пульс: лог + синхронізація з журналом фабрики (відкритий стек)."""
        logger.info(
            "OSS APScheduler: плановий пульс автоматизації (інтервал %s хв).",
            interval_minutes,
        )
        try:
            from app.services.antigravity_orchestrator import orchestrator

            if getattr(app.state, "factory_repo", None) is not None:
                await orchestrator.sync_with_factory(app)
        except Exception:
            logger.exception("OSS APScheduler: не вдалося виконати pulse-синхронізацію.")

    scheduler.add_job(
        oss_automation_pulse,
        trigger=IntervalTrigger(minutes=interval_minutes),
        id="oss_automation_pulse",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    return scheduler
