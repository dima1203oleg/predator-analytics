"""Kolector Prozorro — асинхронна версія.

Рефакторинг services/data_collectors/ua_state/prozorro.py:
- Замінено requests → httpx (async)
- Додано публікацію подій у Kafka
- Додано структурований логінг
"""
import logging
from datetime import UTC, datetime
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import get_settings
from app.services.kafka_producer import publish_event

logger = logging.getLogger("ua_registry_gateway.prozorro")
settings = get_settings()


def _build_event(tender: dict[str, Any]) -> dict[str, Any]:
    """Формує стандартну Kafka-подію з тендеру Prozorro."""
    return {
        "source": "ua.prozorro",
        "event_type": "tender.fetched",
        "collected_at": datetime.now(UTC).isoformat(),
        "payload": tender,
    }


class ProzorroCollector:
    """Асинхронний колектор тендерів Prozorro (openprocurement.org API 2.5)."""

    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.PROZORRO_API_URL,
            timeout=settings.HTTP_TIMEOUT_SECONDS,
            headers={"User-Agent": "PredatorAnalytics/1.0 (UA Registry Gateway)"},
        )

    async def __aenter__(self) -> "ProzorroCollector":
        return self

    async def __aexit__(self, *_: Any) -> None:
        await self._client.aclose()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def fetch_tenders_page(
        self,
        offset: str = "",
        limit: int | None = None,
    ) -> dict[str, Any]:
        """Завантажує одну сторінку тендерів.

        Args:
            offset: токен пагінації від попередньої відповіді
            limit: кількість записів (за замовчуванням з конфігу)

        Returns:
            dict з ключами 'data' та 'next_page'
        """
        params: dict[str, Any] = {
            "limit": limit or settings.PROZORRO_PAGE_LIMIT,
            "descending": 1,
        }
        if offset:
            params["offset"] = offset

        response = await self._client.get("/tenders", params=params)
        response.raise_for_status()
        return response.json()  # type: ignore[no-any-return]

    async def fetch_tender_detail(self, tender_id: str) -> dict[str, Any] | None:
        """Отримує повні дані одного тендеру.

        Args:
            tender_id: ідентифікатор тендеру Prozorro

        Returns:
            dict з даними тендеру або None при помилці
        """
        try:
            response = await self._client.get(f"/tenders/{tender_id}")
            response.raise_for_status()
            return response.json().get("data")  # type: ignore[no-any-return]
        except httpx.HTTPStatusError as exc:
            logger.error(f"HTTP помилка для тендеру {tender_id}: {exc.response.status_code}")
            return None
        except Exception as exc:  # noqa: BLE001
            logger.error(f"Помилка отримання тендеру {tender_id}: {exc}")
            return None


async def collect_prozorro() -> None:
    """Основна функція збору тендерів Prozorro.

    Викликається APScheduler за розкладом.
    Завантажує одну сторінку тендерів та публікує кожен у Kafka.
    """
    logger.info("Починаю збір даних Prozorro...")
    published = 0
    failed = 0

    try:
        async with ProzorroCollector() as collector:
            data = await collector.fetch_tenders_page()
            tenders: list[dict[str, Any]] = data.get("data", [])

            logger.info(f"Отримано {len(tenders)} тендерів")

            for tender in tenders:
                event = _build_event(tender)
                ok = await publish_event(settings.KAFKA_TOPIC_PROZORRO, event)
                if ok:
                    published += 1
                else:
                    failed += 1

    except Exception as exc:  # noqa: BLE001
        logger.error(f"Збій колектора Prozorro: {exc}")
    finally:
        logger.info(
            "Збір Prozorro завершено",
            extra={"published": published, "failed": failed},
        )
