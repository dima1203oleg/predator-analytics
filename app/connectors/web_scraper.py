from __future__ import annotations

"""Web Scraper Connector - Парсинг веб-сайтів та OSINT джерел
Використовує httpx + BeautifulSoup для статичного контенту
Використовує Playwright для динамічних сторінок (JS-rendered).
"""
import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
import hashlib
import logging
import os
import re
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
import httpx

from .base import BaseConnector, ConnectorResult, ConnectorStatus

logger = logging.getLogger(__name__)

# Спробуємо імпортувати Playwright
try:
    from playwright.async_api import async_playwright

    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False
    logger.warning("Playwright не встановлено. Динамічний scraping буде недоступний.")


@dataclass
class ScrapedPage:
    """Структура скрапленої сторінки."""

    url: str
    title: str
    content: str
    text_content: str
    meta_description: str | None
    meta_keywords: str | None
    links: list[str]
    images: list[str]
    scraped_at: datetime
    content_hash: str
    word_count: int


@dataclass
class RSSFeedItem:
    """Елемент RSS/Atom фіду."""

    title: str
    link: str
    description: str
    pub_date: datetime | None
    author: str | None
    categories: list[str]


class WebScraperConnector(BaseConnector):
    """Connector для парсингу веб-сайтів та OSINT джерел.

    Підтримує:
    - Статичні HTML сторінки (httpx + BeautifulSoup)
    - Динамічні JS-rendered сторінки (Playwright)
    - RSS/Atom фіди
    - Новинні сайти з структурованим контентом
    - Публічні реєстри України

    Конфігурація:
    - WEB_SCRAPER_USER_AGENT: User-Agent для запитів
    - WEB_SCRAPER_TIMEOUT: Таймаут в секундах
    - WEB_SCRAPER_RATE_LIMIT: Затримка між запитами (мс)
    """

    def __init__(self):
        super().__init__(
            name="Web Scraper",
            base_url="",  # Динамічний
            timeout=float(os.getenv("WEB_SCRAPER_TIMEOUT", "30")),
        )

        self.user_agent = os.getenv(
            "WEB_SCRAPER_USER_AGENT", "Predator-Analytics-Bot/1.0 (+https://predator.ai/bot)"
        )
        self.rate_limit_ms = int(os.getenv("WEB_SCRAPER_RATE_LIMIT", "500"))

        # Чорний список доменів (не скрапимо)
        self.blocked_domains = [
            "facebook.com",
            "twitter.com",
            "instagram.com",  # Соцмережі
            "google.com",
            "bing.com",  # Пошукові системи
        ]

        # Кеш скрапленого контенту
        self._content_cache: dict[str, ScrapedPage] = {}
        self._last_request_time: datetime = datetime.min

    async def _wait_rate_limit(self):
        """Дотримання rate limit."""
        now = datetime.now()
        elapsed = (now - self._last_request_time).total_seconds() * 1000
        if elapsed < self.rate_limit_ms:
            await asyncio.sleep((self.rate_limit_ms - elapsed) / 1000)
        self._last_request_time = datetime.now()

    def _is_allowed(self, url: str) -> bool:
        """Перевірка чи дозволено скрапити URL."""
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        return not any(blocked in domain for blocked in self.blocked_domains)

    def _clean_text(self, text: str) -> str:
        """Очищення тексту від зайвих пробілів."""
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    def _compute_hash(self, content: str) -> str:
        """Обчислення хешу контенту для дедуплікації."""
        return hashlib.md5(content.encode("utf-8")).hexdigest()

    async def search(self, query: str, limit: int = 10, **kwargs) -> ConnectorResult:
        """Пошук по URL або скрапінг сторінки.

        Args:
            query: URL для скрапінгу або пошуковий запит
            limit: Максимальна кількість сторінок для обробки

        Kwargs:
            use_playwright: Використовувати Playwright для JS (default: False)
            follow_links: Слідувати за внутрішніми посиланнями (default: False)
            max_depth: Максимальна глибина обходу (default: 1)

        """
        use_playwright = kwargs.get("use_playwright", False)
        follow_links = kwargs.get("follow_links", False)
        max_depth = kwargs.get("max_depth", 1)

        # Перевіряємо чи query є URL
        if not query.startswith(("http://", "https://")):
            return ConnectorResult(
                success=False,
                data=None,
                error="Запит має бути валідним URL (http:// або https://)",
                source=self.name,
            )

        if not self._is_allowed(query):
            return ConnectorResult(
                success=False,
                data=None,
                error="Скрапінг цього домену заблоковано політикою",
                source=self.name,
            )

        try:
            pages = []
            visited = set()
            to_visit = [(query, 0)]  # (url, depth)

            while to_visit and len(pages) < limit:
                url, depth = to_visit.pop(0)

                if url in visited or depth > max_depth:
                    continue

                visited.add(url)

                # Скрапимо сторінку
                if use_playwright and PLAYWRIGHT_AVAILABLE:
                    page_result = await self._scrape_with_playwright(url)
                else:
                    page_result = await self._scrape_with_httpx(url)

                if page_result:
                    pages.append(page_result.__dict__)

                    # Додаємо внутрішні посилання
                    if follow_links and depth < max_depth:
                        base_domain = urlparse(url).netloc
                        for link in page_result.links:
                            link_domain = urlparse(link).netloc
                            if link_domain == base_domain and link not in visited:
                                to_visit.append((link, depth + 1))

                await self._wait_rate_limit()

            logger.info(f"Скраплено {len(pages)} сторінок з {query}")

            return ConnectorResult(
                success=True, data=pages, source=self.name, records_count=len(pages)
            )

        except Exception as e:
            logger.exception(f"Помилка скрапінгу {query}: {e}")
            return ConnectorResult(success=False, data=None, error=str(e), source=self.name)

    async def _scrape_with_httpx(self, url: str) -> ScrapedPage | None:
        """Скрапінг статичної сторінки через httpx."""
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    url,
                    headers={
                        "User-Agent": self.user_agent,
                        "Accept": "text/html,application/xhtml+xml",
                        "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
                    },
                    follow_redirects=True,
                )
                response.raise_for_status()

                return self._parse_html(url, response.text)

        except Exception as e:
            logger.warning(f"Помилка httpx скрапінгу {url}: {e}")
            return None

    async def _scrape_with_playwright(self, url: str) -> ScrapedPage | None:
        """Скрапінг динамічної сторінки через Playwright."""
        if not PLAYWRIGHT_AVAILABLE:
            logger.warning("Playwright недоступний, використовуємо httpx")
            return await self._scrape_with_httpx(url)

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(user_agent=self.user_agent, locale="uk-UA")
                page = await context.new_page()

                await page.goto(url, wait_until="networkidle", timeout=int(self.timeout * 1000))

                # Чекаємо рендеринг JS
                await page.wait_for_timeout(2000)

                html_content = await page.content()

                await browser.close()

                return self._parse_html(url, html_content)

        except Exception as e:
            logger.warning(f"Помилка Playwright скрапінгу {url}: {e}")
            return None

    def _parse_html(self, url: str, html: str) -> ScrapedPage:
        """Парсинг HTML та екстракція структурованих даних."""
        soup = BeautifulSoup(html, "html.parser")

        # Видаляємо скрипти та стилі
        for script in soup(["script", "style", "noscript"]):
            script.decompose()

        # Заголовок
        title_tag = soup.find("title")
        title = title_tag.get_text().strip() if title_tag else ""

        # Мета-теги
        meta_desc = soup.find("meta", attrs={"name": "description"})
        meta_description = meta_desc.get("content", "") if meta_desc else None

        meta_kw = soup.find("meta", attrs={"name": "keywords"})
        meta_keywords = meta_kw.get("content", "") if meta_kw else None

        # Основний текстовий контент
        # Пріоритет: article > main > body
        main_content = (
            soup.find("article")
            or soup.find("main")
            or soup.find("div", class_=re.compile(r"content|article|post|entry"))
            or soup.body
        )

        text_content = self._clean_text(main_content.get_text()) if main_content else ""

        # Посилання
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href.startswith("/"):
                href = urljoin(url, href)
            if href.startswith("http"):
                links.append(href)

        # Зображення
        images = []
        for img in soup.find_all("img", src=True):
            src = img["src"]
            if src.startswith("/"):
                src = urljoin(url, src)
            if src.startswith("http"):
                images.append(src)

        return ScrapedPage(
            url=url,
            title=title,
            content=str(soup),
            text_content=text_content,
            meta_description=meta_description,
            meta_keywords=meta_keywords,
            links=list(set(links))[:50],  # Обмежуємо кількість
            images=list(set(images))[:20],
            scraped_at=datetime.now(UTC),
            content_hash=self._compute_hash(text_content),
            word_count=len(text_content.split()),
        )

    async def get_by_id(self, url: str) -> ConnectorResult:
        """Отримати конкретну сторінку за URL."""
        return await self.search(url, limit=1)

    async def scrape_rss_feed(self, feed_url: str) -> ConnectorResult:
        """Парсинг RSS/Atom фіду.

        Args:
            feed_url: URL RSS/Atom фіду

        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    feed_url, headers={"User-Agent": self.user_agent}, follow_redirects=True
                )
                response.raise_for_status()

                soup = BeautifulSoup(response.text, "xml")

                items = []

                # RSS формат
                for item in soup.find_all("item"):
                    title = item.find("title")
                    link = item.find("link")
                    description = item.find("description")
                    item.find("pubDate")
                    author = item.find("author") or item.find("dc:creator")
                    categories = [cat.get_text() for cat in item.find_all("category")]

                    items.append(
                        RSSFeedItem(
                            title=title.get_text().strip() if title else "",
                            link=link.get_text().strip() if link else "",
                            description=self._clean_text(description.get_text())
                            if description
                            else "",
                            pub_date=None,  # TODO: Parse date
                            author=author.get_text().strip() if author else None,
                            categories=categories,
                        ).__dict__
                    )

                # Atom формат
                for entry in soup.find_all("entry"):
                    title = entry.find("title")
                    link = entry.find("link")
                    summary = entry.find("summary") or entry.find("content")
                    entry.find("published") or entry.find("updated")
                    author_tag = entry.find("author")
                    author = author_tag.find("name") if author_tag else None

                    items.append(
                        RSSFeedItem(
                            title=title.get_text().strip() if title else "",
                            link=link.get("href", "") if link else "",
                            description=self._clean_text(summary.get_text()) if summary else "",
                            pub_date=None,
                            author=author.get_text().strip() if author else None,
                            categories=[],
                        ).__dict__
                    )

                logger.info(f"Отримано {len(items)} записів з RSS {feed_url}")

                return ConnectorResult(
                    success=True, data=items, source=self.name, records_count=len(items)
                )

        except Exception as e:
            logger.exception(f"Помилка парсингу RSS {feed_url}: {e}")
            return ConnectorResult(success=False, data=None, error=str(e), source=self.name)

    async def scrape_gov_ua_dataset(self, dataset_id: str) -> ConnectorResult:
        """Парсинг датасету з data.gov.ua.

        Args:
            dataset_id: ID датасету на data.gov.ua

        """
        api_url = f"https://data.gov.ua/api/3/action/package_show?id={dataset_id}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(api_url)
                response.raise_for_status()

                data = response.json()

                if data.get("success"):
                    result = data.get("result", {})

                    # Екстрактуємо ресурси (файли для завантаження)
                    resources = []
                    for res in result.get("resources", []):
                        resources.append(
                            {
                                "id": res.get("id"),
                                "name": res.get("name"),
                                "format": res.get("format"),
                                "url": res.get("url"),
                                "size": res.get("size"),
                                "last_modified": res.get("last_modified"),
                            }
                        )

                    dataset_info = {
                        "id": result.get("id"),
                        "title": result.get("title"),
                        "notes": result.get("notes"),
                        "organization": result.get("organization", {}).get("title"),
                        "tags": [t.get("name") for t in result.get("tags", [])],
                        "resources": resources,
                        "metadata_created": result.get("metadata_created"),
                        "metadata_modified": result.get("metadata_modified"),
                    }

                    return ConnectorResult(
                        success=True, data=dataset_info, source=self.name, records_count=1
                    )
                return ConnectorResult(
                    success=False, data=None, error="Датасет не знайдено", source=self.name
                )

        except Exception as e:
            logger.exception(f"Помилка отримання датасету {dataset_id}: {e}")
            return ConnectorResult(success=False, data=None, error=str(e), source=self.name)

    async def health_check(self) -> ConnectorStatus:
        """Перевірка стану connector'а."""
        try:
            # Перевіряємо базову HTTP функціональність
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("https://www.google.com")
                if response.status_code < 500:
                    self._status = ConnectorStatus.HEALTHY
                else:
                    self._status = ConnectorStatus.DEGRADED
        except Exception:
            self._status = ConnectorStatus.OFFLINE

        self._last_check = datetime.now(UTC)
        return self._status


# Singleton екземпляр
web_scraper_connector = WebScraperConnector()
