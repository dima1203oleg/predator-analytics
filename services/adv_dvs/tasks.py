"""
Фоновий планувальник (scheduler) для періодичного запуску перевірок ADV-DVS v56.5.
Покриває повний System Memory Contract v4.0.
"""
import asyncio
import logging
from datetime import UTC, datetime

from .checks import (
    backend_check,
    clickhouse_check,
    db_check,
    frontend_check,
    kafka_check,
    minio_check,
    neo4j_check,
    opensearch_check,
    qdrant_check,
    redis_check,
)
from .models import CheckResult, CheckStatus, RunResponse

logger = logging.getLogger("adv_dvs.tasks")

# Глобальний кеш для зберігання результатів останнього прогону
_LAST_RUN_RESULT: RunResponse | None = None

# Повний перелік перевірок (System Memory Contract v4.0)
_ALL_CHECK_MODULES = [
    frontend_check,
    backend_check,
    db_check,
    neo4j_check,
    clickhouse_check,
    opensearch_check,
    qdrant_check,
    redis_check,
    kafka_check,
    minio_check,
]


def get_last_run_result() -> RunResponse | None:
    """Отримати результати останньої автоматичної перевірки."""
    return _LAST_RUN_RESULT


def _overall_status(results: list[CheckResult]) -> CheckStatus:
    """Повертає найгірший статус зі списку результатів."""
    if not results:
        return CheckStatus.FAIL
    priority = {CheckStatus.OK: 0, CheckStatus.WARN: 1, CheckStatus.FAIL: 2}
    worst = max(results, key=lambda r: priority[r.status])
    return worst.status


async def run_all_checks_and_store() -> None:
    """Виконує всі перевірки і зберігає результат у кеш."""
    global _LAST_RUN_RESULT  # noqa: PLW0603
    logger.info("Запуск періодичних перевірок ADV-DVS (10 компонентів)...")

    checks = [module.run() for module in _ALL_CHECK_MODULES]
    results: list[CheckResult] = list(await asyncio.gather(*checks))

    _LAST_RUN_RESULT = RunResponse(
        timestamp=datetime.now(UTC),
        overall=_overall_status(results),
        results=results,
    )

    # Підрахунок статусів
    ok_count = sum(1 for r in results if r.status == CheckStatus.OK)
    warn_count = sum(1 for r in results if r.status == CheckStatus.WARN)
    fail_count = sum(1 for r in results if r.status == CheckStatus.FAIL)

    logger.info(
        "Перевірки завершено: %s | OK=%d WARN=%d FAIL=%d",
        _LAST_RUN_RESULT.overall.value.upper(),
        ok_count,
        warn_count,
        fail_count,
    )


async def periodic_checker(interval_seconds: int = 60) -> None:
    """Фоновий процес, що запускає перевірки з заданим інтервалом."""
    logger.info("Фоновий планувальник запущено (інтервал: %ds, компонентів: 10).", interval_seconds)
    while True:
        try:
            await run_all_checks_and_store()
        except Exception:
            logger.exception("Помилка під час періодичних перевірок")

        await asyncio.sleep(interval_seconds)
