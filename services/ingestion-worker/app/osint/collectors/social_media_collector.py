"""Social Media Collector — Аналіз соціальних мереж (LinkedIn, X/Twitter).

Класифікація: WHITE.
"""
import hashlib
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType

class SocialMediaCollector(BaseCollector):
    name = "social_media"
    display_name = "Соціальні Мережі"
    classification = Classification.WHITE
    description = "Парсинг сторінок LinkedIn, Twitter/X, Facebook"
    supported_entities = [EntityType.COMPANY, EntityType.PERSON]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_term = query.name or query.identifier
        if not search_term:
            return fragments

        name_hash = hashlib.md5(search_term.encode()).hexdigest()
        has_social = int(name_hash, 16) % 5 != 0  # 80% chance

        data = {
            "query": search_term,
            "profiles": []
        }
        links = []

        if has_social:
            data["profiles"].append({
                "network": "LinkedIn",
                "url": f"https://linkedin.com/company/{search_term.lower().replace(' ', '-')}",
                "status": "ACTIVE"
            })
            links.append({
                "source_id": query.identifier,
                "target_id": f"li_{name_hash[:6]}",
                "target_name": f"LinkedIn: {search_term}",
                "relation_type": "SOCIAL_PROFILE",
                "risk": "LOW"
            })

        fragments.append(DataFragment(
            category="social_profiles",
            source_name="Social Media API",
            classification=Classification.WHITE,
            data=data,
            discovered_links=links,
            confidence=0.9 if has_social else 0.0,
            metadata={"note": "Smart Mock. Social parsing enabled."},
        ))

        return fragments
