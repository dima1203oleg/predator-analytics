"""Autonomous Discovery Crawler — PREDATOR Analytics v62.0-ELITE.

Цей сервіс працює у фоновому режимі (як Internet Crawler) і
відповідає за:
1. Пошук нових відкритих реєстрів, API, OpenAPI специфікацій
2. Сканування 30+ глобальних відкритих джерел даних
3. Автоматичне внесення знайдених джерел у Knowledge Graph of Sources
4. 11-факторний AI Priority Score для кожного джерела
"""
import asyncio
import logging
import os
from typing import Any
from urllib.parse import urlparse

import httpx

logger = logging.getLogger("ingestion_worker.discovery_crawler")
CORE_API_URL = os.getenv("CORE_API_URL", "http://localhost:8000/api/v1")

# =========================================================================
# SEED URLS — 30+ глобальних відкритих джерел даних (ТІЛЬКИ відкриті/авторизовані)
# =========================================================================
CKAN_PORTALS: list[str] = [
    "https://data.gov.ua/api/3/action/package_search?q=&rows=100",
    "https://data.europa.eu/api/hub/search/datasets?q=&limit=100",
    "https://catalog.data.gov/api/3/action/package_search?q=&rows=100",
    "https://data.gov.uk/api/3/action/package_search?q=&rows=100",
    "https://open.canada.ca/data/api/3/action/package_search?q=&rows=100",
    "https://data.gov.au/api/3/action/package_search?q=company&rows=100",
    "https://data.overheid.nl/data/api/3/action/package_search?q=&rows=100",
    "https://dane.gov.pl/api/3/action/package_search?q=&rows=100",
]

OPENAPI_CATALOGS: list[str] = [
    "https://api.apis.guru/v2/list.json",
]

INTERNATIONAL_REGISTRIES: list[str] = [
    "https://api.worldbank.org/v2/sources?format=json&per_page=100",
    "https://data.opensanctions.org/datasets/default/index.json",
]

UKRAINE_SPECIFIC: list[str] = [
    "https://public-api.nazk.gov.ua/v2/documents",
    "https://bank.gov.ua/NBU_files/electronic-register/current-dir/index_codes.json",
]

ACADEMIC_AND_OSINT: list[str] = [
    "https://api.crossref.org/types",
    "https://api.openalex.org/works?sample=10&select=id,title,authorships",
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
]

# Об'єднаний каталог усіх джерел з типом
ALL_SOURCES: list[dict[str, str]] = (
    [{"url": u, "type": "ckan"} for u in CKAN_PORTALS]
    + [{"url": u, "type": "openapi_catalog"} for u in OPENAPI_CATALOGS]
    + [{"url": u, "type": "international_registry"} for u in INTERNATIONAL_REGISTRIES]
    + [{"url": u, "type": "ukraine_registry"} for u in UKRAINE_SPECIFIC]
    + [{"url": u, "type": "academic_osint"} for u in ACADEMIC_AND_OSINT]
)


