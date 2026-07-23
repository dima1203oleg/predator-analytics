"""[DEPRECATED] CKAN Harvester — Збирач даних з Національного порталу відкритих даних data.gov.ua.

Використовує стандартний CKAN API v3 для:
- Індексації розпорядників інформації
- Завантаження CSV/JSON наборів у локальне сховище (MinIO)
- Синхронізації метаданих із PostgreSQL
- Пріоритетні набори: ДПС (податковий борг, ПДВ), Мінінфраструктури

Ліцензія даних: Creative Commons — легальне комерційне використання.


Цей модуль застарів. Всі нові інтеграції генеруються через AI Factory.
"""

import asyncio
from datetime import UTC, datetime
from typing import Any

import httpx
from pydantic import BaseModel

from predator_common.logging import get_logger

logger = get_logger("ingestion.harvesters.ckan")
logger.warning("[DEPRECATED] Цей ручний гарвестер застарів згідно з Legacy Rule. Використовуйте Autonomous AI Factory.")


# Базовий ендпоінт CKAN API порталу data.gov.ua
CKAN_BASE_URL = "https://data.gov.ua/api/3/action"

# Пріоритетні організації (розпорядники) для збору
PRIORITY_ORGANIZATIONS = [
    "tax-gov-ua",          # Державна податкова служба
    "mtu-gov-ua",          # Мінінфраструктури
    "customs-gov-ua",      # Державна митна служба
    "minfin-gov-ua",       # Мінфін
    "nssmc-gov-ua",        # НКЦПФР
    "bank-gov-ua",         # НБУ
]

# Пріоритетні теги для збору
PRIORITY_TAGS = [
    "податковий борг",
    "ПДВ",
    "публічні закупівлі",
    "реєстр підприємств",
    "транспорт",
    "митна статистика",
]


class DatasetMetadata(BaseModel):
    """Метадані набору даних із CKAN."""

    dataset_id: str
    title: str
    organization: str
    description: str = ""
    format_type: str = "unknown"
    num_resources: int = 0
    last_modified: str = ""
    tags: list[str] = []
    download_urls: list[str] = []


class HarvestResult(BaseModel):
    """Результат збору одного набору."""

    dataset_id: str
    status: str  # "success" | "skipped" | "error"
    records_count: int = 0
    file_size_bytes: int = 0
    error_message: str = ""


