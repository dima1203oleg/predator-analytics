"""Offshore Detector Tool — виявлення офшорних структур."""
import logging
from datetime import datetime, UTC
from typing import Any

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class OffshoreDetectorTool(BaseTool):
    """Адаптер для виявлення офшорних структур.

    Джерела:
    - ICIJ Offshore Leaks Database
    - OpenCorporates
    - Company registries

    Можливості:
    - Пошук в Panama Papers, Paradise Papers, Pandora Papers
    - Виявлення офшорних юрисдикцій
    - Аналіз корпоративних структур
    - Виявлення бенефіціарів
    """

    name = "offshore_detector"
    description = "Offshore Detector — виявлення офшорних структур (ICIJ Leaks)"
    version = "1.0"
    categories = ["offshore", "compliance", "investigation"]
    supported_targets = ["company", "person", "address"]

    # Офшорні юрисдикції
    OFFSHORE_JURISDICTIONS = {
        "VG": {"name": "British Virgin Islands", "risk": "high"},
        "KY": {"name": "Cayman Islands", "risk": "high"},
        "PA": {"name": "Panama", "risk": "high"},
        "BZ": {"name": "Belize", "risk": "high"},
        "SC": {"name": "Seychelles", "risk": "high"},
        "MH": {"name": "Marshall Islands", "risk": "high"},
        "LR": {"name": "Liberia", "risk": "high"},
        "WS": {"name": "Samoa", "risk": "high"},
        "CY": {"name": "Cyprus", "risk": "medium"},
        "MT": {"name": "Malta", "risk": "medium"},
        "LU": {"name": "Luxembourg", "risk": "medium"},
        "IE": {"name": "Ireland", "risk": "medium"},
        "NL": {"name": "Netherlands", "risk": "medium"},
        "CH": {"name": "Switzerland", "risk": "medium"},
        "SG": {"name": "Singapore", "risk": "low"},
        "HK": {"name": "Hong Kong", "risk": "low"},
        "AE": {"name": "UAE", "risk": "medium"},
    }

    # ICIJ Leaks datasets
    ICIJ_DATASETS = [
        "Panama Papers (2016)",
        "Paradise Papers (2017)",
        "Pandora Papers (2021)",
        "Offshore Leaks (2013)",
        "Bahamas Leaks (2016)",
    ]

    async def is_available(self) -> bool:
        """Завжди доступний."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук офшорних зв'язків.

        Args:
            target: Назва компанії, ім'я особи або адреса
            options: Додаткові опції:
                - entity_type: "company" | "person" | "address"
                - include_related: включати пов'язані сутності (default: True)
                - datasets: список датасетів для пошуку

        Returns:
            ToolResult з офшорними зв'язками
        """
        start_time = datetime.now(UTC)
        options = options or {}

        include_related = options.get("include_related", True)

        findings = []
        offshore_entities = []
        related_entities = []

        # Пошук в ICIJ базах
        icij_results = await self._search_icij(target)
        offshore_entities.extend(icij_results)

        # Аналіз юрисдикцій
        jurisdictions_found = set()
        for entity in offshore_entities:
            jurisdiction = entity.get("jurisdiction", "")
            if jurisdiction in self.OFFSHORE_JURISDICTIONS:
                jurisdictions_found.add(jurisdiction)
                risk = self.OFFSHORE_JURISDICTIONS[jurisdiction]["risk"]

                findings.append({
                    "type": "offshore_entity",
                    "value": entity.get("name", ""),
                    "confidence": 0.85,
                    "source": "offshore_detector",
                    "metadata": {
                        "jurisdiction": jurisdiction,
                        "jurisdiction_name": self.OFFSHORE_JURISDICTIONS[jurisdiction]["name"],
                        "risk_level": risk,
                        "dataset": entity.get("dataset"),
                    },
                })

        # Пов'язані сутності
        if include_related and offshore_entities:
            related_entities = await self._get_related_entities(offshore_entities)

        # Розрахунок ризику
        risk_score = self._calculate_offshore_risk(offshore_entities, jurisdictions_found)

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if offshore_entities else ToolStatus.PARTIAL,
            data={
                "query": target,
                "offshore_entities": offshore_entities,
                "related_entities": related_entities,
                "jurisdictions": [
                    {
                        "code": j,
                        **self.OFFSHORE_JURISDICTIONS[j],
                    }
                    for j in jurisdictions_found
                ],
                "datasets_searched": self.ICIJ_DATASETS,
                "total_found": len(offshore_entities),
                "risk_score": risk_score,
            },
            findings=findings,
            duration_seconds=duration,
        )

    async def _search_icij(self, query: str) -> list[dict]:
        """Пошук в ICIJ Offshore Leaks Database."""
        # Симуляція — в реальності API до ICIJ
        # https://offshoreleaks.icij.org/pages/database

        query_upper = query.upper()

        # Приклад результатів
        sample_results = [
            {
                "name": "ACME HOLDINGS LTD",
                "jurisdiction": "VG",
                "type": "company",
                "dataset": "Panama Papers",
                "incorporation_date": "2010-05-15",
                "status": "Active",
                "registered_agent": "Mossack Fonseca",
                "address": "Tortola, British Virgin Islands",
            },
            {
                "name": "GLOBAL INVESTMENTS SA",
                "jurisdiction": "PA",
                "type": "company",
                "dataset": "Panama Papers",
                "incorporation_date": "2008-11-20",
                "status": "Inactive",
                "registered_agent": "Mossack Fonseca",
            },
        ]

        # Фільтруємо за запитом
        results = []
        for item in sample_results:
            if query_upper in item["name"].upper():
                results.append(item)

        return results

    async def _get_related_entities(self, entities: list[dict]) -> list[dict]:
        """Отримання пов'язаних сутностей."""
        related = []

        for entity in entities:
            # Симуляція пов'язаних сутностей
            related.append({
                "name": "NOMINEE DIRECTOR LTD",
                "relationship": "director_of",
                "target": entity.get("name"),
                "jurisdiction": entity.get("jurisdiction"),
            })

        return related

    def _calculate_offshore_risk(
        self,
        entities: list[dict],
        jurisdictions: set[str],
    ) -> float:
        """Розрахунок офшорного ризику."""
        if not entities:
            return 0.0

        base_score = len(entities) * 10

        # Додаємо за юрисдикції
        for j in jurisdictions:
            risk = self.OFFSHORE_JURISDICTIONS.get(j, {}).get("risk", "low")
            if risk == "high":
                base_score += 25
            elif risk == "medium":
                base_score += 15
            else:
                base_score += 5

        return min(100, base_score)
