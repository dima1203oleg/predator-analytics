from typing import Dict, Any, Optional
import requests
import logging

class ArbiterClient:
    """
    Client for interacting with the Arbiter Service.
    Enforces the 'Constitution as Code'.
    """
    def __init__(self, base_url: str = "http://localhost:8091"):
        self.base_url = base_url
        self.logger = logging.getLogger("arbiter-client")

    def decide(self, type: str, context: Dict[str, Any], sender: str = "orchestrator") -> Dict:
        """
        Request a constitutional decision.
        """
        try:
            payload = {
                "request_id": f"req-{type}-{context.get('id', 'adhoc')}",
                "type": type,
                "context": context,
                "sender": sender
            }
            resp = requests.post(f"{self.base_url}/decide", json=payload, timeout=5)
            resp.raise_for_status()
            return resp.json()
        except requests.exceptions.RequestException as e:
            # If Arbiter is down, System defaults to "FAIL CLOSED" (Deny)
            self.logger.error(f"Arbiter Unreachable: {e}")
            return {
                "allowed": False,
                "reason": "Arbiter Service Unreachable (Fail Closed)",
                "signature": None
            }