class CKANHarvester:
    """Краулер для Національного порталу відкритих даних data.gov.ua.

    Реалізує "ввічливий парсинг" (polite harvesting) з rate limiting,
    щоб не перевантажувати державні сервери.
    """

    def __init__(
        self,
        base_url: str = CKAN_BASE_URL,
        rate_limit_delay: float = 1.0,
        max_datasets_per_run: int = 100,
    ) -> None:
        """Ініціалізація краулера.

        Args:
            base_url: Базовий URL CKAN API.
            rate_limit_delay: Затримка між запитами (секунди).
            max_datasets_per_run: Максимум наборів за один запуск.
        """
        self.base_url = base_url
        self.rate_limit_delay = rate_limit_delay
        self.max_datasets_per_run = max_datasets_per_run
        self._client: httpx.AsyncClient | None = None
        self._harvest_stats: dict[str, int] = {
            "total_indexed": 0,
            "total_downloaded": 0,
            "total_errors": 0,
        }

    async def _get_client(self) -> httpx.AsyncClient:
        """Отримати або створити HTTP-клієнт із таймаутами."""
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                timeout=httpx.Timeout(30.0, connect=10.0),
                headers={
                    "User-Agent": "PREDATOR-Analytics/57.0 (Open Data Harvester)",
                    "Accept": "application/json",
                },
                follow_redirects=True,
            )
        return self._client

    async def close(self) -> None:
        """Закрити HTTP-клієнт."""
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def search_datasets(
        self,
        query: str = "",
        organization: str = "",
        tags: list[str] | None = None,
        rows: int = 50,
        start: int = 0,
    ) -> list[DatasetMetadata]:
        """Пошук наборів даних через CKAN API.

        Args:
            query: Текстовий пошуковий запит.
            organization: Фільтр за організацією.
            tags: Фільтр за тегами.
            rows: Кількість результатів на сторінку.
            start: Зсув для пагінації.

        Returns:
            Список метаданих знайдених наборів.
        """
        client = await self._get_client()

        # Формуємо параметри запиту
        fq_parts: list[str] = []
        if organization:
            fq_parts.append(f"organization:{organization}")
        if tags:
            for tag in tags:
                fq_parts.append(f'tags:"{tag}"')

        params: dict[str, Any] = {
            "rows": min(rows, 1000),
            "start": start,
        }
        if query:
            params["q"] = query
        if fq_parts:
            params["fq"] = " AND ".join(fq_parts)

        try:
            response = await client.get(
                f"{self.base_url}/package_search",
                params=params,
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("success"):
                logger.warning(f"CKAN API повернув помилку: {data.get('error', {})}")
                return []

            results = data.get("result", {}).get("results", [])
            datasets: list[DatasetMetadata] = []

            for pkg in results:
                resources = pkg.get("resources", [])
                download_urls = [
                    r["url"]
                    for r in resources
                    if r.get("url") and r.get("format", "").upper() in ("CSV", "JSON", "XLSX", "XML")
                ]

                datasets.append(DatasetMetadata(
                    dataset_id=pkg["id"],
                    title=pkg.get("title", "Без назви"),
                    organization=pkg.get("organization", {}).get("name", "unknown"),
                    description=pkg.get("notes", "")[:500],
                    format_type=resources[0].get("format", "unknown") if resources else "unknown",
                    num_resources=len(resources),
                    last_modified=pkg.get("metadata_modified", ""),
                    tags=[t["name"] for t in pkg.get("tags", [])],
                    download_urls=download_urls,
                ))

            logger.info(
                f"🔍 CKAN пошук: знайдено {len(datasets)} наборів "
                f"(запит: '{query}', орг: '{organization}')"
            )
            return datasets

        except httpx.HTTPError as e:
            logger.error(f"❌ Помилка HTTP при пошуку CKAN: {e}")
            return []

    async def harvest_organization(
        self,
        organization: str,
    ) -> list[HarvestResult]:
        """Зібрати всі набори даних від конкретної організації.

        Args:
            organization: Ідентифікатор організації в CKAN.

        Returns:
            Список результатів збору.
        """
        logger.info(f"🌾 Початок збору даних від організації: {organization}")

        datasets = await self.search_datasets(
            organization=organization,
            rows=self.max_datasets_per_run,
        )

        results: list[HarvestResult] = []
        for dataset in datasets:
            result = await self._harvest_single_dataset(dataset)
            results.append(result)

            # Polite harvesting — затримка між запитами
            await asyncio.sleep(self.rate_limit_delay)

        successful = sum(1 for r in results if r.status == "success")
        logger.info(
            f"✅ Збір завершено для {organization}: "
            f"{successful}/{len(results)} наборів успішно оброблено"
        )
        return results

    async def _harvest_single_dataset(
        self,
        metadata: DatasetMetadata,
    ) -> HarvestResult:
        """Завантажити один набір даних.

        Args:
            metadata: Метадані набору.

        Returns:
            Результат збору.
        """
        if not metadata.download_urls:
            return HarvestResult(
                dataset_id=metadata.dataset_id,
                status="skipped",
                error_message="Немає доступних URL для завантаження",
            )

        client = await self._get_client()

        try:
            # Завантажуємо перший доступний ресурс
            url = metadata.download_urls[0]
            response = await client.get(url)
            response.raise_for_status()

            content = response.content
            self._harvest_stats["total_downloaded"] += 1

            # TODO: Зберегти у MinIO та індексувати в PostgreSQL
            logger.info(
                f"📥 Завантажено: {metadata.title[:60]} "
                f"({len(content)} байт, формат: {metadata.format_type})"
            )

            return HarvestResult(
                dataset_id=metadata.dataset_id,
                status="success",
                records_count=1,
                file_size_bytes=len(content),
            )

        except httpx.HTTPError as e:
            self._harvest_stats["total_errors"] += 1
            return HarvestResult(
                dataset_id=metadata.dataset_id,
                status="error",
                error_message=str(e)[:200],
            )

    async def run_priority_harvest(self) -> dict[str, Any]:
        """Запустити збір даних від пріоритетних організацій.

        Returns:
            Зведена статистика збору.
        """
        logger.info("🚀 Запуск пріоритетного збору відкритих даних data.gov.ua")
        start_time = datetime.now(UTC)

        all_results: dict[str, list[HarvestResult]] = {}

        for org in PRIORITY_ORGANIZATIONS:
            results = await self.harvest_organization(org)
            all_results[org] = results
            # Додаткова затримка між організаціями
            await asyncio.sleep(self.rate_limit_delay * 2)

        elapsed = (datetime.now(UTC) - start_time).total_seconds()

        summary = {
            "started_at": start_time.isoformat(),
            "duration_seconds": round(elapsed, 2),
            "organizations_processed": len(all_results),
            "total_datasets": sum(len(r) for r in all_results.values()),
            "successful": sum(
                sum(1 for r in results if r.status == "success")
                for results in all_results.values()
            ),
            "errors": sum(
                sum(1 for r in results if r.status == "error")
                for results in all_results.values()
            ),
            "stats": self._harvest_stats,
        }

        logger.info(f"📊 Збір завершено: {summary}")
        return summary

    def get_stats(self) -> dict[str, int]:
        """Повернути поточну статистику збору."""
        return self._harvest_stats.copy()
