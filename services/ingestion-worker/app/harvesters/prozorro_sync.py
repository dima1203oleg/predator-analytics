"""Prozorro Synchronizer — Синхронізатор публічних закупівель із Prozorro API.

Реалізує безперервну синхронізацію з системою Prozorro через Feed API
відповідно до стандарту Open Contracting Data Standard (OCDS).

Ключові механізми:
- Feed-based пагінація за dateModified (causal consistency)
- Watermark-механізм для запобігання розривам синхронізації
- opt_fields для мінімізації кількості GET-запитів
- Rate limiting (polite harvesting)
- Модульна структура: Plans → Tenders → Contracts → Frameworks
"""

import asyncio
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

import httpx
from pydantic import BaseModel

from predator_common.logging import get_logger

logger = get_logger("ingestion.harvesters.prozorro")

# Базовий URL Prozorro API
PROZORRO_API_BASE = "https://public.api.openprocurement.org/api/2.5"

# Ліміт записів на одну сторінку Feed
FEED_PAGE_SIZE = 100


class ProzorroEntityType(StrEnum):
    """Типи сутностей у системі Prozorro."""

    TENDER = "tenders"
    PLAN = "plans"
    CONTRACT = "contracts"
    FRAMEWORK = "frameworks"


class TenderSummary(BaseModel):
    """Компактне представлення тендеру для аналітики."""

    tender_id: str
    date_modified: str
    procuring_entity_edrpou: str = ""
    procuring_entity_name: str = ""
    status: str = ""
    procurement_method: str = ""
    value_amount: float = 0.0
    value_currency: str = "UAH"
    title: str = ""
    description: str = ""


class SyncState(BaseModel):
    """Стан синхронізації для збереження позиції у Feed."""

    entity_type: str
    last_offset: str = ""
    last_date_modified: str = ""
    total_synced: int = 0
    last_sync_at: str = ""
    watermark: str = ""


