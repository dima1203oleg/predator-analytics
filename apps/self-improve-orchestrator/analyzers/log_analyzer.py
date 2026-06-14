import httpx
import logging

logger = logging.getLogger("predator.orchestrator.log_analyzer")

class UtosLogAnalyzer:
    def __init__(self, utos_url: str = "http://194.177.1.240:8003"):
        self.utos_url = utos_url

    async def fetch_latest_audit(self) -> dict:
        """Збирає результати останнього аудиту з UTOS"""
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(f"{self.utos_url}/api/v1/utos/run", timeout=120.0)
                if resp.status_code == 200:
                    return resp.json()
                else:
                    logger.warning(f"UTOS audit failed with status {resp.status_code}")
                    return {}
        except Exception as e:
            logger.error(f"Error connecting to UTOS: {e}")
            return {}

    def extract_failures(self, audit_data: dict) -> list[str]:
        """Витягує повідомлення про помилки з результатів UTOS"""
        failures = []
        layers = audit_data.get("layers", {})
        for layer_name, layer_data in layers.items():
            if layer_data.get("status") in ["fail", "CRITICAL"]:
                for check in layer_data.get("checks", []):
                    if not check.get("passed"):
                        failures.append(f"[{layer_name}] {check.get('name')}: {check.get('message')}")
        return failures
