"""Kolector data.gov.ua (CKAN API v3) — асинхронна версія.

Рефакторинг services/data_collectors/ua_state/datagov.py:
- Замінено requests → httpx (async)
- Додано публікацію подій у Kafka
"""
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.config import get_settings
from app.services.kafka_producer import publish_event

logger = logging.getLogger("ua_registry_gateway.datagov")
settings = get_settings()


def _build_event(dataset: dict[str, Any]) -> dict[str, Any]:
    """Формує стандартну Kafka-подію з датасету EDR/data.gov.ua."""
    return {
        "source": "ua.datagov",
        "event_type": "dataset.fetched",
        "collected_at": datetime.now(UTC).isoformat(),
        "payload": dataset,
    }


class DataGovUACollector:
    """Асинхронний колектор даних data.gov.ua (CKAN API v3)."""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.DATAGOV_BASE_URL,
            timeout=settings.HTTP_TIMEOUT_SECONDS,
            headers={"User-Agent": "PredatorAnalytics/1.0 (UA Registry Gateway)"},
        )

    async def __aenter__(self) -> "DataGovUACollector":
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self._client.aclose()

    async def list_recent_datasets(self, limit: int = 20) -> list[dict[str, Any]]:
        """Завантажує список нещодавно оновлених датасетів.

        Args:
            limit: кількість датасетів

        Returns:
            Список dict-ів з метаданими датасетів
        """
        try:
            response = await self._client.get(
                "/package_search",
                params={"q": "*:*", "sort": "metadata_modified desc", "rows": limit},
            )
            response.raise_for_status()
            result = response.json()
            if result.get("success"):
                return result["result"]["results"]  # type: ignore[no-any-return]
            logger.warning("CKAN API повернув success=false")
            return []
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Помилка запиту до data.gov.ua: {exc}")
            return []


async def collect_datagov() -> None:
    """Основна функція збору датасетів EDR (data.gov.ua).

    Викликається APScheduler за розкладом.
    """
    logger.info("Починаю збір даних data.gov.ua...")
    published = 0
    failed = 0

    try:
        async with DataGovUACollector() as collector:
            datasets = await collector.list_recent_datasets()
            logger.info(f"Отримано {len(datasets)} датасетів")

            for dataset in datasets:
                event = _build_event(dataset)
                ok = await publish_event(settings.KAFKA_TOPIC_EDR, event)
                if ok:
                    published += 1
                else:
                    failed += 1

    except Exception as exc:  # noqa: BLE001
        logger.error(f"Збій колектора data.gov.ua: {exc}")
    finally:
        logger.info(
            "Збір data.gov.ua завершено",
            extra={"published": published, "failed": failed},
        )
