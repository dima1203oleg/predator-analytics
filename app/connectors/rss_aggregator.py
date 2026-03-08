from __future__ import annotations


"""RSS Aggregator (COMP-028)

Агрегатор RSS-стрічок українських бізнес-джерел.
Збирає новини з:
- Економічна правда (epravda.com.ua)
- РБК-Україна (rbc.ua)
- Forbes Україна (forbes.ua)
- Ліга.net (liga.net)
- Finance.ua (finance.ua)
- Мінфін (minfin.com.ua)
- НБУ (bank.gov.ua)
"""
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.connectors.base import BaseConnector, ConnectorResult


logger = logging.getLogger("connector.rss")


# Curated list of Ukrainian business RSS feeds
UA_FEEDS = {
    "epravda": {
        "name": "Економічна правда",
        "url": "https://www.epravda.com.ua/rss/",
        "category": "economics",
        "language": "uk",
    },
    "rbc": {
        "name": "РБК-Україна",
        "url": "https://www.rbc.ua/ukr/rss",
        "category": "business",
        "language": "uk",
    },
    "forbes": {
        "name": "Forbes Україна",
        "url": "https://forbes.ua/rss",
        "category": "business",
        "language": "uk",
    },
    "liga": {
        "name": "ЛІГА.net Бізнес",
        "url": "https://biz.liga.net/rss",
        "category": "business",
        "language": "uk",
    },
    "finance": {
        "name": "Finance.ua",
        "url": "https://news.finance.ua/rss/",
        "category": "finance",
        "language": "uk",
    },
    "minfin": {
        "name": "Мінфін",
        "url": "https://minfin.com.ua/rss/",
        "category": "finance",
        "language": "uk",
    },
    "nbu": {
        "name": "НБУ Новини",
        "url": "https://bank.gov.ua/rss",
        "category": "banking",
        "language": "uk",
    },
    "ukrinform": {
        "name": "Укрінформ Економіка",
        "url": "https://www.ukrinform.ua/rss/block-economics",
        "category": "economics",
        "language": "uk",
    },
}


@dataclass
class FeedItem:
    """A single RSS feed item."""
    title: str
    link: str
    published: str
    summary: str = ""
    source: str = ""
    category: str = ""
    author: str = ""
    language: str = "uk"

    def to_dict(self) -> dict[str, Any]:
        return {
            "title": self.title,
            "link": self.link,
            "published": self.published,
            "summary": self.summary,
            "source": self.source,
            "category": self.category,
            "author": self.author,
            "language": self.language,
        }


