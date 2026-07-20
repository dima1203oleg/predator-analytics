"""
Sanctions Normalizer — PREDATOR Registry Manager
"""
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class SanctionsNormalizer:
    @staticmethod
    def normalize_ofac(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Нормалізує об'єкт з OFAC SDN List (JSON).
        """
        entity_id = str(raw_data.get("id", ""))
        first_name = raw_data.get("firstName", "")
        last_name = raw_data.get("lastName", "")
        
        # Обробка псевдонімів
        aliases = []
        for alias in raw_data.get("aliases", []):
            aliases.append(alias.get("fullName", ""))
            
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            full_name = aliases[0] if aliases else "Unknown"

        normalized_entity = {
            "entity_type": "SanctionedEntity",
            "source": "OFAC",
            "id": entity_id,
            "name": full_name,
            "aliases": aliases,
            "programs": raw_data.get("programs", []),
            "raw_data_ref": f"minio://raw/ofac/entity_{entity_id}.json",
            "searchable_text": f"{full_name} " + " ".join(aliases)
        }
        
        return normalized_entity

    @staticmethod
    def normalize_rnbo(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Нормалізує об'єкт з РНБО.
        """
        entity_id = raw_data.get("id")
        name = raw_data.get("name_ukr", "")
        
        normalized_entity = {
            "entity_type": "SanctionedEntity",
            "source": "RNBO",
            "id": entity_id,
            "name": name,
            "aliases": raw_data.get("aliases", []),
            "programs": ["UKRAINE_SANCTIONS"],
            "raw_data_ref": f"minio://raw/rnbo/entity_{entity_id}.json",
            "searchable_text": f"{name}"
        }
        
        return normalized_entity
