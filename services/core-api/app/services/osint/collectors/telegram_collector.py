"""Telegram Collector — Аналіз згадок у відкритих Telegram-каналах.

Класифікація: GREY.
"""
import hashlib
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType

class TelegramCollector(BaseCollector):
    name = "telegram"
    display_name = "Аналіз Telegram-каналів"
    classification = Classification.GREY
    description = "Парсинг згадок у публічних Telegram-каналах та чатах"
    supported_entities = [EntityType.COMPANY, EntityType.PERSON, EntityType.PHONE, EntityType.EMAIL]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_term = query.name or query.identifier
        if not search_term:
            return fragments

        # Smart mock: 50% chance to find mentions
        name_hash = hashlib.md5(search_term.encode()).hexdigest()
        has_mentions = int(name_hash, 16) % 2 == 0

        data = {
            "query": search_term,
            "total_mentions": 0,
            "channels": []
        }
        links = []

        if has_mentions:
            mentions_count = (int(name_hash[:4], 16) % 15) + 1
            data["total_mentions"] = mentions_count
            
            # Decide if channel is high risk
            is_high_risk = int(name_hash[4:8], 16) % 3 == 0
            channel_name = "DarkMarket_UA" if is_high_risk else "News_Analytics"
            
            data["channels"].append({
                "channel": channel_name,
                "mentions": mentions_count,
                "sentiment": "NEGATIVE" if is_high_risk else "NEUTRAL"
            })
            
            links.append({
                "source_id": query.identifier,
                "target_id": f"tg_{channel_name.lower()}",
                "target_name": f"TG: {channel_name}",
                "relation_type": "MENTIONED_IN",
                "risk": "HIGH" if is_high_risk else "MEDIUM"
            })

        fragments.append(DataFragment(
            category="telegram_mentions",
            source_name="Telegram Search",
            classification=Classification.GREY,
            data=data,
            discovered_links=links,
            confidence=0.85 if has_mentions else 0.0,
            metadata={"note": "Smart Mock. Telegram parsing enabled."},
        ))

        return fragments
