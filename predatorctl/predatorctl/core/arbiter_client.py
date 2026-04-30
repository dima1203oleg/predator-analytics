from __future__ import annotations

import logging
from typing import Any

import requests


class ArbiterClient:
    """Client for interacting with the Arbiter Service.
    Enforces the 'Constitution as Code'.
    """

    def __init__(self, base_url: str = "http://localhost:8091"):
        self.base_url = base_url
        self.logger = logging.getLogger("arbiter-client")

    def decide(self, type: str, context: dict[str, Any], sender: str = "predatorctl") -> dict:
        """Request a constitutional decision."""
        try:
            payload = {
                "request_id": f"req-{type}-{context.get('id', 'adhoc')}",
                "type": type,
                "context": context,
                "sender": sender
            }
            resp = requests.post(f"{self.base_url}/decide", json=payload)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as e:
            # If Arbiter is down, System defaults to "FAIL CLOSED" (Deny)
            self.logger.exception(f"Arbiter Unreachable: {e}")
            return {
                "allowed": False,
                "reason": "Arbiter Service Unreachable (Fail Closed)",
                "signature": None
            }
