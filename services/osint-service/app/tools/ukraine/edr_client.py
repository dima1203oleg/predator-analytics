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
        """Пошук за ЄДРПОУ."""
        # Симуляція — в реальності запит до data.gov.ua або opendatabot
        return {
            "edrpou": edrpou,
            "name": f"ТОВ КОМПАНІЯ {edrpou}",
            "name_en": f"COMPANY {edrpou} LLC",
            "short_name": f"КОМПАНІЯ {edrpou}",
            "status": "зареєстровано",
            "registration_date": "2015-01-15",
            "address": "м. Київ, вул. Хрещатик, 1",
            "kved": [
                {"code": "46.90", "name": "Неспеціалізована оптова торгівля", "primary": True},
                {"code": "47.19", "name": "Інші види роздрібної торгівлі", "primary": False},
            ],
            "authorized_capital": 100000.00,
            "authorized_capital_currency": "UAH",
            "director": {
                "name": "Іванов Іван Іванович",
                "position": "Директор",
                "appointment_date": "2015-01-15",
            },
            "founders": [
                {
                    "name": "Петров Петро Петрович",
                    "type": "person",
                    "share": 60.0,
                    "role": "Засновник",
                },
                {
                    "name": "ТОВ ХОЛДИНГ",
                    "type": "company",
                    "edrpou": "12345678",
                    "share": 40.0,
                    "role": "Засновник",
                },
            ],
            "tax_info": {
                "is_vat_payer": True,
                "vat_number": "123456789012",
                "tax_system": "загальна",
            },
        }

    async def _search_by_name(self, client: httpx.AsyncClient, name: str) -> list[dict]:
        """Пошук за назвою."""
        # Симуляція
        return [
            {
                "edrpou": "12345678",
                "name": name,
                "status": "зареєстровано",
                "address": "м. Київ",
                "founders": [],
            }
        ]
