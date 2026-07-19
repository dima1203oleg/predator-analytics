import os
import httpx
from typing import List, Dict, Any

from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")

# Загальний пошуковий термін, який має повернути результати, якщо БД наповнена.
TEST_SEARCH_QUERY = "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ"

class OsintValidator(BaseValidator):
    """
    Рівень 5: Перевірка працездатності OSINT-бекенду.
    Надсилає реальний пошуковий запит і валідує структуру відповіді.
    """
    def __init__(self):
        super().__init__(
            name="level5_osint",
            description="Перевірка OSINT-бекенду на реальних даних",
        )

    async def _run_validation(self):
        api_base = config.CORE_API_URL
        osint_search_url = f"{api_base}/api/v1/osint/search"

        try:
            async with httpx.AsyncClient(verify=False, timeout=15) as client:
                response = await client.post(
                    osint_search_url,
                    json={"query": TEST_SEARCH_QUERY, "limit": 1},
                    headers={"Content-Type": "application/json"}
                )

                if response.status_code == 200:
                    self.add_check(CheckResult(
                        name="osint_api_connectivity",
                        passed=True,
                        message=f"OSINT API ({osint_search_url}) доступний (HTTP 200)",
                        severity="info",
                    ))
                    await self._validate_osint_response(response.json())
                else:
                    self.add_check(CheckResult(
                        name="osint_api_connectivity",
                        passed=False,
                        message=f"OSINT API повернув помилку HTTP {response.status_code}",
                        severity="critical",
                        details={"url": osint_search_url, "status": response.status_code, "response": response.text[:500]},
                    ))

        except httpx.ConnectError as e:
            self.add_check(CheckResult(
                name="osint_api_connectivity",
                passed=False,
                message=f"Не вдалося підключитися до OSINT API: {e}",
                severity="critical",
                details={"url": osint_search_url},
            ))
        except Exception as e:
            self.add_check(CheckResult(
                name="osint_api_check_failed",
                passed=False,
                message=f"Загальна помилка під час перевірки OSINT API: {e}",
                severity="critical",
            ))

    async def _validate_osint_response(self, data: Dict[str, Any]):
        """Валідація структури відповіді від OSINT API."""
        results = data.get("data", {}).get("results", [])

        if not isinstance(results, list):
            self.add_check(CheckResult(
                name="osint_response_format",
                passed=False,
                message="Відповідь API має невірний формат: 'results' не є списком.",
                severity="critical",
            ))
            return

        if not results:
            self.add_check(CheckResult(
                name="osint_data_presence",
                passed=False,
                message=f"Тестовий запит '{TEST_SEARCH_QUERY}' не повернув результатів. База даних може бути порожньою.",
                severity="warning",
            ))
            return

        self.add_check(CheckResult(
            name="osint_data_presence",
            passed=True,
            message="API повернув реальні дані у відповідь на тестовий запит.",
            severity="info",
        ))

        # Перевірка структури першого результату
        first_result = results[0]
        required_keys = ["name", "edrpou", "status", "address", "risk_score"]
        missing_keys = [key for key in required_keys if key not in first_result]

        if not missing_keys:
            self.add_check(CheckResult(
                name="osint_data_structure",
                passed=True,
                message="Структура даних OSINT-відповіді коректна (містить ключові поля).",
                severity="info",
                details={"checked_keys": required_keys}
            ))
        else:
            self.add_check(CheckResult(
                name="osint_data_structure",
                passed=False,
                message=f"У відповіді відсутні ключові поля: {', '.join(missing_keys)}",
                severity="critical",
                details={"missing_keys": missing_keys}
            ))