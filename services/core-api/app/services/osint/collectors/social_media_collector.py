import asyncio
import logging
from typing import Any

from app.services.osint.collectors.base import BaseOsintCollector

logger = logging.getLogger(__name__)

class SocialMediaCollector(BaseOsintCollector):
    """Колектор соціальних мереж та зв'язків.
    Шукає профілі особи (LinkedIn, Telegram, Facebook).
    Аналізує публічні пости та список друзів.
    Симулює використання OSINT Frameworks (Sherlock, Maltego).
    """

    def __init__(self):
        super().__init__(source_name="SocialMedia_OSINT")

    async def collect(self, query: str, **kwargs) -> dict[str, Any]:
        """Симуляція пошуку в соцмережах (імітація виклику API Twitter/LinkedIn)"""
        logger.info(f"[SocialMediaCollector] Аналіз соціальних зв'язків для '{query}'")
        await asyncio.sleep(1.2)

        if "іванов" in query.lower() or "ivanov" in query.lower() or "test" in query.lower():
            return {
                "search_query": query,
                "profiles": [
                    {
                        "platform": "LinkedIn",
                        "username": "ivanov_boss",
                        "url": "https://linkedin.com/in/ivanov_boss",
                        "job_title": "CEO at ТОВ ОФШОР",
                        "connections_count": 500,
                        "risk_flags": [],
                        "posts": [
                            {"id": "post_1", "text": "Great insights on crypto investments", "date": "2024-02-10"}
                        ],
                        "following": ["petrov_invest", "sydorov_legal"]
                    },
                    {
                        "platform": "Telegram",
                        "username": "ivan_dark",
                        "url": "https://t.me/ivan_dark",
                        "phone": "+380501234567",
                        "risk_flags": ["member_of_high_risk_groups"],
                        "posts": [],
                        "following": []
                    }
                ]
            }

        return {"search_query": query, "profiles": []}

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"digital_footprint": {"social_media": []}}

        profiles = raw_data.get("profiles", [])

        for profile in profiles:
            platform = profile.get("platform")
            username = profile.get("username")

            # Node: Social Account
            account_id = f"social_{platform.lower()}_{username}"
            nodes.append({
                "node_id": account_id,
                "labels": ["SocialAccount", "DigitalIdentity"],
                "properties": {
                    "platform": platform,
                    "username": username,
                    "url": profile.get("url"),
                    "risk_flags": profile.get("risk_flags", [])
                }
            })

            # Edge: Person -> Social Account
            edges.append({
                "target": account_id,
                "type": "HAS_ACCOUNT",
                "properties": {
                    "source": self.source_name
                }
            })

            # Extract Posts
            for post in profile.get("posts", []):
                post_id = f"post_{platform.lower()}_{post['id']}"
                nodes.append({
                    "node_id": post_id,
                    "labels": ["SocialPost"],
                    "properties": {
                        "content": post.get("text"),
                        "date": post.get("date")
                    }
                })
                # Edge: Account -> Post
                edges.append({
                    "source": account_id,
                    "target": post_id,
                    "type": "POSTED",
                    "properties": {}
                })

            # Extract Following connections
            for following_user in profile.get("following", []):
                following_id = f"social_{platform.lower()}_{following_user}"
                nodes.append({
                    "node_id": following_id,
                    "labels": ["SocialAccount", "DigitalIdentity"],
                    "properties": {
                        "platform": platform,
                        "username": following_user
                    }
                })
                # Edge: Account -> Following Account
                edges.append({
                    "source": account_id,
                    "target": following_id,
                    "type": "FOLLOWS",
                    "properties": {}
                })

            dossier_updates["digital_footprint"]["social_media"].append({
                "platform": platform,
                "username": username,
                "url": profile.get("url")
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
