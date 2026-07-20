"""
NAZK Normalizer — PREDATOR Registry Manager
Розділ 9. Нормалізація
Перетворює сирі декларації НАЗК в моделі Person (PEP), Asset, Relative.
"""
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class NazkNormalizer:
    @staticmethod
    def normalize_declaration(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Нормалізує документ декларації від НАЗК.
        """
        doc_id = raw_data.get("id")
        data_block = raw_data.get("data", {})
        step_1 = data_block.get("step_1", {}) # Інформація про суб'єкта
        
        firstname = step_1.get("firstname", "")
        lastname = step_1.get("lastname", "")
        middlename = step_1.get("middlename", "")
        inn = step_1.get("taxNumber", "unknown") # ІПН
        
        # Основна особа (PEP)
        pep = {
            "ueid": f"UA-INN-{inn}",
            "first_name": firstname,
            "last_name": lastname,
            "patronymic": middlename,
            "inn": inn,
            "is_pep": True,
            "position": step_1.get("workPost", "")
        }
        
        # Активи (нерухомість)
        step_3 = data_block.get("step_3", {})
        assets = []
        if isinstance(step_3, dict):
            for asset_idx, asset_data in step_3.items():
                if isinstance(asset_data, dict):
                    assets.append({
                        "type": "RealEstate",
                        "description": asset_data.get("objectType", ""),
                        "area": asset_data.get("totalArea", ""),
                        "cost": asset_data.get("costDate", "")
                    })

        normalized_doc = {
            "entity_type": "Declaration",
            "source": "nazk",
            "id": doc_id,
            "year": raw_data.get("declaration_year", ""),
            "pep": pep,
            "assets": assets,
            "raw_data_ref": f"minio://raw/nazk/{doc_id}.json",
            # Текст для векторизації (Fulltext Search / Qdrant)
            "searchable_text": f"{lastname} {firstname} {middlename}. {step_1.get('workPost', '')}"
        }
        
        logger.debug(f"Normalized NAZK declaration {doc_id}")
        return normalized_doc
