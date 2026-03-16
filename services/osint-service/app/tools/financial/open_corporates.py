"""OpenCorporates Tool — найбільша база компаній світу (200M+)."""
import logging
from datetime import UTC, datetime
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class OpenCorporatesTool(BaseTool):
    """Адаптер для OpenCorporates.

    OpenCorporates — найбільша база компаній у світі.
    Понад 200 мільйонів компаній з 140+ юрисдикцій.

    Можливості:
    - Пошук компаній
    - Директори та офіцери
    - Реєстраційні дані
    - Філії та дочірні компанії
    - Історія змін

    GitHub: https://github.com/opencorporates
    API: https://api.opencorporates.com/
    """

    name = "open_corporates"
    description = "OpenCorporates — база 200M+ компаній світу"
    version = "0.4"
    categories = ["financial", "company", "registry"]
    supported_targets = ["company", "officer"]

    def __init__(self, api_key: str = "", timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)
        self.api_key = api_key
        self.base_url = "https://api.opencorporates.com/v0.4"

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True  # Має безкоштовний tier

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук компанії.

        Args:
            target: Назва компанії
            options: Додаткові опції:
                - jurisdiction: код юрисдикції (напр. "ua", "gb", "us_de")
                - include_officers: включати директорів (default: True)
                - include_filings: включати документи (default: False)

        Returns:
            ToolResult з даними компанії
        """
        start_time = datetime.now(UTC)
        options = options or {}

        jurisdiction = options.get("jurisdiction")
        include_officers = options.get("include_officers", True)

        findings = []
        companies = []
        officers = []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                params = {"q": target}
                if jurisdiction:
                    params["jurisdiction_code"] = jurisdiction
                if self.api_key:
                    params["api_token"] = self.api_key

                # Пошук компаній
                response = await client.get(
                    f"{self.base_url}/companies/search",
                    params=params,
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", {}).get("companies", [])

                    for item in results[:10]:  # Обмежуємо
                        company = item.get("company", {})
                        company_data = {
                            "name": company.get("name"),
                            "company_number": company.get("company_number"),
                            "jurisdiction": company.get("jurisdiction_code"),
                            "incorporation_date": company.get("incorporation_date"),
                            "dissolution_date": company.get("dissolution_date"),
                            "company_type": company.get("company_type"),
                            "status": company.get("current_status"),
                            "registered_address": company.get("registered_address_in_full"),
                            "opencorporates_url": company.get("opencorporates_url"),
                        }
                        companies.append(company_data)

                        findings.append({
                            "type": "company",
                            "value": company_data["name"],
                            "confidence": 0.9,
                            "source": "open_corporates",
                            "metadata": {
                                "jurisdiction": company_data["jurisdiction"],
                                "status": company_data["status"],
                                "company_number": company_data["company_number"],
                            },
                        })

                        # Отримуємо директорів
                        if include_officers and company.get("officers"):
                            for officer in company.get("officers", []):
                                off = officer.get("officer", {})
                                officer_data = {
                                    "name": off.get("name"),
                                    "position": off.get("position"),
                                    "start_date": off.get("start_date"),
                                    "end_date": off.get("end_date"),
                                    "company": company_data["name"],
                                }
                                officers.append(officer_data)

                                findings.append({
                                    "type": "officer",
                                    "value": off.get("name"),
                                    "confidence": 0.85,
                                    "source": "open_corporates",
                                    "metadata": officer_data,
                                })

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до OpenCorporates"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            logger.error(f"OpenCorporates error: {e}")

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if companies else ToolStatus.PARTIAL,
            data={
                "query": target,
                "companies": companies,
                "officers": officers,
                "total_companies": len(companies),
                "total_officers": len(officers),
            },
            findings=findings,
            duration_seconds=duration,
        )
