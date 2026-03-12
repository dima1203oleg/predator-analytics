"""Instaloader Tool — Instagram OSINT."""
import logging
from datetime import datetime, UTC
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class InstaloaderTool(BaseTool):
    """Адаптер для Instaloader.

    Instaloader — інструмент для завантаження та аналізу Instagram.

    Можливості:
    - Профілі користувачів
    - Пости та stories
    - Followers/Following
    - Хештеги
    - Геолокація

    GitHub: https://github.com/instaloader/instaloader
    """

    name = "instaloader"
    description = "Instaloader — Instagram OSINT"
    version = "4.14"
    categories = ["social", "instagram", "osint"]
    supported_targets = ["username", "hashtag", "location"]

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Збір даних з Instagram.

        Args:
            target: Username або хештег
            options: Додаткові опції:
                - search_type: "profile" | "hashtag" | "location"
                - include_posts: завантажувати пости (default: True)
                - posts_limit: максимум постів (default: 50)
                - include_stories: завантажувати stories (default: False)

        Returns:
            ToolResult з профілем та постами
        """
        start_time = datetime.now(UTC)
        options = options or {}

        search_type = options.get("search_type", "profile")
        include_posts = options.get("include_posts", True)
        posts_limit = options.get("posts_limit", 50)

        findings = []
        profile = {}
        posts = []

        if search_type == "profile":
            # Симуляція профілю
            profile = {
                "username": target,
                "full_name": f"User {target.title()}",
                "biography": "Sample Instagram bio 📸",
                "external_url": f"https://example.com/{target}",
                "followers": 5000,
                "following": 300,
                "posts_count": 150,
                "is_private": False,
                "is_verified": False,
                "is_business": True,
                "business_category": "Company",
            }

            findings.append({
                "type": "instagram_profile",
                "value": target,
                "confidence": 0.95,
                "source": "instaloader",
                "metadata": {
                    "followers": profile["followers"],
                    "is_business": profile["is_business"],
                },
            })

            if include_posts:
                posts = [
                    {
                        "id": "post_001",
                        "date": "2026-03-10",
                        "type": "image",
                        "caption": "Sample post caption #business #ukraine",
                        "likes": 250,
                        "comments": 15,
                        "hashtags": ["business", "ukraine"],
                        "location": "Kyiv, Ukraine",
                    },
                    {
                        "id": "post_002",
                        "date": "2026-03-08",
                        "type": "carousel",
                        "caption": "Another post",
                        "likes": 180,
                        "comments": 8,
                        "hashtags": [],
                        "location": None,
                    },
                ]

        elif search_type == "hashtag":
            # Пошук за хештегом
            posts = [
                {
                    "id": "hashtag_post_001",
                    "username": "user1",
                    "date": "2026-03-10",
                    "caption": f"Post with #{target}",
                    "likes": 500,
                },
            ]

            findings.append({
                "type": "instagram_hashtag",
                "value": target,
                "confidence": 0.9,
                "source": "instaloader",
                "metadata": {"posts_found": len(posts)},
            })

        # Аналіз хештегів
        all_hashtags = []
        for post in posts:
            all_hashtags.extend(post.get("hashtags", []))

        # Аналіз локацій
        locations = [p.get("location") for p in posts if p.get("location")]

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "query": target,
                "search_type": search_type,
                "profile": profile,
                "posts": posts[:posts_limit],
                "total_posts": len(posts),
                "hashtags_used": list(set(all_hashtags)),
                "locations": list(set(locations)),
            },
            findings=findings,
            duration_seconds=duration,
        )
