"""Media Collector — Пошук згадок у ЗМІ.

Джерела: Google News, RSS, скрапінг українських ЗМІ.
Класифікація: GREY.
"""
import httpx

from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class MediaCollector(BaseCollector):
    name = "media"
    display_name = "ЗМІ та Медіа-Моніторинг"
    classification = Classification.GREY
    description = "Згадки в ЗМІ, сентимент-аналіз, Google News"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_name = query.name or query.identifier

        # Mock: структуровані дані ЗМІ-моніторингу
        mock_articles = [
            {
                "title": f"СБУ перевіряє діяльність {search_name}",
                "source": "Babel.ua",
                "date": "2026-07-10",
                "url": "https://babel.ua/mock-article",
                "sentiment": "negative",
                "relevance_score": 0.92,
            },
            {
                "title": f"{search_name}: нові контракти з держоборонзамовленням",
                "source": "Liga.net",
                "date": "2026-06-28",
                "url": "https://liga.net/mock-article",
                "sentiment": "neutral",
                "relevance_score": 0.78,
            },
            {
                "title": f"Журналістське розслідування: хто стоїть за {search_name}?",
                "source": "Bihus.Info",
                "date": "2026-05-15",
                "url": "https://bihus.info/mock-article",
                "sentiment": "negative",
                "relevance_score": 0.95,
            },
        ]

        fragments.append(DataFragment(
            category="media",
            source_name="Media Monitor (UA)",
            classification=Classification.GREY,
            data={
                "query": search_name,
                "total_mentions": len(mock_articles),
                "negative_mentions": sum(1 for a in mock_articles if a["sentiment"] == "negative"),
                "sources_checked": ["Babel.ua", "Liga.net", "Bihus.Info", "Censor.net", "Ukrinform"],
            },
            raw_records=mock_articles,
            confidence=0.6,
            metadata={"note": "Mock. Реальний збір через RSS парсинг або Google News API."},
        ))

        return fragments
