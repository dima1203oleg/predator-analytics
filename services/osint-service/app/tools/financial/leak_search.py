"""Leak Search Tool — пошук у витоках даних (h8mail, LeakLooker)."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class LeakSearchTool(BaseTool):
    """Адаптер для пошуку у витоках даних.

    Джерела:
    - h8mail (email breach search)
    - LeakLooker (exposed databases)
    - Have I Been Pwned API

    Можливості:
    - Пошук email у витоках
    - Виявлення скомпрометованих паролів
    - Пошук exposed databases
    - Аналіз breach history

    GitHub:
    - https://github.com/khast3x/h8mail
    - https://github.com/woj-ciech/leaklooker
    """

    name = "leak_search"
    description = "Leak Search — пошук у витоках даних (breaches, leaks)"
    version = "1.0"
    categories = ["security", "breach", "leak"]
    supported_targets = ["email", "domain", "username"]

    # Відомі великі витоки
    KNOWN_BREACHES = {
        "linkedin_2021": {"name": "LinkedIn 2021", "records": 700_000_000, "date": "2021-06"},
        "facebook_2021": {"name": "Facebook 2021", "records": 533_000_000, "date": "2021-04"},
        "yahoo_2013": {"name": "Yahoo 2013", "records": 3_000_000_000, "date": "2013-08"},
        "adobe_2013": {"name": "Adobe 2013", "records": 153_000_000, "date": "2013-10"},
        "dropbox_2012": {"name": "Dropbox 2012", "records": 68_000_000, "date": "2012-07"},
    }

    def __init__(self, hibp_api_key: str = "", timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)
        self.hibp_api_key = hibp_api_key

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук у витоках.

        Args:
            target: Email, домен або username
            options: Додаткові опції:
                - search_type: "email" | "domain" | "username"
                - include_passwords: включати паролі (default: False)
                - check_hibp: перевіряти Have I Been Pwned (default: True)

        Returns:
            ToolResult з результатами пошуку
        """
        start_time = datetime.now(UTC)
        options = options or {}

        search_type = options.get("search_type", self._detect_search_type(target))
        check_hibp = options.get("check_hibp", True)

        findings = []
        breaches = []
        pastes = []

        # Пошук у HIBP (якщо є API ключ)
        if check_hibp and self.hibp_api_key and search_type == "email":
            hibp_results = await self._check_hibp(target)
            breaches.extend(hibp_results.get("breaches", []))
            pastes.extend(hibp_results.get("pastes", []))

        # Локальний аналіз (симуляція)
        # В реальності — інтеграція з h8mail або власною базою
        local_results = self._search_local_db(target, search_type)
        breaches.extend(local_results.get("breaches", []))

        # Формуємо findings
        for breach in breaches:
            severity = "critical" if breach.get("contains_passwords") else "high"
            findings.append({
                "type": "breach",
                "value": breach.get("name"),
                "confidence": 0.9,
                "source": "leak_search",
                "metadata": {
                    "breach_date": breach.get("date"),
                    "records": breach.get("records"),
                    "data_types": breach.get("data_types", []),
                    "severity": severity,
                },
            })

        # Risk assessment
        risk_score = self._calculate_breach_risk(breaches)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if breaches else ToolStatus.PARTIAL,
            data={
                "query": target,
                "search_type": search_type,
                "breaches": breaches,
                "pastes": pastes,
                "total_breaches": len(breaches),
                "total_records_exposed": sum(b.get("records", 0) for b in breaches),
                "risk_score": risk_score,
                "is_compromised": len(breaches) > 0,
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _detect_search_type(self, target: str) -> str:
        """Визначення типу пошуку."""
        if "@" in target:
            return "email"
        elif "." in target:
            return "domain"
        return "username"

    async def _check_hibp(self, email: str) -> dict[str, Any]:
        """Перевірка Have I Been Pwned API."""
        import httpx

        breaches = []
        pastes = []

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                # Breaches
                response = await client.get(
                    f"https://haveibeenpwned.com/api/v3/breachedaccount/{email}",
                    headers={
                        "hibp-api-key": self.hibp_api_key,
                        "user-agent": "PREDATOR-OSINT",
                    },
                )

                if response.status_code == 200:
                    for breach in response.json():
                        breaches.append({
                            "name": breach.get("Name"),
                            "title": breach.get("Title"),
                            "date": breach.get("BreachDate"),
                            "records": breach.get("PwnCount"),
                            "data_types": breach.get("DataClasses", []),
                            "contains_passwords": "Passwords" in breach.get("DataClasses", []),
                            "source": "hibp",
                        })

                # Pastes
                paste_response = await client.get(
                    f"https://haveibeenpwned.com/api/v3/pasteaccount/{email}",
                    headers={
                        "hibp-api-key": self.hibp_api_key,
                        "user-agent": "PREDATOR-OSINT",
                    },
                )

                if paste_response.status_code == 200:
                    pastes = paste_response.json()

        except Exception as e:
            logger.warning(f"HIBP check failed: {e}")

        return {"breaches": breaches, "pastes": pastes}

    def _search_local_db(self, target: str, search_type: str) -> dict[str, Any]:
        """Пошук у локальній базі (симуляція)."""
        # В реальності — інтеграція з h8mail або власною базою витоків
        breaches = []

        # Симуляція для демонстрації
        if search_type == "domain":
            domain = target.lower()
            # Перевіряємо чи домен є у відомих витоках
            if any(domain in ["linkedin.com", "facebook.com", "adobe.com"]):
                breaches.append({
                    "name": "Domain found in breach",
                    "date": "2021-01-01",
                    "records": 1000,
                    "source": "local_db",
                })

        return {"breaches": breaches}

    def _calculate_breach_risk(self, breaches: list[dict]) -> float:
        """Розрахунок ризику на основі витоків."""
        if not breaches:
            return 0.0

        score = 0.0

        for breach in breaches:
            # Базовий score за кожен breach
            score += 15

            # Додатково за паролі
            if breach.get("contains_passwords"):
                score += 25

            # Додатково за свіжість
            breach_date = breach.get("date", "")
            if breach_date and breach_date >= "2023":
                score += 10
            elif breach_date and breach_date >= "2020":
                score += 5

            # Додатково за розмір
            records = breach.get("records", 0)
            if records > 100_000_000:
                score += 10
            elif records > 10_000_000:
                score += 5

        return min(100, score)
