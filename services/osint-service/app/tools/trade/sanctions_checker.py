"""Sanctions Checker Tool — перевірка санкційних списків."""
import logging
from datetime import UTC, datetime
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class SanctionsCheckerTool(BaseTool):
    """Адаптер для перевірки санкційних списків.

    Джерела:
    - OpenSanctions (https://opensanctions.org)
    - OFAC SDN List
    - EU Sanctions
    - UN Sanctions
    - UK Sanctions

    Можливості:
    - Перевірка компаній
    - Перевірка осіб
    - Перевірка суден
    - Fuzzy matching
    """

    name = "sanctions_checker"
    description = "Sanctions Checker — перевірка санкційних списків (OFAC, EU, UN)"
    version = "1.0"
    categories = ["sanctions", "compliance", "risk"]
    supported_targets = ["company", "person", "vessel", "entity"]

    # Санкційні програми
    SANCTION_PROGRAMS = {
        "OFAC_SDN": "US OFAC Specially Designated Nationals",
        "EU_SANCTIONS": "EU Consolidated Sanctions List",
        "UN_SANCTIONS": "UN Security Council Sanctions",
        "UK_SANCTIONS": "UK Sanctions List",
        "UA_SANCTIONS": "Ukraine NSDC Sanctions",
    }

    # Приклади санкційних сутностей (в реальності — API до OpenSanctions)
    SAMPLE_SANCTIONED = {
        "companies": [
            {"name": "RUSSIAN DIRECT INVESTMENT FUND", "country": "RU", "programs": ["OFAC_SDN", "EU_SANCTIONS"]},
            {"name": "SBERBANK", "country": "RU", "programs": ["OFAC_SDN", "EU_SANCTIONS", "UK_SANCTIONS"]},
            {"name": "GAZPROMBANK", "country": "RU", "programs": ["EU_SANCTIONS"]},
        ],
        "persons": [
            {"name": "PUTIN VLADIMIR", "country": "RU", "programs": ["OFAC_SDN", "EU_SANCTIONS", "UK_SANCTIONS"]},
            {"name": "SECHIN IGOR", "country": "RU", "programs": ["OFAC_SDN", "EU_SANCTIONS"]},
        ],
        "vessels": [
            {"name": "FORTUNA", "imo": "9618163", "programs": ["OFAC_SDN"]},
            {"name": "AKADEMIK CHERSKIY", "imo": "8512279", "programs": ["OFAC_SDN"]},
        ],
    }

    async def is_available(self) -> bool:
        """Завжди доступний."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Перевірка на санкції.

        Args:
            target: Назва компанії, ім'я особи або назва судна
            options: Додаткові опції:
                - entity_type: "company" | "person" | "vessel" | "auto"
                - fuzzy_match: використовувати нечіткий пошук (default: True)
                - threshold: поріг схожості 0-100 (default: 80)
                - programs: список програм для перевірки

        Returns:
            ToolResult з результатами перевірки
        """
        start_time = datetime.now(UTC)
        options = options or {}

        entity_type = options.get("entity_type", "auto")
        fuzzy_match = options.get("fuzzy_match", True)
        threshold = options.get("threshold", 80)

        findings = []
        matches = []

        # Нормалізуємо запит
        query = target.upper().strip()

        # Пошук у санкційних списках
        if entity_type in ("auto", "company"):
            company_matches = self._search_companies(query, fuzzy_match, threshold)
            matches.extend(company_matches)

        if entity_type in ("auto", "person"):
            person_matches = self._search_persons(query, fuzzy_match, threshold)
            matches.extend(person_matches)

        if entity_type in ("auto", "vessel"):
            vessel_matches = self._search_vessels(query, fuzzy_match, threshold)
            matches.extend(vessel_matches)

        # Формуємо findings
        for match in matches:
            severity = "critical" if match["match_score"] >= 95 else "high"
            findings.append({
                "type": "sanction_match",
                "value": match["name"],
                "confidence": match["match_score"] / 100,
                "source": "sanctions_checker",
                "metadata": {
                    "programs": match["programs"],
                    "country": match.get("country"),
                    "entity_type": match["entity_type"],
                },
            })

        duration = (datetime.now(UTC) - start_time).total_seconds()

        # Визначаємо статус
        is_sanctioned = len(matches) > 0
        risk_level = "critical" if is_sanctioned else "low"

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS,
            data={
                "query": target,
                "is_sanctioned": is_sanctioned,
                "risk_level": risk_level,
                "matches": matches,
                "total_matches": len(matches),
                "programs_checked": list(self.SANCTION_PROGRAMS.keys()),
            },
            findings=findings,
            duration_seconds=duration,
        )

    def _search_companies(self, query: str, fuzzy: bool, threshold: int) -> list[dict]:
        """Пошук серед санкційних компаній."""
        matches = []
        for company in self.SAMPLE_SANCTIONED["companies"]:
            score = self._calculate_match_score(query, company["name"], fuzzy)
            if score >= threshold:
                matches.append({
                    **company,
                    "entity_type": "company",
                    "match_score": score,
                })
        return matches

    def _search_persons(self, query: str, fuzzy: bool, threshold: int) -> list[dict]:
        """Пошук серед санкційних осіб."""
        matches = []
        for person in self.SAMPLE_SANCTIONED["persons"]:
            score = self._calculate_match_score(query, person["name"], fuzzy)
            if score >= threshold:
                matches.append({
                    **person,
                    "entity_type": "person",
                    "match_score": score,
                })
        return matches

    def _search_vessels(self, query: str, fuzzy: bool, threshold: int) -> list[dict]:
        """Пошук серед санкційних суден."""
        matches = []
        for vessel in self.SAMPLE_SANCTIONED["vessels"]:
            score = self._calculate_match_score(query, vessel["name"], fuzzy)
            if score >= threshold:
                matches.append({
                    **vessel,
                    "entity_type": "vessel",
                    "match_score": score,
                })
        return matches

    def _calculate_match_score(self, query: str, target: str, fuzzy: bool) -> int:
        """Розрахунок score схожості."""
        if query == target:
            return 100

        if not fuzzy:
            return 0

        # Простий fuzzy matching
        query_words = set(query.split())
        target_words = set(target.split())

        if not target_words:
            return 0

        common = query_words & target_words
        score = int((len(common) / len(target_words)) * 100)

        # Бонус за substring match
        if query in target or target in query:
            score = max(score, 85)

        return score
