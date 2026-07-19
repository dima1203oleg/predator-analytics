"""Document Collector — Реєстри документів, нотаріальних дій, довіреностей.

Джерела: Реєстр заставленого майна, нотаріальні дії, довіреності.
Класифікація: BLACK.
"""
from .base import BaseCollector, Classification, DataFragment, DossierQuery, EntityType


class DocumentCollector(BaseCollector):
    name = "documents"
    display_name = "Реєстри Документів та Нотаріальних Дій"
    classification = Classification.BLACK
    description = "Довіреності, нотаріальні дії, заставне майно, реєстри обтяжень"
    supported_entities = [EntityType.PERSON, EntityType.COMPANY, EntityType.DOCUMENT]

    async def collect(self, query: DossierQuery) -> list[DataFragment]:
        fragments: list[DataFragment] = []
        search_name = query.name or query.identifier

        # Mock: реєстр обтяжень рухомого майна
        mock_encumbrances = [
            {
                "type": "Іпотека",
                "object": "Квартира, м. Київ, вул. Хрещатик, 22, кв. 5",
                "creditor": "АТ 'ПриватБанк'",
                "registration_date": "2023-06-15",
                "amount": "2,500,000 UAH",
                "status": "Діюча",
            },
            {
                "type": "Застава рухомого майна",
                "object": "Автомобіль BMW X5, VIN: WBAPH5C5XBA123456",
                "creditor": "АТ 'Укрсиббанк'",
                "registration_date": "2024-01-20",
                "amount": "850,000 UAH",
                "status": "Діюча",
            },
        ]

        # Mock: нотаріальні дії
        mock_notary = [
            {
                "type": "Довіреність",
                "description": "Генеральна довіреність на управління нерухомістю",
                "notary": "Шевченко М.В., Київський нотаріальний округ",
                "date": "2025-11-10",
                "parties": [search_name, "Коваленко І.В."],
            },
            {
                "type": "Договір купівлі-продажу",
                "description": "Продаж земельної ділянки, кадастровий №3221881200:01:001:0015",
                "notary": "Петренко О.М., Обухівський нотаріальний округ",
                "date": "2026-02-28",
                "parties": [search_name, "ТОВ 'Лендмарк Інвест'"],
            },
        ]

        links = []
        for enc in mock_encumbrances:
            links.append({
                "source_id": query.identifier,
                "target_id": enc.get("creditor", ""),
                "target_name": enc.get("creditor", ""),
                "relation_type": "HAS_ENCUMBRANCE_WITH",
                "risk": "MEDIUM",
            })
        for n_act in mock_notary:
            for party in n_act.get("parties", []):
                if party != search_name:
                    links.append({
                        "source_id": query.identifier,
                        "target_id": party,
                        "target_name": party,
                        "relation_type": "NOTARY_ACTION_WITH",
                        "risk": "LOW",
                    })

        fragments.append(DataFragment(
            category="encumbrances",
            source_name="Державний реєстр обтяжень рухомого майна",
            classification=Classification.BLACK,
            data={"total_encumbrances": len(mock_encumbrances)},
            raw_records=mock_encumbrances,
            discovered_links=links,
            confidence=0.5,
            metadata={"note": "Mock-дані. API потребує інтеграції з Мін'юст."},
        ))

        fragments.append(DataFragment(
            category="notary_actions",
            source_name="Реєстр нотаріальних дій",
            classification=Classification.BLACK,
            data={"total_actions": len(mock_notary)},
            raw_records=mock_notary,
            confidence=0.5,
        ))

        return fragments
