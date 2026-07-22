"""Dummy Person Collector — Колектор для симуляції збору OSINT даних про фізичну особу.

Використовується для тестування інтерфейсу та пайплайнів без викликів реальних
платних або обмежувальних API, повертаючи вигадані (mock) дані, сумісні за форматом.
"""
import asyncio
from typing import Any

from .base import (
    BaseCollector,
    Classification,
    CollectorResult,
    DataFragment,
    DossierQuery,
    EntityType,
)


class DummyPersonCollector(BaseCollector):
    name = "dummy_person_collector"
    display_name = "Dummy Person OSINT Collector"
    classification = Classification.WHITE
    description = "Симулює збір відкритих даних по фізичній особі (Mock)"
    supported_entities = [EntityType.PERSON]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        """Симулює отримання даних з реєстрів та соцмереж."""
        await asyncio.sleep(2)  # Імітація мережевої затримки
        
        if isinstance(query, dict):
            name = query.get("name") or query.get("fullName") or "Іванов Іван Іванович"
            address = query.get("address") or "м. Київ"
        else:
            name = getattr(query, "name", None) or getattr(query, "target_query", None) or "Іванов Іван Іванович"
            address = getattr(query, "address", None) or "м. Київ"
        fragments = []

        # 1. ЄДР (Підприємництво)
        fragments.append(
            DataFragment(
                category="edrData",
                source_name="ЄДР",
                classification=Classification.WHITE,
                confidence=1.0,
                data={},
                raw_records=[
                    {
                        "companyName": f"ФОП {name}",
                        "edrpou": "—",
                        "role": "ФОП (КВЕД 47.11 — Роздрібна торгівля)",
                        "status": "Зареєстровано",
                        "regDate": "2015-04-12",
                    },
                    {
                        "companyName": "ТОВ 'БУДСЕРВІС-ТЕСТ'",
                        "edrpou": "41234567",
                        "role": "Засновник (50%)",
                        "status": "Зареєстровано",
                        "regDate": "2019-09-01",
                    }
                ],
                discovered_links=[
                    {
                        "target_id": "41234567",
                        "target_name": "ТОВ 'БУДСЕРВІС-ТЕСТ'",
                        "relation_type": "FOUNDER",
                        "risk": "LOW"
                    }
                ]
            )
        )

        # 2. Судові справи
        fragments.append(
            DataFragment(
                category="courtCases",
                source_name="Судова влада",
                classification=Classification.WHITE,
                confidence=0.9,
                data={
                    "total_cases": 1,
                    "criminal_cases": 0
                },
                raw_records=[
                    {
                        "caseNumber": "123/4567/26",
                        "court": "Печерський районний суд м. Києва",
                        "type": "Цивільне",
                        "status": "Розглядається",
                        "date": "2025-11-03",
                        "description": "Позов про стягнення заборгованості"
                    }
                ]
            )
        )

        # 3. Соцмережі
        fragments.append(
            DataFragment(
                category="socialProfiles",
                source_name="OSINT Scraper",
                classification=Classification.GREY,
                confidence=0.8,
                data={},
                raw_records=[
                    {
                        "platform": "Facebook",
                        "url": f"https://facebook.com/search/people/?q={name}",
                        "name": name,
                        "activity": "Активний",
                        "followers": 350,
                        "lastPost": "2026-07-10",
                    },
                    {
                        "platform": "Instagram",
                        "url": f"https://instagram.com/test_user",
                        "name": "@test_user",
                        "activity": "Помірна",
                        "followers": 150,
                        "lastPost": "2026-06-22",
                    }
                ]
            )
        )

        # 4. Telegram
        fragments.append(
            DataFragment(
                category="telegramMentions",
                source_name="Telegram OSINT",
                classification=Classification.GREY,
                confidence=0.7,
                data={
                    "channels": [
                        {"sentiment": "NEUTRAL", "name": "@local_news"}
                    ]
                },
                raw_records=[
                    {
                        "channel": "@local_news",
                        "date": "2026-05-18",
                        "text": f"Згадка {name} у місцевих новинах",
                    }
                ]
            )
        )

        # 5. Активи (Нерухомість)
        fragments.append(
            DataFragment(
                category="propertyRegistry",
                source_name="ДРРП",
                classification=Classification.WHITE,
                confidence=1.0,
                data={},
                raw_records=[
                    {
                        "type": "Житловий будинок",
                        "area": "145 м²",
                        "address": address,
                        "regNumber": "87654321",
                        "ownershipShare": "1/1",
                    }
                ]
            )
        )

        return fragments
