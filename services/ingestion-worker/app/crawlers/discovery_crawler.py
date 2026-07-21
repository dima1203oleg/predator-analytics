"""Autonomous Discovery Crawler.

Цей сервіс працює у фоновому режимі (як Internet Crawler) і 
відповідає за пошук нових відкритих реєстрів, API, OpenAPI специфікацій,
та автоматичне внесення їх у Knowledge Graph of Sources.
"""
import asyncio
import logging
from typing import Any, Dict, List
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("ingestion_worker.discovery_crawler")

# Список базових точок входу для пошуку відкритих даних (CKAN, OpenAPI)
SEED_URLS = [
    "https://data.gov.ua/api/3/action/package_search?q=",  # Портал відкритих даних України (CKAN)
    # Інші Seed URL можуть бути додані динамічно
]


class DiscoveryCrawler:
    """Відповідає за пошук та класифікацію нових джерел даних."""
    
    def __init__(self, neo4j_sink: Any) -> None:
        self.neo4j_sink = neo4j_sink
        
    async def start(self) -> None:
        """Запуск основного циклу краулера."""
        logger.info("DiscoveryCrawler: Запуск автономного пошуку джерел...")
        
        while True:
            try:
                for seed in SEED_URLS:
                    if "ckan" in seed or "action/package_search" in seed:
                        await self._scan_ckan_portal(seed)
                
                # Засинаємо на 24 години перед наступним глобальним скануванням
                await asyncio.sleep(86400)
            except asyncio.CancelledError:
                logger.info("DiscoveryCrawler: Роботу зупинено.")
                break
            except Exception as e:
                logger.error(f"DiscoveryCrawler: Помилка сканування: {e}", exc_info=True)
                await asyncio.sleep(300)

    async def _scan_ckan_portal(self, url: str) -> None:
        """Сканування CKAN порталу для виявлення датасетів."""
        logger.info(f"DiscoveryCrawler: Сканування CKAN порталу {url}")
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            if response.status_code != 200:
                logger.warning(f"CKAN Portal {url} повернув статус {response.status_code}")
                return
                
            data = response.json()
            if not data.get("success"):
                return
                
            results = data.get("result", {}).get("results", [])
            for pkg in results:
                await self._register_dataset(pkg)
                
    async def _register_dataset(self, pkg: Dict[str, Any]) -> None:
        """Реєстрація знайденого датасету у Meta-Graph."""
        ds_id = pkg.get("id")
        if not ds_id:
            return
            
        title = pkg.get("title")
        org = pkg.get("organization", {}).get("title")
        url = pkg.get("url")
        notes = pkg.get("notes")
        
        # Створюємо вузол DataSource
        node = {
            "label": "DataSource",
            "id": ds_id,
            "props": {
                "id": ds_id,
                "name": title,
                "description": notes,
                "url": url,
                "organization": org,
                "source_type": "CKAN_DATASET",
                "status": "DISCOVERED",
                "priority_score": self._calculate_priority(pkg)
            }
        }
        
        if self.neo4j_sink:
            # Для спрощення викликаємо merge_bulk_nodes з 1 елементом
            await self.neo4j_sink.merge_bulk_nodes("DataSource", [node])
            logger.debug(f"DiscoveryCrawler: Зареєстровано нове джерело: {title}")

    def _calculate_priority(self, pkg: Dict[str, Any]) -> float:
        """Евристичний розрахунок пріоритету інтеграції (0.0 - 1.0)."""
        score = 0.5
        
        # Якщо джерело оновлюється щодня, це плюс
        if pkg.get("update_frequency") in ["daily", "realtime", "hourly"]:
            score += 0.2
            
        # Якщо є CSV або JSON/API, це плюс
        formats = [res.get("format", "").lower() for res in pkg.get("resources", [])]
        if "api" in formats or "json" in formats:
            score += 0.2
        elif "csv" in formats:
            score += 0.1
            
        return min(score, 1.0)
