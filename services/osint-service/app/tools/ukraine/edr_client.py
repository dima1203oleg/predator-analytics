"""EDR Tool — Єдиний державний реєстр юридичних осіб України."""
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class EDRTool(BaseTool):
    """Адаптер для ЄДР (Єдиний державний реєстр).

    ЄДР — офіційний реєстр юридичних осіб України.
    Містить дані про всі зареєстровані компанії.

    Можливості:
    - Пошук за ЄДРПОУ
    - Пошук за назвою
    - Інформація про засновників
    - Керівництво компанії
    - Статутний капітал
    - Історія змін

    API: https://data.gov.ua/dataset/edr
    """

    name = "edr_ukraine"
    description = "ЄДР — Єдиний державний реєстр юридичних осіб України"
    version = "1.0"
    categories = ["ukraine", "registry", "company"]
    supported_targets = ["edrpou", "company_name"]

    def __init__(self, api_key: str = "", timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)
        self.api_key = api_key
        self.base_url = "https://data.gov.ua/api/3/action"

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук у ЄДР.

        Args:
            target: ЄДРПОУ (8 цифр) або назва компанії
            options: Додаткові опції:
                - search_type: "edrpou" | "name" | "auto"
                - include_founders: включати засновників (default: True)
                - include_history: включати історію змін (default: False)

        Returns:
            ToolResult з даними компанії
        """
        start_time = datetime.now(UTC)
        options = options or {}

        search_type = options.get("search_type", "auto")
        include_founders = options.get("include_founders", True)

        # Автовизначення типу пошуку
        if search_type == "auto":
            search_type = "edrpou" if target.isdigit() and len(target) == 8 else "name"

        findings = []
        companies = []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                if search_type == "edrpou":
                    company_data = await self._search_by_edrpou(client, target)
                    if company_data:
                        companies.append(company_data)
                else:
                    companies = await self._search_by_name(client, target)

                # Формуємо findings
                for company in companies:
                    findings.append({
                        "type": "company",
                        "value": company.get("name"),
                        "confidence": 0.95,
                        "source": "edr_ukraine",
                        "metadata": {
                            "edrpou": company.get("edrpou"),
                            "status": company.get("status"),
                            "address": company.get("address"),
                        },
                    })

                    # Засновники
                    if include_founders:
                        for founder in company.get("founders", []):
                            findings.append({
                                "type": "founder",
                                "value": founder.get("name"),
                                "confidence": 0.9,
                                "source": "edr_ukraine",
                                "metadata": {
                                    "company": company.get("name"),
                                    "share": founder.get("share"),
                                    "role": founder.get("role"),
                                },
                            })

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до ЄДР"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            logger.error(f"EDR error: {e}")

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if companies else ToolStatus.PARTIAL,
            data={
                "query": target,
                "search_type": search_type,
                "companies": companies,
                "total_found": len(companies),
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _search_by_edrpou(self, client: httpx.AsyncClient, edrpou: str) -> dict | None:
        """Пошук за ЄДРПОУ через Opendatabot."""
        if not self.api_key:
            logger.warning("No OPENDATABOT_API_KEY provided, returning empty result")
            return None

        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"https://opendatabot.com/api/v3/company/{edrpou}"
        
        response = await client.get(url, headers=headers)
        if response.status_code == 404:
            return None
            
        response.raise_for_status()
        data = response.json()
        
        # Transform Opendatabot data to internal format
        return {
            "edrpou": edrpou,
            "name": data.get("name"),
            "short_name": data.get("short_name"),
            "status": data.get("status", {}).get("name"),
            "registration_date": data.get("founded_at"),
            "address": data.get("location"),
            "kved": [{"code": data.get("kved", {}).get("code"), "name": data.get("kved", {}).get("name"), "primary": True}],
            "authorized_capital": data.get("statutory_capital"),
            "director": {
                "name": data.get("director", {}).get("full_name", ""),
                "position": "Директор",
            },
            "founders": [
                {
                    "name": founder.get("name"),
                    "type": "person" if "ІНН" in founder.get("code", "") or founder.get("is_beneficial_owner") else "company",
                    "edrpou": founder.get("code") if "ІНН" not in founder.get("code", "") else None,
                    "share": founder.get("share"),
                    "role": "Кінцевий бенефіціар" if founder.get("is_beneficial_owner") else "Засновник",
                }
                for founder in data.get("founders", [])
            ],
            "tax_info": {
                "is_vat_payer": data.get("vat_payer", False),
            },
        }

    async def _search_by_name(self, client: httpx.AsyncClient, name: str) -> list[dict]:
        """Пошук за назвою через Opendatabot."""
        if not self.api_key:
            return []

        headers = {"Authorization": f"Bearer {self.api_key}"}
        url = f"https://opendatabot.com/api/v3/search/companies?q={name}"
        
        response = await client.get(url, headers=headers)
        if response.status_code == 404:
            return []
            
        response.raise_for_status()
        data = response.json()
        
        companies = []
        for item in data.get("companies", [])[:5]:  # Limit to 5 results
            companies.append({
                "edrpou": item.get("code"),
                "name": item.get("name"),
                "status": item.get("status", {}).get("name"),
                "address": item.get("location"),
                "founders": [],  # Usually not included in basic search
            })
            
        return companies
