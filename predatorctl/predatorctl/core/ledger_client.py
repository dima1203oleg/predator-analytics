from typing import Dict, Any, Optional
import requests
import json
import logging

class LedgerClient:
    """
    Client for interacting with the Truth Ledger Service.
    Used by predatorctl and other agents.
    """
    def __init__(self, base_url: str = "http://localhost:8092"):
        self.base_url = base_url
        self.logger = logging.getLogger("ledger-client")

    def append_entry(self, entity_type: str, entity_id: str, action: str, payload: Dict[str, Any], signature: str = None) -> Dict:
        try:
            resp = requests.post(f"{self.base_url}/entry", json={
                "entity_type": entity_type,
                "entity_id": entity_id,
                "action": action,
                "payload": payload,
                "arbiter_signature": signature
            })
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            self.logger.error(f"Failed to append to ledger: {e}")
            return None

    def verify_entry(self, entry_id: int) -> Dict:
        try:
            resp = requests.get(f"{self.base_url}/verify/{entry_id}")
            if resp.status_code == 404:
                return {"valid": False, "error": "Not Found"}
            return resp.json()
        except Exception as e:
            return {"valid": False, "error": str(e)}

    def check_integrity(self) -> bool:
        try:
            resp = requests.get(f"{self.base_url}/audit/integrity")
            return resp.json().get("status") == "healthy"
        except Exception:
            return False

    def list_entries(self, limit: int = 10) -> list:
        try:
            resp = requests.get(f"{self.base_url}/entries", params={"limit": limit})
            resp.raise_for_status()
            return resp.json()
        except Exception:
            # Fallback for mock/offline
            return []
