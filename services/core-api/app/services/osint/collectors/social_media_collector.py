"""Social Media Collector — Пошук у соціальних мережах.

Джерела: mock для Facebook, LinkedIn, Instagram, Twitter/X.
Класифікація: GREY.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class SocialMediaCollector(BaseCollector):
    name = "social_media"
    display_name = "Соціальні Мережі"
    classification = Classification.GREY
    description = "Facebook, LinkedIn, Instagram, Twitter/X — профілі, контакти, геолокації"
    supported_entities = [EntityType.PERSON]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Пошук профілів у соціальних мережах.
        
        УВАГА: Реальний збір потребує API-ключі або Puppeteer scraping.
        Наразі — структурований mock для демонстрації можливостей.
        """
        fragments: list[DataFragment] = []
        search_name = query.name or query.identifier

        # Mock: імітація знаходження профілів
        mock_profiles = [
            {
                "platform": "Facebook",
                "url": f"https://facebook.com/search?q={search_name.replace(' ', '+')}",
                "found": True,
                "profile_name": search_name,
                "friends_count": 342,
                "location": "Київ, Україна",
                "last_active": "2026-07-18",
                "public_posts_count": 15,
                "note": "Потрібен Facebook Graph API Token для повного доступу",
            },
            {
                "platform": "LinkedIn",
                "url": f"https://linkedin.com/search/results/all/?keywords={search_name.replace(' ', '%20')}",
                "found": True,
                "profile_name": search_name,
                "company": "Невідомо (потребує LinkedIn API)",
                "connections": "500+",
                "note": "Потрібен LinkedIn Sales Navigator API",
            },
            {
                "platform": "Instagram",
                "url": f"https://instagram.com/explore/tags/{search_name.replace(' ', '')}",
                "found": False,
                "note": "Instagram Basic Display API / scraping",
            },
            {
                "platform": "Twitter/X",
                "url": f"https://x.com/search?q={search_name.replace(' ', '%20')}",
                "found": False,
                "note": "X API v2 (платний)",
            },
        ]

        links = []
        for p in mock_profiles:
            if p["found"]:
                links.append({
                    "source_id": query.identifier,
                    "target_id": f"social_{p['platform'].lower()}",
                    "target_name": f"{p['platform']}: {p.get('profile_name', 'N/A')}",
                    "relation_type": "HAS_SOCIAL_PROFILE",
                    "risk": "LOW",
                })

        fragments.append(DataFragment(
            category="social_media",
            source_name="Social Media Aggregator",
            classification=Classification.GREY,
            data={
                "platforms_checked": len(mock_profiles),
                "profiles_found": sum(1 for p in mock_profiles if p["found"]),
            },
            raw_records=mock_profiles,
            discovered_links=links,
            confidence=0.5,
            metadata={"note": "Mock-дані. Для реального збору потрібні API-ключі."},
        ))

        return fragments
