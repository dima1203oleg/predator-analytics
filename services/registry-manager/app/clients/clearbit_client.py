"""
Clearbit API Client (On-Demand) — PREDATOR Registry Manager
"""
import logging
import httpx
import os

logger = logging.getLogger(__name__)

class ClearbitClient:
    BASE_URL = "https://company.clearbit.com/v2/companies/find"

    def __init__(self):
        self.api_key = os.getenv("CLEARBIT_API_KEY", "mock_key")
        self.client = httpx.AsyncClient(
            headers={"Authorization": f"Bearer {self.api_key}"},
            timeout=30.0
        )
        logger.info("Initialized ClearbitClient")

    async def enrich_domain(self, domain: str) -> dict:
        """
        Збагачує інформацію про компанію за її доменом.
        """
        logger.info(f"Requesting Clearbit enrichment for domain: {domain}")
        try:
            if self.api_key == "mock_key":
                return {
                    "domain": domain,
                    "name": domain.split(".")[0].capitalize(),
                    "category": {"industryGroup": "Software"},
                    "metrics": {"employees": 150},
                    "logo": f"https://logo.clearbit.com/{domain}"
                }

            response = await self.client.get(self.BASE_URL, params={"domain": domain})
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Clearbit API Error for {domain}: {e}")
            return {}

    async def close(self):
        await self.client.aclose()
