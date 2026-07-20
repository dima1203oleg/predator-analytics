"""
Special Normalizer (Cyber, Interpol, Blockchain) — PREDATOR Registry Manager
"""
import logging
from typing import Any, Dict

logger = logging.getLogger(__name__)

class SpecialNormalizer:
    @staticmethod
    def normalize_interpol(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Нормалізує особу з бази Interpol."""
        entity_id = raw_data.get("entity_id")
        first_name = raw_data.get("forename", "")
        last_name = raw_data.get("name", "")
        full_name = f"{first_name} {last_name}".strip()
        
        return {
            "entity_type": "Person",
            "source": "Interpol",
            "id": entity_id,
            "name": full_name,
            "nationalities": raw_data.get("nationalities", []),
            "relations": [
                {
                    "type": "WANTED_BY",
                    "target": {
                        "entity_type": "InterpolNode",
                        "ueid": "ORG-INTERPOL",
                        "name": "Interpol"
                    }
                }
            ],
            "raw_data_ref": f"minio://raw/interpol/{entity_id}.json",
            "searchable_text": full_name
        }

    @staticmethod
    def normalize_blockchain(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Нормалізує крипто-гаманець."""
        address = raw_data.get("address")
        
        return {
            "entity_type": "CryptoWallet",
            "ueid": f"WALLET-{address}",
            "address": address,
            "risk_score": raw_data.get("risk_score"),
            "cluster": raw_data.get("cluster"),
            "balance": raw_data.get("balance")
        }

    @staticmethod
    def normalize_cyber_leak(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Нормалізує витік даних."""
        email = raw_data.get("email")
        
        return {
            "entity_type": "Email",
            "ueid": f"EMAIL-{email}",
            "address": email,
            "risk": raw_data.get("risk"),
            "relations": [
                {
                    "type": "COMPROMISED_IN",
                    "target": {
                        "entity_type": "DataLeak",
                        "ueid": f"LEAK-{breach}",
                        "name": breach
                    }
                } for breach in raw_data.get("breaches", [])
            ]
        }
