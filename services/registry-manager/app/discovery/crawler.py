"""
Crawler Engine — PREDATOR Analytics
Автономний сканер відкритих джерел (CKAN, OpenAPI, Directory listings).
"""
import asyncio
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

class InternetCrawler:
    """Асинхронний HTTP-клієнт з backoff та proxy support."""
    def __init__(self, max_concurrent: int = 10):
        self.semaphore = asyncio.Semaphore(max_concurrent)
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        # Реальний proxy/user-agent logic можна додати сюди
        self.headers = {"User-Agent": "PredatorDiscoveryBot/1.0 (Research)"}

    async def fetch_json(self, url: str) -> Optional[Dict[str, Any]]:
        async with self.semaphore:
            try:
                response = await self.client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.json()
            except Exception as e:
                logger.warning(f"Failed to fetch JSON from {url}: {e}")
                return None

    async def fetch_html(self, url: str) -> Optional[str]:
        async with self.semaphore:
            try:
                response = await self.client.get(url, headers=self.headers)
                response.raise_for_status()
                return response.text
            except Exception as e:
                logger.warning(f"Failed to fetch HTML from {url}: {e}")
                return None

    async def close(self):
        await self.client.aclose()


class ContentAnalyzer:
    """Аналізатор вмісту для виявлення формату даних."""
    @staticmethod
    def detect_format(content: str, url: str) -> str:
        if url.endswith(".json") or url.endswith("swagger.json"):
            return "openapi" if "openapi" in content or "swagger" in content else "json"
        if url.endswith(".xml") or "<?xml" in content:
            return "xml"
        if url.endswith(".csv"):
            return "csv"
        return "unknown"


class DirectoryScanner:
    """Сканер каталогів (наприклад, CKAN, data.gov.*)."""
    def __init__(self, crawler: InternetCrawler):
        self.crawler = crawler

    async def scan_ckan(self, base_url: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Сканує CKAN портали (наприклад, data.gov.ua)."""
        logger.info(f"Scanning CKAN portal: {base_url}")
        package_list_url = f"{base_url}/api/3/action/package_list"
        packages = await self.crawler.fetch_json(package_list_url)
        
        if not packages or not packages.get("success"):
            logger.warning(f"CKAN scan failed for {base_url}")
            return

        dataset_ids = packages.get("result", [])
        logger.info(f"Found {len(dataset_ids)} datasets at {base_url}. Extracting metadata...")

        # Завантажуємо метадані партіями
        for i in range(0, min(len(dataset_ids), 100), 10): # Ліміт 100 для демо
            batch = dataset_ids[i:i+10]
            tasks = []
            for dataset_id in batch:
                pkg_url = f"{base_url}/api/3/action/package_show?id={dataset_id}"
                tasks.append(self.crawler.fetch_json(pkg_url))
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in results:
                if isinstance(res, dict) and res.get("success"):
                    dataset = res.get("result", {})
                    yield {
                        "source_type": "ckan_dataset",
                        "id": dataset.get("id"),
                        "name": dataset.get("name"),
                        "title": dataset.get("title"),
                        "url": f"{base_url}/dataset/{dataset.get('name')}",
                        "resources": dataset.get("resources", []),
                        "organization": dataset.get("organization", {}).get("title"),
                        "metadata_modified": dataset.get("metadata_modified")
                    }

    async def scan_apis_guru(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Сканує APIs.guru для пошуку OpenAPI специфікацій."""
        url = "https://api.apis.guru/v2/list.json"
        logger.info(f"Scanning APIs.guru: {url}")
        data = await self.crawler.fetch_json(url)
        if not data:
            return
            
        for api_name, api_versions in list(data.items())[:50]: # Ліміт 50 для демо
            for version, details in api_versions.get("versions", {}).items():
                yield {
                    "source_type": "openapi",
                    "id": f"{api_name}_{version}",
                    "name": api_name,
                    "title": details.get("info", {}).get("title"),
                    "url": details.get("swaggerUrl"),
                    "version": version,
                    "added": details.get("added")
                }

    async def scan_osint_sources(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Сканує OSINT джерела (OpenSanctions, NAZK, CISA KEV тощо)."""
        logger.info("Scanning OSINT Sources: OpenSanctions index")
        url = "https://data.opensanctions.org/datasets/latest/index.json"
        
        data = await self.crawler.fetch_json(url)
        if not data:
            logger.warning("Failed to fetch OpenSanctions index.")
            return
            
        datasets = data.get("datasets", [])
        logger.info(f"Found {len(datasets)} OpenSanctions datasets. Filtering core lists...")
        
        # Для тестової мети фільтруємо лише ключові або перші 5
        key_lists = ["ofac", "eu_fsf", "un_sc_sanctions", "ua_nabc_sanctions"]
        
        for dataset in datasets:
            if dataset.get("name") in key_lists or "sanctions" in dataset.get("type", ""):
                yield {
                    "source_type": "osint_dataset",
                    "id": dataset.get("name"),
                    "name": dataset.get("name"),
                    "title": dataset.get("title"),
                    "url": dataset.get("index_url"),
                    "publisher": dataset.get("publisher", {}).get("name"),
                    "last_updated": dataset.get("last_change")
                }
                
        # Можна також додати CISA KEV:
        yield {
            "source_type": "osint_dataset",
            "id": "cisa_kev",
            "name": "CISA Known Exploited Vulnerabilities",
            "title": "CISA KEV Catalog",
            "url": "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
            "publisher": "CISA",
        }
