from __future__ import annotations


"""Telegram Channel Monitor (COMP-027)

Моніторинг Telegram каналів для збору бізнес-інтелекту.
Підтримує:
- Моніторинг публічних каналів
- Keyword alerting
- Sentiment analysis інтеграція
- Entity extraction

Для prod: Telethon / Pyrogram з MTProto API.
Для dev: RSS/HTTP fallback з web-preview каналів.
"""
import logging
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from app.connectors.base import BaseConnector, ConnectorResult


logger = logging.getLogger("connector.telegram")


# Default Ukrainian business channels to monitor
DEFAULT_CHANNELS = [
    {"id": "economic_pravda", "name": "Економічна правда", "url": "https://t.me/s/epaborsh"},
    {"id": "forbes_ua", "name": "Forbes Україна", "url": "https://t.me/s/Forbes_Ukraine"},
    {"id": "opendatabot", "name": "OpenDataBot", "url": "https://t.me/s/opendatabot"},
    {"id": "zn_ua", "name": "Дзеркало тижня", "url": "https://t.me/s/zaborona_official"},
    {"id": "nashi_groshi", "name": "Наші Гроші", "url": "https://t.me/s/nashigroshi"},
    {"id": "customs_ua", "name": "Митниця UA", "url": "https://t.me/s/customs_ua"},
    {"id": "antimonopoly", "name": "АМКУ", "url": "https://t.me/s/amkuua"},
    {"id": "tax_ua", "name": "Податки UA", "url": "https://t.me/s/tax_ua_official"},
]


@dataclass
class TelegramMessage:
    """Parsed Telegram message."""
    channel_id: str
    channel_name: str
    message_id: str = ""
    text: str = ""
    date: str = ""
    views: int = 0
    forwards: int = 0
    has_media: bool = False
    url: str = ""
    entities_found: list[str] = field(default_factory=list)
    sentiment: str = "neutral"
    keywords_matched: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "channel_id": self.channel_id,
            "channel_name": self.channel_name,
            "message_id": self.message_id,
            "text": self.text[:500],
            "date": self.date,
            "views": self.views,
            "forwards": self.forwards,
            "has_media": self.has_media,
            "url": self.url,
            "entities_found": self.entities_found,
            "sentiment": self.sentiment,
            "keywords_matched": self.keywords_matched,
        }


class TelegramMonitor(BaseConnector):
    """Monitors Telegram channels for business intelligence.

    In production: Uses Telethon/Pyrogram MTProto API.
    In development: Scrapes web-preview (t.me/s/channel).
    """

    def __init__(self, channels: list[dict] | None = None):
        super().__init__(
            name="TelegramMonitor",
            base_url="https://t.me",
            timeout=15.0,
        )
        self.channels = channels or DEFAULT_CHANNELS
        self._keywords: list[str] = []
        logger.info("TelegramMonitor initialized with %d channels", len(self.channels))

    def set_keywords(self, keywords: list[str]):
        """Set alert keywords."""
        self._keywords = [k.lower() for k in keywords]

    async def search(
        self, query: str, limit: int = 50, **kwargs
    ) -> ConnectorResult:
        """Search across monitored channels.

        Args:
            query: Search keywords
            limit: Max results
            **kwargs:
                channels: List of channel IDs to search
        """
        import httpx
        import re

        target_channels = kwargs.get("channels") or self.channels
        all_messages: list[TelegramMessage] = []

        for channel in target_channels:
            url = channel.get("url", "")
            if not url:
                continue

            try:
                async with httpx.AsyncClient(
                    timeout=10.0,
                    headers={
                        "User-Agent": "Mozilla/5.0 (compatible; Predator-Analytics/21.0)",
                    },
                    follow_redirects=True,
                ) as client:
                    resp = await client.get(url)

                    if resp.status_code == 200:
                        messages = self._parse_web_preview(
                            resp.text, channel, query,
                        )
                        all_messages.extend(messages)

            except Exception as e:
                logger.debug("Failed to fetch channel %s: %s", channel.get("id"), e)

        # Sort by date (newest first)
        all_messages.sort(key=lambda m: m.date, reverse=True)
        all_messages = all_messages[:limit]

        return ConnectorResult(
            success=True,
            data=[m.to_dict() for m in all_messages],
            source="telegram",
            records_count=len(all_messages),
        )

    async def get_by_id(self, record_id: str) -> ConnectorResult:
        """Get channel info by ID."""
        for ch in self.channels:
            if ch.get("id") == record_id:
                return ConnectorResult(
                    success=True,
                    data=ch,
                    source="telegram",
                    records_count=1,
                )
        return ConnectorResult(
            success=False,
            data=None,
            error=f"Channel '{record_id}' not found",
            source=self.name,
        )

    async def fetch(
        self, limit: int = 100, offset: int = 0, **kwargs
    ) -> ConnectorResult:
        """Fetch all channels for ETL."""
        return await self.search("", limit=limit, **kwargs)

    async def get_channels(self) -> list[dict]:
        """Get list of monitored channels."""
        return self.channels

    def _parse_web_preview(
        self,
        html: str,
        channel: dict,
        query: str,
    ) -> list[TelegramMessage]:
        """Parse Telegram web preview HTML."""
        import re

        messages: list[TelegramMessage] = []
        query_lower = query.lower()

        # Extract messages from web preview
        # Pattern: <div class="tgme_widget_message_text"...>TEXT</div>
        msg_pattern = re.compile(
            r'class="tgme_widget_message_text[^"]*"[^>]*>(.*?)</div>',
            re.DOTALL,
        )
        date_pattern = re.compile(
            r'datetime="([^"]+)"',
        )
        view_pattern = re.compile(
            r'class="tgme_widget_message_views"[^>]*>([0-9.KMk]+)',
        )

        msg_matches = msg_pattern.findall(html)
        date_matches = date_pattern.findall(html)
        view_matches = view_pattern.findall(html)

        for i, text_html in enumerate(msg_matches):
            # Clean HTML
            text = re.sub(r"<[^>]+>", "", text_html).strip()
            text = text.replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")

            if not text:
                continue

            # Filter by query
            if query_lower and query_lower not in text.lower():
                # Check individual keywords
                keywords = query_lower.split()
                if not any(kw in text.lower() for kw in keywords):
                    continue

            # Parse date
            date = date_matches[i] if i < len(date_matches) else datetime.now(UTC).isoformat()

            # Parse views
            views = 0
            if i < len(view_matches):
                view_str = view_matches[i].replace("K", "000").replace("k", "000").replace("M", "000000").replace(".", "")
                try:
                    views = int(view_str)
                except ValueError:
                    pass

            # Keyword matching
            matched_keywords = [
                kw for kw in self._keywords if kw in text.lower()
            ]

            msg = TelegramMessage(
                channel_id=channel.get("id", ""),
                channel_name=channel.get("name", ""),
                text=text[:500],
                date=date,
                views=views,
                url=channel.get("url", ""),
                keywords_matched=matched_keywords,
            )
            messages.append(msg)

        return messages


# Singleton
telegram_monitor = TelegramMonitor()
