from __future__ import annotations

from datetime import datetime
import logging
import os
from typing import Any

import requests


logger = logging.getLogger("core.constitutional")


class ArbiterClient:
    """Client for interacting with the Predator Arbiter (Port 8091).
    Enforces 'Constitution as Code' across all microservices.
    """

    def __init__(self, base_url: str | None = None):
        # Default to internal docker name if not provided
        self.base_url = base_url or os.environ.get("ARBITER_URL", "http://arbiter:8000")
        self.fail_closed = os.environ.get("CONSTITUTION_FAIL_CLOSED", "true").lower() == "true"

    def decide(self, action_type: str, context: dict[str, Any], sender: str = "system") -> dict:
        """Request authorization for an action."""
        try:
            payload = {
                "request_id": f"req-{action_type}-{datetime.now().strftime('%M%S')}",
                "type": action_type,
                "context": context,
                "sender": sender,
            }
            resp = requests.post(f"{self.base_url}/decide", json=payload, timeout=3)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.exception(f"Arbiter Communication Failure: {e}")
            if self.fail_closed:
                return {
                    "allowed": False,
                    "reason": f"Arbiter Offline (Fail-Closed Enforcement). Error: {e!s}",
                    "signature": None,
                }
            return {
                "allowed": True,
                "reason": "Arbiter Offline (Fail-Open/Emergency Mode)",
                "signature": "MOCK_EMERGENCY_SIG",
            }


class LedgerClient:
    """Client for the Immutable Truth Ledger (Port 8092)."""

    def __init__(self, base_url: str | None = None):
        self.base_url = base_url or os.environ.get("LEDGER_URL", "http://truth-ledger:8000")

    def log_action(
        self,
        entity_type: str,
        entity_id: str,
        action: str,
        payload: dict[str, Any],
        signature: str | None = None,
    ) -> dict | None:
        """Commit a verified action to the ledger."""
        try:
            # We don't send large payloads to ledger usually, just metadata + hash
            # But the service handles JSON.
            resp = requests.post(
                f"{self.base_url}/entry",
                json={
                    "entity_type": entity_type,
                    "entity_id": entity_id,
                    "action": action,
                    "payload": payload,
                    "arbiter_signature": signature,
                },
                timeout=3,
            )
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.exception(f"Ledger Commit Failure: {e}")
            return None

    def verify_integrity(self) -> bool:
        try:
            resp = requests.get(f"{self.base_url}/audit/integrity", timeout=10)
            return resp.json().get("status") == "healthy"
        except Exception:
            return False

    def get_entries(self, limit: int = 50) -> list[dict]:
        """Fetch the latest entries from the ledger."""
        try:
            resp = requests.get(f"{self.base_url}/entries", params={"limit": limit}, timeout=3)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.exception(f"Ledger Fetch Failure: {e}")
            return []


# Global Instances for internal usage
_arbiter = ArbiterClient()
_ledger = LedgerClient()


def get_arbiter() -> ArbiterClient:
    return _arbiter


def get_ledger() -> LedgerClient:
    return _ledger
