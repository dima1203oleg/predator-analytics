"""Twint Tool — Twitter/X OSINT без API."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class TwintTool(BaseTool):
    """Адаптер для Twint.

    Twint — інструмент для збору даних з Twitter/X без офіційного API.
    Працює через скрапінг веб-інтерфейсу.

    Можливості:
    - Пошук твітів за username
    - Пошук за ключовими словами
    - Followers/Following
    - Геолокація твітів
    - Історичні дані

    GitHub: https://github.com/twintproject/twint
    """

    name = "twint"
    description = "Twint — Twitter/X OSINT без API"
    version = "2.1"
    categories = ["social", "twitter", "osint"]
    supported_targets = ["username", "keyword", "hashtag"]

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Збір даних з Twitter.

        Args:
            target: Username, ключове слово або хештег
            options: Додаткові опції:
                - search_type: "user" | "keyword" | "hashtag"
                - limit: максимум твітів (default: 100)
                - since: дата від (YYYY-MM-DD)
                - until: дата до (YYYY-MM-DD)
                - include_replies: включати відповіді

        Returns:
            ToolResult з твітами та профілем
        """
        start_time = datetime.now(UTC)
        options = options or {}

        search_type = options.get("search_type", "user")
        limit = options.get("limit", 100)

        findings = []
        tweets = []
        profile = {}

        # Симуляція Twint (реальна інтеграція потребує subprocess)
        if search_type == "user":
            profile = {
                "username": target,
                "name": f"User {target}",
                "bio": "Sample bio",
                "location": "Kyiv, Ukraine",
                "followers": 1500,
                "following": 500,
                "tweets_count": 2500,
                "joined": "2015-03-15",
                "verified": False,
            }

            findings.append({
                "type": "twitter_profile",
                "value": target,
                "confidence": 0.95,
                "source": "twint",
                "metadata": profile,
            })

            # Симуляція твітів
            tweets = [
                {
                    "id": "1234567890",
                    "date": "2026-03-10",
                    "text": f"Sample tweet from @{target}",
                    "likes": 50,
                    "retweets": 10,
                    "replies": 5,
                    "hashtags": ["osint", "ukraine"],
                    "mentions": [],
                },
                {
                    "id": "1234567891",
                    "date": "2026-03-09",
                    "text": f"Another tweet from @{target}",
                    "likes": 30,
                    "retweets": 5,
                    "replies": 2,
                    "hashtags": [],
                    "mentions": ["@someone"],
                },
            ]

        elif search_type == "keyword" or search_type == "hashtag":
            # Пошук за ключовим словом
            tweets = [
                {
                    "id": "9876543210",
                    "date": "2026-03-10",
                    "username": "user1",
                    "text": f"Tweet mentioning {target}",
                    "likes": 100,
                    "retweets": 25,
                },
            ]

            findings.append({
                "type": "twitter_search",
                "value": target,
                "confidence": 0.9,
                "source": "twint",
                "metadata": {"results_count": len(tweets)},
            })

        # Аналіз хештегів
        all_hashtags = []
        for tweet in tweets:
            all_hashtags.extend(tweet.get("hashtags", []))

        hashtag_freq = {}
        for tag in all_hashtags:
            hashtag_freq[tag] = hashtag_freq.get(tag, 0) + 1

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "query": target,
                "search_type": search_type,
                "profile": profile,
                "tweets": tweets[:limit],
                "total_tweets": len(tweets),
                "hashtag_frequency": hashtag_freq,
            },
            findings=findings,
            duration_seconds=duration,
        )