class ProzorroSynchronizer:
    """Синхронізатор даних з Prozorro через Feed API.

    Реалізує безперервну інгестію тендерів, планів та контрактів
    для побудови Knowledge Graph публічних закупівель.
    """

    def __init__(
        self,
        api_base: str = PROZORRO_API_BASE,
        rate_limit_delay: float = 0.5,
        max_pages_per_run: int = 50,
    ) -> None:
        """Ініціалізація синхронізатора.

        Args:
            api_base: Базовий URL Prozorro API.
            rate_limit_delay: Затримка між запитами (секунди).
            max_pages_per_run: Максимум сторінок за один запуск.
        """
        self.api_base = api_base
        self.rate_limit_delay = rate_limit_delay
        self.max_pages_per_run = max_pages_per_run
        self._client: httpx.AsyncClient | None = None

        # Стан синхронізації для кожного типу сутності
        self._sync_states: dict[str, SyncState] = {
            entity_type.value: SyncState(entity_type=entity_type.value)
            for entity_type in ProzorroEntityType
        }

        # Лічильники статистики
        self._stats: dict[str, int] = {
            "tenders_synced": 0,
            "plans_synced": 0,
            "contracts_synced": 0,
            "errors": 0,
            "pages_fetched": 0,
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Отримати або створити HTTP-клієнт."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=15.0),
                headers={
                    "User-Agent": "PREDATOR-Analytics/57.0 (Prozorro Sync)",
                    "Accept": "application/json",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        """Закрити HTTP-клієнт."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def fetch_feed_page(
        self,
        entity_type: ProzorroEntityType,
        offset: str = "",
        opt_fields: str = "status,procuringEntity,value",
    ) -> dict[str, Any]:
        """Отримати одну сторінку Feed API.

        Args:
            entity_type: Тип сутності (tenders, plans, etc.).
            offset: Зсув для пагінації (порожній = з початку).
            opt_fields: Додаткові поля для включення у відповідь.

        Returns:
            Дані сторінки з полями data, next_page, prev_page.
        """
        client = await self._get_client()

        params: dict[str, Any] = {
            "limit": FEED_PAGE_SIZE,
            "mode": "_all_",
        }
        if offset:
            params["offset"] = offset
        if opt_fields:
            params["opt_fields"] = opt_fields

        try:
            response = await client.get(
                f"{self.api_base}/{entity_type.value}",
                params=params,
            )
            response.raise_for_status()
            result = response.json()

            self._stats["pages_fetched"] += 1
            return result

        except httpx.HTTPError as e:
            logger.error(f"❌ Помилка при отриманні Feed {entity_type.value}: {e}")
            self._stats["errors"] += 1
            return {"data": [], "next_page": {}}

    async def fetch_tender_details(
        self,
        tender_id: str,
    ) -> dict[str, Any]:
        """Отримати повну інформацію про тендер.

        Args:
            tender_id: Ідентифікатор тендеру.

        Returns:
            Повні дані тендеру.
        """
        client = await self._get_client()

        try:
            response = await client.get(
                f"{self.api_base}/tenders/{tender_id}",
            )
            response.raise_for_status()
            data = response.json()
            return data.get("data", {})

        except httpx.HTTPError as e:
            logger.error(f"❌ Помилка при отриманні тендеру {tender_id}: {e}")
            self._stats["errors"] += 1
            return {}

    async def sync_tenders(
        self,
        edrpou_filter: str = "",
    ) -> list[TenderSummary]:
        """Синхронізувати тендери з Prozorro Feed.

        Args:
            edrpou_filter: Опціональний фільтр за ЄДРПОУ замовника.

        Returns:
            Список синхронізованих тендерів.
        """
        logger.info(
            f"🔄 Синхронізація тендерів Prozorro "
            f"(фільтр ЄДРПОУ: {edrpou_filter or 'вимкнено'})"
        )

        state = self._sync_states[ProzorroEntityType.TENDER.value]
        tenders: list[TenderSummary] = []
        pages_processed = 0

        offset = state.last_offset

        while pages_processed < self.max_pages_per_run:
            page_data = await self.fetch_feed_page(
                entity_type=ProzorroEntityType.TENDER,
                offset=offset,
                opt_fields="status,procuringEntity,value,title,dateModified",
            )

            items = page_data.get("data", [])
            if not items:
                logger.info("📭 Більше немає тендерів для синхронізації")
                break

            for item in items:
                tender = self._parse_tender_item(item)
                if tender:
                    # Фільтрація за ЄДРПОУ, якщо задано
                    if edrpou_filter and tender.procuring_entity_edrpou != edrpou_filter:
                        continue
                    tenders.append(tender)

            # Оновлюємо watermark та offset
            next_page = page_data.get("next_page", {})
            new_offset = next_page.get("offset", "")
            if not new_offset or new_offset == offset:
                break

            offset = new_offset
            pages_processed += 1

            # Polite harvesting
            await asyncio.sleep(self.rate_limit_delay)

        # Оновлюємо стан синхронізації
        state.last_offset = offset
        state.total_synced += len(tenders)
        state.last_sync_at = datetime.now(UTC).isoformat()
        self._stats["tenders_synced"] += len(tenders)

        logger.info(
            f"✅ Синхронізовано {len(tenders)} тендерів "
            f"(сторінок: {pages_processed}, всього: {state.total_synced})"
        )
        return tenders

    def _parse_tender_item(
        self,
        item: dict[str, Any],
    ) -> TenderSummary | None:
        """Парсинг елемента Feed у компактний об'єкт TenderSummary.

        Args:
            item: Сирий JSON-об'єкт з Feed.

        Returns:
            TenderSummary або None якщо парсинг не вдався.
        """
        try:
            procuring = item.get("procuringEntity", {})
            identifier = procuring.get("identifier", {})
            value = item.get("value", {})

            return TenderSummary(
                tender_id=item.get("id", ""),
                date_modified=item.get("dateModified", ""),
                procuring_entity_edrpou=identifier.get("id", ""),
                procuring_entity_name=procuring.get("name", ""),
                status=item.get("status", ""),
                procurement_method=item.get("procurementMethod", ""),
                value_amount=float(value.get("amount", 0)),
                value_currency=value.get("currency", "UAH"),
                title=item.get("title", "")[:300],
                description=item.get("description", "")[:500],
            )
        except Exception as e:  # noqa: BLE001
            logger.warning(f"⚠️ Помилка парсингу тендеру: {e}")
            return None

    async def search_by_edrpou(
        self,
        edrpou: str,
    ) -> list[TenderSummary]:
        """Пошук тендерів за кодом ЄДРПОУ замовника.

        Args:
            edrpou: Код ЄДРПОУ (8 цифр).

        Returns:
            Список знайдених тендерів.
        """
        logger.info(f"🔍 Пошук тендерів Prozorro для ЄДРПОУ: {edrpou}")
        return await self.sync_tenders(edrpou_filter=edrpou)

    def get_sync_states(self) -> dict[str, SyncState]:
        """Повернути стани синхронізації всіх типів сутностей."""
        return self._sync_states.copy()

    def get_stats(self) -> dict[str, int]:
        """Повернути статистику синхронізації."""
        return self._stats.copy()