class RSSAggregator(BaseConnector):
    """RSS feed aggregator for Ukrainian business news.

    Aggregates and normalizes feeds from multiple sources,
    with keyword filtering for relevance.
    """

    def __init__(self, feeds: dict | None = None):
        super().__init__(
            name="RSSAggregator",
            base_url="https://www.epravda.com.ua",
            timeout=15.0,
        )
        self.feeds = feeds or UA_FEEDS
        self._cache: dict[str, list[FeedItem]] = {}
        self._cache_time: dict[str, datetime] = {}
        self._cache_ttl = 300  # 5 minutes
        logger.info("RSSAggregator initialized with %d feeds", len(self.feeds))

    async def search(
        self, query: str, limit: int = 50, **kwargs
    ) -> ConnectorResult:
        """Search across all RSS feeds.

        Args:
            query: Search keywords
            limit: Max results
            **kwargs:
                sources: List of source keys to search (default: all)
                category: Filter by category
                since_hours: Only items from last N hours

        Returns:
            ConnectorResult with matching feed items
        """
        sources = kwargs.get("sources")
        category = kwargs.get("category")

        all_items: list[FeedItem] = []

        # Fetch from each feed
        feed_keys = sources if sources else list(self.feeds.keys())
        for key in feed_keys:
            if key not in self.feeds:
                continue
            feed_info = self.feeds[key]

            # Apply category filter
            if category and feed_info.get("category") != category:
                continue

            items = await self._fetch_feed(key, feed_info)
            all_items.extend(items)

        # Filter by query keywords
        if query.strip():
            keywords = query.lower().split()
            filtered = [
                item for item in all_items
                if any(
                    kw in item.title.lower() or kw in item.summary.lower()
                    for kw in keywords
                )
            ]
        else:
            filtered = all_items

        # Sort by date (newest first)
        filtered.sort(key=lambda x: x.published, reverse=True)

        # Limit
        filtered = filtered[:limit]

        return ConnectorResult(
            success=True,
            data=[item.to_dict() for item in filtered],
            source="rss_aggregator",
            records_count=len(filtered),
        )

    async def get_by_id(self, record_id: str) -> ConnectorResult:
        """Get feed by source key."""
        if record_id in self.feeds:
            items = await self._fetch_feed(record_id, self.feeds[record_id])
            return ConnectorResult(
                success=True,
                data=[item.to_dict() for item in items],
                source=record_id,
                records_count=len(items),
            )
        return ConnectorResult(
            success=False,
            data=None,
            error=f"Feed '{record_id}' not found",
            source=self.name,
        )

    async def fetch(
        self, limit: int = 100, offset: int = 0, **kwargs
    ) -> ConnectorResult:
        """Fetch all feeds for ETL."""
        return await self.search("", limit=limit, **kwargs)

    async def get_all_sources(self) -> list[dict[str, str]]:
        """Get list of all configured RSS sources."""
        return [
            {
                "key": key,
                "name": info["name"],
                "url": info["url"],
                "category": info["category"],
            }
            for key, info in self.feeds.items()
        ]

    async def _fetch_feed(
        self, key: str, feed_info: dict
    ) -> list[FeedItem]:
        """Fetch and parse a single RSS feed."""
        # Check cache
        if key in self._cache:
            cache_age = (datetime.now(UTC) - self._cache_time.get(key, datetime.min.replace(tzinfo=UTC))).total_seconds()
            if cache_age < self._cache_ttl:
                return self._cache[key]

        items: list[FeedItem] = []
        url = feed_info["url"]

        try:
            import httpx

            async with httpx.AsyncClient(
                timeout=10.0,
                headers={
                    "User-Agent": "Predator-Analytics/21.0 RSS-Aggregator",
                    "Accept": "application/rss+xml, application/xml, text/xml",
                },
                follow_redirects=True,
            ) as client:
                resp = await client.get(url)

                if resp.status_code == 200:
                    items = self._parse_rss(resp.text, feed_info)
                    logger.debug("Fetched %d items from %s", len(items), key)
                else:
                    logger.warning("RSS feed %s returned %d", key, resp.status_code)

        except Exception as e:
            logger.warning("Failed to fetch RSS feed %s: %s", key, e)

        # Update cache
        self._cache[key] = items
        self._cache_time[key] = datetime.now(UTC)

        return items

    def _parse_rss(self, xml_text: str, feed_info: dict) -> list[FeedItem]:
        """Parse RSS XML into FeedItem list."""
        items: list[FeedItem] = []

        try:
            import xml.etree.ElementTree as ET

            root = ET.fromstring(xml_text)

            # Handle both RSS 2.0 and Atom
            # RSS 2.0
            for item in root.iter("item"):
                title = self._get_text(item, "title")
                link = self._get_text(item, "link")
                pub_date = self._get_text(item, "pubDate")
                description = self._get_text(item, "description")
                author = self._get_text(item, "author") or self._get_text(item, "dc:creator")
                category = self._get_text(item, "category")

                if title and link:
                    items.append(FeedItem(
                        title=self._clean_html(title),
                        link=link.strip(),
                        published=pub_date or datetime.now(UTC).isoformat(),
                        summary=self._clean_html(description)[:500] if description else "",
                        source=feed_info["name"],
                        category=category or feed_info.get("category", ""),
                        author=author or "",
                        language=feed_info.get("language", "uk"),
                    ))

            # Atom
            if not items:
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                for entry in root.findall(".//atom:entry", ns):
                    title = self._get_text(entry, "atom:title", ns)
                    link_el = entry.find("atom:link", ns)
                    link = link_el.get("href", "") if link_el is not None else ""
                    published = self._get_text(entry, "atom:published", ns) or self._get_text(entry, "atom:updated", ns)
                    summary = self._get_text(entry, "atom:summary", ns)

                    if title and link:
                        items.append(FeedItem(
                            title=self._clean_html(title),
                            link=link.strip(),
                            published=published or datetime.now(UTC).isoformat(),
                            summary=self._clean_html(summary)[:500] if summary else "",
                            source=feed_info["name"],
                            category=feed_info.get("category", ""),
                            language=feed_info.get("language", "uk"),
                        ))

        except Exception as e:
            logger.warning("RSS parse error for %s: %s", feed_info.get("name", "?"), e)

        return items

    @staticmethod
    def _get_text(element, tag: str, ns: dict | None = None) -> str:
        """Get text content from XML element."""
        if ns:
            child = element.find(tag, ns)
        else:
            child = element.find(tag)
        return child.text.strip() if child is not None and child.text else ""

    @staticmethod
    def _clean_html(text: str) -> str:
        """Remove HTML tags from text."""
        import re
        clean = re.sub(r"<[^>]+>", "", text)
        clean = re.sub(r"\s+", " ", clean).strip()
        # Decode common entities
        clean = clean.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
        clean = clean.replace("&quot;", '"').replace("&#39;", "'").replace("&nbsp;", " ")
        return clean


# Singleton
rss_aggregator = RSSAggregator()
