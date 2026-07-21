import asyncio
import logging
from typing import Any

from app.services.osint.collectors.base import BaseOsintCollector

logger = logging.getLogger(__name__)

class DarknetCollector(BaseOsintCollector):
    """Колектор специфічних Darknet-даних (форуми, маркетплейси).
    Аналізує згадки про особу в контексті тіньових ринків
    (анонімізовані повідомлення, пропозиції послуг).
    Підтримує маршрутизацію через Tor SOCKS5 проксі.
    """

    def __init__(self, proxy: str | None = "socks5://127.0.0.1:9050"):
        super().__init__(source_name="Darknet_Forums", proxy=proxy)

    async def collect(self, query: str, **kwargs) -> dict[str, Any]:
        """Симуляція запиту до індексів Darknet (Ahmia, DarkSearch API).
        В реальному середовищі тут буде виклик через self._fetch(url) з Tor-проксі.
        """
        logger.info(f"[DarknetCollector] Виконується пошук '{query}' через {self.proxy}")
        await asyncio.sleep(1.5) # Simulating Tor network latency

        # Симульовані результати з глибокого вебу
        mentions = []
        if "dark" in query.lower() or "іванов" in query.lower() or "test" in query.lower():
            mentions = [
                {
                    "forum": "Exploit.in",
                    "onion_url": "http://exploit2...onion/topic/123",
                    "date": "2024-03-15",
                    "topic": "Looking for drops in UA",
                    "content_snippet": "Needs verification for specific names... ivanov boss...",
                    "author": "shadow_broker",
                    "threat_level": "HIGH"
                },
                {
                    "forum": "Genesis Market",
                    "onion_url": "http://genesis...onion/search?q=ivanov",
                    "date": "2024-03-18",
                    "topic": "Leaked DBs Ukraine",
                    "content_snippet": "Full dump contains ivanov and others",
                    "author": "db_seller99",
                    "threat_level": "CRITICAL"
                }
            ]

        return {"search_query": query, "mentions": mentions}

    def normalize(self, raw_data: dict[str, Any]) -> dict[str, Any]:
        nodes = []
        edges = []
        dossier_updates = {"digital_footprint": {"darknet_mentions": []}}

        mentions = raw_data.get("mentions", [])

        for mention in mentions:
            forum = mention.get("forum")
            onion_url = mention.get("onion_url", "")
            author = mention.get("author", "unknown")

            # Node: Darknet Post
            post_id = f"darknet_post_{hash(forum + mention.get('topic')) % 100000}"
            nodes.append({
                "node_id": post_id,
                "labels": ["DarknetMention", "ThreatIntelligence"],
                "properties": {
                    "forum": forum,
                    "date": mention.get("date"),
                    "topic": mention.get("topic"),
                    "threat_level": mention.get("threat_level")
                }
            })

            # Node: Onion Site
            if onion_url:
                site_id = f"onion_site_{hash(onion_url) % 100000}"
                nodes.append({
                    "node_id": site_id,
                    "labels": ["OnionSite"],
                    "properties": {
                        "url": onion_url,
                        "name": forum
                    }
                })
                # Edge: Post -> Onion Site
                edges.append({
                    "source": post_id,
                    "target": site_id,
                    "type": "HOSTED_ON",
                    "properties": {}
                })

            # Node: Threat Actor (Author)
            actor_id = f"threat_actor_{hash(author) % 100000}"
            nodes.append({
                "node_id": actor_id,
                "labels": ["ThreatActor", "Alias"],
                "properties": {
                    "username": author
                }
            })
            # Edge: Actor -> Post
            edges.append({
                "source": actor_id,
                "target": post_id,
                "type": "POSTED",
                "properties": {"date": mention.get("date")}
            })

            # Edge: Query Target -> Post
            edges.append({
                "target": post_id,
                "type": "MENTIONED_IN",
                "properties": {
                    "source": self.source_name,
                    "context": mention.get("content_snippet")
                }
            })

            dossier_updates["digital_footprint"]["darknet_mentions"].append({
                "forum": forum,
                "onion_url": onion_url,
                "author": author,
                "date": mention.get("date"),
                "threat_level": mention.get("threat_level"),
                "snippet": mention.get("content_snippet")
            })

        return {
            "nodes": nodes,
            "edges": edges,
            "dossier_updates": dossier_updates
        }
