"""Telegram Collector — Пошук у Telegram.

Джерела: Telegram MTProto API, бот-пошукачі, публічні канали.
Класифікація: GREY.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class TelegramCollector(BaseCollector):
    name = "telegram"
    display_name = "Telegram (MTProto / Боти)"
    classification = Classification.GREY
    description = "Пошук за номером телефону, групи, канали, публікації"
    supported_entities = [EntityType.PERSON, EntityType.PHONE]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Пошук у Telegram.
        
        Для реального збору потрібні api_id та api_hash (MTProto).
        Наразі — структурований mock.
        """
        fragments: list[DataFragment] = []
        phone = query.phone or query.identifier

        mock_data = {
            "phone_checked": phone,
            "telegram_registered": True,
            "username": None,
            "first_name": query.name.split()[0] if query.name else "Unknown",
            "groups_found": [
                {"name": "Крипто Україна", "members": 15400, "type": "public"},
                {"name": "Бізнес Київ", "members": 8200, "type": "public"},
            ],
            "channels_admin": [],
            "bots_used": ["@GetContact_bot", "@EyeOfGod_bot"],
            "getcontact_result": {
                "names_found": [query.name or "Невідомо"],
                "tags_count": 3,
                "note": "Потрібен GetContact Premium API для деталей",
            },
        }

        links = []
        for g in mock_data["groups_found"]:
            links.append({
                "source_id": query.identifier,
                "target_id": f"tg_group_{g['name'].replace(' ', '_').lower()}",
                "target_name": f"Telegram: {g['name']}",
                "relation_type": "MEMBER_OF_GROUP",
                "risk": "LOW",
            })

        fragments.append(DataFragment(
            category="telegram",
            source_name="Telegram Intelligence",
            classification=Classification.GREY,
            data=mock_data,
            discovered_links=links,
            confidence=0.4,
            metadata={"note": "Mock. Потрібні api_id/api_hash для Telethon."},
        ))

        return fragments
