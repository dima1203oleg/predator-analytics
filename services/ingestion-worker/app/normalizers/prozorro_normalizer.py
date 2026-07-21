"""ProZorro Normalizer.

Транслює формат Open Contracting Data Standard (OCDS) від ProZorro 
у Neo4j вузли та зв'язки.
"""
from typing import Any, Generator
import logging

logger = logging.getLogger("ingestion_worker.prozorro_normalizer")


class ProzorroNormalizer:
    """Конвертер ProZorro -> Neo4j."""

    def normalize(self, entity: dict[str, Any]) -> Generator[tuple[str, dict[str, Any]], None, None]:
        """Обробка одного тендеру та генерація вузлів/зв'язків."""
        tender_id = entity.get("id")
        tender_number = entity.get("tenderID")
        
        if not tender_id:
            return

        # 1. Створюємо вузол Тендеру
        tender_props = {
            "id": tender_id,
            "tenderID": tender_number,
            "dateModified": entity.get("dateModified"),
            "status": entity.get("status"),
        }
        
        value = entity.get("value", {})
        if value:
            tender_props["value_amount"] = value.get("amount")
            tender_props["value_currency"] = value.get("currency")
            
        yield ("node", {
            "label": "Tender",
            "id": tender_id,
            "props": tender_props,
        })

        # 2. Замовник (procuringEntity)
        procuring_entity = entity.get("procuringEntity", {})
        if procuring_entity:
            buyer_identifier = procuring_entity.get("identifier", {})
            buyer_edrpou = buyer_identifier.get("id")
            buyer_name = procuring_entity.get("name") or buyer_identifier.get("legalName")
            
            if buyer_edrpou:
                buyer_id = f"COMPANY_{buyer_edrpou}"
                yield ("node", {
                    "label": "Company",
                    "id": buyer_id,
                    "props": {
                        "id": buyer_id,
                        "edrpou": buyer_edrpou,
                        "name": buyer_name,
                    },
                })
                
                # Зв'язок Замовник -> Тендер
                yield ("edge", {
                    "source_id": buyer_id,
                    "target_id": tender_id,
                    "rel_type": "ANNOUNCED",
                    "props": {},
                })

        # 3. Переможці/Постачальники (якщо є в розширеній моделі awards)
        awards = entity.get("awards", [])
        for award in awards:
            suppliers = award.get("suppliers", [])
            for supplier in suppliers:
                supp_identifier = supplier.get("identifier", {})
                supp_edrpou = supp_identifier.get("id")
                supp_name = supplier.get("name") or supp_identifier.get("legalName")
                
                if supp_edrpou:
                    supp_id = f"COMPANY_{supp_edrpou}"
                    yield ("node", {
                        "label": "Company",
                        "id": supp_id,
                        "props": {
                            "id": supp_id,
                            "edrpou": supp_edrpou,
                            "name": supp_name,
                        },
                    })
                    
                    # Зв'язок Постачальник -> Тендер
                    yield ("edge", {
                        "source_id": supp_id,
                        "target_id": tender_id,
                        "rel_type": "AWARDED",
                        "props": {
                            "award_id": award.get("id"),
                            "status": award.get("status"),
                            "date": award.get("date"),
                        },
                    })
