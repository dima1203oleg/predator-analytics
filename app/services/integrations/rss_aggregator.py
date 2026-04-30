import datetime
import logging
from typing import Any

logger = logging.getLogger(__name__)

class RSSAggregator:
    """RSS Aggregator (COMP-028)
    Fetches, parses, and aggregates news feeds via RSS/Atom to power market intelligence.
    """

    def __init__(self):
        # Known generic sources
        self.sources = [
            "https://www.epravda.com.ua/rss/",
            "https://nv.ua/ukr/biz/rss.xml"
        ]

    def aggregate_feeds(self, limit_per_feed: int = 5) -> list[dict[str, Any]]:
        """Retrieves articles from all registered RSS channels.
        Mock implementation for the scope of the prototype.
        """
        aggregated_news = []
        for i, url in enumerate(self.sources):
            # Simulated parsing of standard XML feeds
            aggregated_news.extend([
                {
                    "source": url,
                    "title": f"Важлива економічна новина №{j+1} від джерела {i+1}",
                    "link": f"{url.replace('rss', 'news')}/{j+1000}",
                    "published_at": (datetime.datetime.now() - datetime.timedelta(hours=j*2)).isoformat(),
                    "summary": "Коротка вижимка ключових подій станом на поточну дату: аналітика, ринкові тенденції.",
                }
                for j in range(limit_per_feed)
            ])

        return aggregated_news

    def add_feed(self, rss_url: str):
        """Dynamically adds a custom RSS string.
        """
        if rss_url not in self.sources:
            self.sources.append(rss_url)
            return {"status": "success", "message": f"Added feed {rss_url}"}
        return {"status": "info", "message": "Already exists"}