class DiscoveryCrawler:
    """Відповідає за пошук та класифікацію нових джерел даних."""

    def __init__(self, neo4j_sink: Any) -> None:
        self.neo4j_sink = neo4j_sink
        self.task_id: str | None = None
        self.total_datasets = 0
        self.processed_datasets = 0

    async def _create_task(self, name: str) -> None:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                res = await client.post(
                    f"{CORE_API_URL}/adip/tasks",
                    json={"name": name, "agent": "Discovery_Engine", "priority": "MEDIUM"},
                )
                if res.status_code == 200:
                    self.task_id = res.json().get("task_id")
        except Exception as e:
            logger.debug(f"Failed to create task: {e}")

    async def _update_task(self, progress: int, log: str, status: str = "RUNNING") -> None:
        if not self.task_id:
            return
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                await client.patch(
                    f"{CORE_API_URL}/adip/tasks/{self.task_id}",
                    json={"progress": progress, "log": log, "status": status},
                )
        except Exception as e:
            logger.debug(f"Failed to update task: {e}")

    async def start(self) -> None:
        """Запуск основного циклу краулера (нескінченний)."""
        logger.info(
            f"DiscoveryCrawler: Запуск автономного пошуку {len(ALL_SOURCES)} джерел..."
        )
        while True:
            try:
                await self._run_full_discovery_cycle()
                logger.info("DiscoveryCrawler: Цикл завершено. Наступний через 24 год.")
                await asyncio.sleep(86_400)
            except asyncio.CancelledError:
                logger.info("DiscoveryCrawler: Роботу зупинено.")
                break
            except Exception as e:
                logger.error(f"DiscoveryCrawler: Помилка циклу: {e}", exc_info=True)
                await asyncio.sleep(300)

    async def _run_full_discovery_cycle(self) -> None:
        """Один повний цикл Discovery по всіх джерелах."""
        await self._create_task(
            f"Глобальне Discovery сканування ({len(ALL_SOURCES)} джерел)"
        )
        for i, source in enumerate(ALL_SOURCES):
            url = source["url"]
            src_type = source["type"]
            progress = int((i / len(ALL_SOURCES)) * 95)
            await self._update_task(progress, f"Сканування: {url[:80]}...")
            try:
                if src_type == "ckan":
                    await self._scan_ckan_portal(url)
                elif src_type == "openapi_catalog":
                    await self._scan_openapi_catalog(url)
                else:
                    await self._scan_generic_source(url, src_type)
            except Exception as e:
                logger.warning(f"DiscoveryCrawler: Помилка сканування {url}: {e}")
            # Polite crawling: пауза між запитами
            await asyncio.sleep(2.0)

        await self._update_task(100, "Глобальний Discovery цикл завершено.", "COMPLETED")

    # ------------------------------------------------------------------
    # Scanner Methods
    # ------------------------------------------------------------------

    async def _scan_ckan_portal(self, url: str) -> None:
        """Сканування CKAN порталу для виявлення датасетів."""
        logger.info(f"DiscoveryCrawler: CKAN сканування {url}")
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            try:
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"CKAN {url}: HTTP {response.status_code}")
                    return
                data = response.json()
                if not data.get("success"):
                    return
                results = data.get("result", {}).get("results", [])
                logger.info(f"CKAN {url}: знайдено {len(results)} датасетів")
                for pkg in results:
                    await self._register_dataset(pkg, portal_url=url)
            except Exception as e:
                logger.warning(f"CKAN {url}: помилка {e}")

    async def _scan_openapi_catalog(self, url: str) -> None:
        """Сканування APIs.guru або іншого OpenAPI каталогу."""
        logger.info(f"DiscoveryCrawler: OpenAPI каталог {url}")
        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            try:
                response = await client.get(url)
                if response.status_code != 200:
                    return
                data = response.json()
                # apis.guru формат: {"api_name": {"versions": {...}, "preferred": "..."}}
                if isinstance(data, dict):
                    for api_name, api_info in list(data.items())[:50]:
                        preferred = api_info.get("preferred", "")
                        versions = api_info.get("versions", {})
                        version_info = versions.get(preferred, {})
                        info = version_info.get("info", {})
                        pkg = {
                            "id": f"openapi_{api_name.replace(':', '_')}",
                            "title": info.get("title", api_name),
                            "notes": info.get("description", ""),
                            "url": version_info.get("swaggerUrl", ""),
                            "organization": {"title": info.get("x-providerName", "")},
                            "resources": [{"format": "openapi"}],
                            "update_frequency": "monthly",
                            "tags": [{"name": "openapi"}, {"name": "api"}],
                            "source_type": "OPENAPI_CATALOG",
                        }
                        await self._register_dataset(pkg, portal_url=url)
            except Exception as e:
                logger.warning(f"OpenAPI catalog {url}: помилка {e}")

    async def _scan_generic_source(self, url: str, src_type: str) -> None:
        """Сканування загального джерела (реєстр, міжнародна організація тощо)."""
        logger.info(f"DiscoveryCrawler: Загальне сканування [{src_type}] {url}")
        domain = urlparse(url).netloc
        pkg = {
            "id": f"{src_type}_{domain.replace('.', '_')}",
            "title": f"{domain} — {src_type.replace('_', ' ').title()}",
            "notes": f"Автоматично виявлене джерело типу {src_type}",
            "url": url,
            "organization": {"title": domain},
            "resources": [{"format": "json"}],
            "update_frequency": "daily" if "ukraine" in src_type else "monthly",
            "tags": [{"name": src_type}, {"name": "auto_discovered"}],
            "source_type": src_type.upper(),
        }
        await self._register_dataset(pkg, portal_url=url)

    # ------------------------------------------------------------------
    # Registration & Priority Scoring
    # ------------------------------------------------------------------

    async def _register_dataset(self, pkg: dict[str, Any], portal_url: str = "") -> None:
        """Реєстрація знайденого датасету у Meta-Graph (Neo4j)."""
        ds_id = pkg.get("id")
        if not ds_id:
            return

        title = pkg.get("title", "")
        org = (pkg.get("organization") or {}).get("title", "")
        url = pkg.get("url", "")
        notes = pkg.get("notes", "")

        priority_score, score_breakdown = self._calculate_priority_score(pkg)

        node = {
            "label": "DataSource",
            "id": ds_id,
            "props": {
                "id": ds_id,
                "name": title,
                "description": (notes[:500] if notes else ""),
                "url": url,
                "portal_url": portal_url,
                "organization": org,
                "source_type": pkg.get("source_type", "CKAN_DATASET"),
                "status": "DISCOVERED",
                "priority_score": priority_score,
                "score_business_value": score_breakdown.get("business_value", 0.0),
                "score_intelligence_value": score_breakdown.get("intelligence_value", 0.0),
                "score_freshness": score_breakdown.get("freshness", 0.0),
                "score_reliability": score_breakdown.get("reliability", 0.0),
                "score_uniqueness": score_breakdown.get("uniqueness", 0.0),
            },
        }

        if self.neo4j_sink:
            try:
                await self.neo4j_sink.merge_bulk_nodes("DataSource", [node])
                logger.debug(f"DiscoveryCrawler: Зареєстровано: {title[:60]}")
            except Exception as e:
                logger.warning(f"DiscoveryCrawler: Помилка запису Neo4j: {e}")

        self.processed_datasets += 1

    def _calculate_priority_score(
        self, pkg: dict[str, Any]
    ) -> tuple[float, dict[str, float]]:
        """
        11-факторний AI Priority Score (0.0 – 1.0).

        Фактори згідно ТЗ:
          1.  business_value       — компанії, фінанси, тендери
          2.  intelligence_value   — PEP, санкції, суди
          3.  risk_value           — кібер-загрози, витоки
          4.  uniqueness           — унікальність даних
          5.  coverage             — географічне / секторне покриття
          6.  freshness            — актуальність даних
          7.  update_frequency     — частота оновлень
          8.  reliability          — стабільність джерела
          9.  availability         — відкритість (без реєстрації)
         10.  expected_maintenance — очікуваний рівень підтримки
         11.  complexity           — складність інтеграції (inverse)
        """
        breakdown: dict[str, float] = {}
        tags = [t.get("name", "").lower() for t in pkg.get("tags", [])]
        formats = [r.get("format", "").lower() for r in pkg.get("resources", [])]
        text = (
            (pkg.get("title") or "").lower()
            + " "
            + (pkg.get("notes") or "").lower()
        )

        # 1. Business Value
        bv = 0.3
        if any(kw in text for kw in ["company", "compan", "tender", "procurement", "spend", "budget", "financ"]):
            bv = 0.8
        elif any(kw in text for kw in ["edr", "єдр", "register", "registry", "реєстр"]):
            bv = 0.7
        breakdown["business_value"] = bv

        # 2. Intelligence Value
        iv = 0.2
        if any(kw in text for kw in ["sanction", "pep", "court", "declar", "benefici", "owner"]):
            iv = 0.9
        elif any(t in tags for t in ["pep", "sanctions", "courts", "nazk", "nabu"]):
            iv = 0.85
        breakdown["intelligence_value"] = iv

        # 3. Risk Value
        rv = 0.1
        if any(kw in text for kw in ["vulnerab", "exploit", "threat", "cve", "malware", "cybersec"]):
            rv = 0.8
        elif any(kw in text for kw in ["fraud", "corrupt", "money laund"]):
            rv = 0.6
        breakdown["risk_value"] = rv

        # 4. Uniqueness
        uq = 0.5
        unique_tags = {"nabu", "nazk", "cisa", "gdelt", "opensanctions", "icij"}
        if any(t in tags for t in unique_tags):
            uq = 0.9
        breakdown["uniqueness"] = uq

        # 5. Coverage
        cov = 0.4
        if any(kw in text for kw in ["national", "all ", "complet", "universal", "всі ", "весь"]):
            cov = 0.7
        breakdown["coverage"] = cov

        # 6. Freshness
        freq = pkg.get("update_frequency", "")
        freshness_map = {"realtime": 1.0, "hourly": 0.95, "daily": 0.85, "weekly": 0.6, "monthly": 0.4}
        freshness = freshness_map.get(freq, 0.3)
        breakdown["freshness"] = freshness

        # 7. Update Frequency signal
        breakdown["update_frequency"] = 0.4 if freq else 0.2

        # 8. Reliability
        rel = 0.5
        reliable_domains = [
            "gov.ua", "gov.us", ".gov", "europa.eu",
            "worldbank.org", "un.org", "imf.org", "oecd.org",
        ]
        src_url = (pkg.get("url") or "").lower()
        if any(d in src_url for d in reliable_domains):
            rel = 0.9
        breakdown["reliability"] = rel

        # 9. Availability
        av = 0.3
        if any(f in formats for f in ["api", "json", "openapi", "csv"]):
            av = 0.9
        elif any(f in formats for f in ["xml", "ods", "xlsx"]):
            av = 0.6
        breakdown["availability"] = av

        # 10. Expected Maintenance (higher = less work)
        mc = 0.7
        if "api" in formats or "openapi" in formats:
            mc = 0.9
        elif not formats or "html" in formats:
            mc = 0.3
        breakdown["expected_maintenance"] = mc

        # 11. Complexity (higher = simpler)
        cx = 0.6
        if "json" in formats or "api" in formats:
            cx = 0.8
        elif "csv" in formats:
            cx = 0.7
        elif not formats:
            cx = 0.3
        breakdown["complexity"] = cx

        # Зважена сума
        weights = {
            "business_value": 0.18,
            "intelligence_value": 0.18,
            "risk_value": 0.08,
            "uniqueness": 0.12,
            "coverage": 0.07,
            "freshness": 0.10,
            "update_frequency": 0.05,
            "reliability": 0.10,
            "availability": 0.05,
            "expected_maintenance": 0.04,
            "complexity": 0.03,
        }
        total = sum(breakdown.get(k, 0.0) * w for k, w in weights.items())
        return round(min(total, 1.0), 4), breakdown
