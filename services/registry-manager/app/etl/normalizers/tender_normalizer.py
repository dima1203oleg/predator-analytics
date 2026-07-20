"""
Tender Normalizer — PREDATOR Registry Manager
Розділ 9. Нормалізація
Перетворює сирі дані (напр. OCDS від ProZorro) в універсальну модель Tender та Company.
"""
import logging
from typing import Any, Dict, List

logger = logging.getLogger(__name__)

class TenderNormalizer:
    @staticmethod
    def normalize_prozorro(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Нормалізує сирий OCDS JSON від ProZorro.
        """
        tender_id = raw_data.get("id")
        tender_number = raw_data.get("tenderID")
        title = raw_data.get("title", "")
        description = raw_data.get("description", "")
        status = raw_data.get("status", "unknown")
        
        value_data = raw_data.get("value", {})
        value = value_data.get("amount", 0.0)
        currency = value_data.get("currency", "UAH")
        
        procuring_entity = raw_data.get("procuringEntity", {})
        identifier = procuring_entity.get("identifier", {})
        
        # Нормалізація Замовника (Company)
        organizer = {
            "ueid": f"UA-EDR-{identifier.get('id', 'unknown')}",
            "name": procuring_entity.get("name", ""),
            "legal_name": procuring_entity.get("identifier", {}).get("legalName", ""),
            "edrpou": identifier.get("id", ""),
            "role": "organizer"
        }
        
        # Нормалізація Учасників (Bidders) - може бути відсутнім на етапі fetch_tenders
        bids = raw_data.get("bids", [])
        participants = []
        for bid in bids:
            tenderers = bid.get("tenderers", [])
            for tenderer in tenderers:
                t_id = tenderer.get("identifier", {}).get("id", "")
                participants.append({
                    "ueid": f"UA-EDR-{t_id}",
                    "name": tenderer.get("name", ""),
                    "edrpou": t_id,
                    "role": "participant",
                    "bid_value": bid.get("value", {}).get("amount", 0.0)
                })

        normalized_tender = {
            "entity_type": "Tender",
            "source": "prozorro",
            "id": tender_id,
            "tender_number": tender_number,
            "title": title,
            "description": description,
            "status": status,
            "value": value,
            "currency": currency,
            "organizer": organizer,
            "participants": participants,
            "raw_data_ref": f"minio://raw/prozorro/{tender_id}.json"
        }
        
        logger.debug(f"Normalized tender {tender_id}")
        return normalized_tender
