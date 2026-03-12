"""OpenOwnership Tool — база реальних бенефіціарів компаній."""
import logging
from datetime import datetime, UTC
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class OpenOwnershipTool(BaseTool):
    """Адаптер для OpenOwnership.

    OpenOwnership — глобальна база бенефіціарних власників.
    Ключовий інструмент для виявлення реальних власників компаній.

    Можливості:
    - Пошук бенефіціарів
    - Ланцюги власності
    - Офшорні структури
    - Директори та акціонери

    GitHub: https://github.com/openownership
    API: https://register.openownership.org/api/v1/
    """

    name = "open_ownership"
    description = "OpenOwnership — база реальних бенефіціарів компаній"
    version = "1.0"
    categories = ["financial", "ownership", "beneficial_owners"]
    supported_targets = ["company", "person"]

    def __init__(self, api_key: str = "", timeout: int = 30):
        """Ініціалізація."""
        super().__init__(timeout)
        self.api_key = api_key
        self.base_url = "https://register.openownership.org/api/v1"

    async def is_available(self) -> bool:
        """Перевірка доступності."""
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук бенефіціарів.

        Args:
            target: Назва компанії або ім'я особи
            options: Додаткові опції:
                - search_type: "company" | "person"
                - country: код країни (ISO 2)
                - include_relationships: включати зв'язки (default: True)

        Returns:
            ToolResult з бенефіціарами
        """
        start_time = datetime.now(UTC)
        options = options or {}

        search_type = options.get("search_type", "company")
        include_relationships = options.get("include_relationships", True)

        findings = []
        beneficial_owners = []
        ownership_chains = []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {}
                if self.api_key:
                    headers["Authorization"] = f"Token {self.api_key}"

                # Пошук entities
                response = await client.get(
                    f"{self.base_url}/entities",
                    params={
                        "q": target,
                        "type": search_type,
                    },
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()

                    for entity in data.get("results", []):
                        entity_type = entity.get("type")
                        entity_data = {
                            "id": entity.get("id"),
                            "name": entity.get("name"),
                            "type": entity_type,
                            "jurisdiction": entity.get("jurisdiction_code"),
                            "company_number": entity.get("company_number"),
                            "incorporation_date": entity.get("incorporation_date"),
                            "dissolution_date": entity.get("dissolution_date"),
                            "addresses": entity.get("addresses", []),
                        }

                        if entity_type == "legal-entity":
                            # Отримуємо бенефіціарів
                            if include_relationships:
                                bo_response = await client.get(
                                    f"{self.base_url}/entities/{entity['id']}/relationships",
                                    headers=headers,
                                )
                                if bo_response.status_code == 200:
                                    relationships = bo_response.json().get("results", [])
                                    for rel in relationships:
                                        if rel.get("relationship_type") == "beneficial_owner":
                                            owner = rel.get("target", {})
                                            beneficial_owners.append({
                                                "name": owner.get("name"),
                                                "nationality": owner.get("nationality"),
                                                "ownership_percentage": rel.get("interests", [{}])[0].get("share_percentage"),
                                                "start_date": rel.get("started_date"),
                                            })

                                            findings.append({
                                                "type": "beneficial_owner",
                                                "value": owner.get("name"),
                                                "confidence": 0.9,
                                                "source": "open_ownership",
                                                "metadata": {
                                                    "company": entity_data["name"],
                                                    "ownership_pct": rel.get("interests", [{}])[0].get("share_percentage"),
                                                },
                                            })

                        findings.append({
                            "type": "company" if entity_type == "legal-entity" else "person",
                            "value": entity_data["name"],
                            "confidence": 0.85,
                            "source": "open_ownership",
                            "metadata": entity_data,
                        })

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до OpenOwnership"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            logger.error(f"OpenOwnership error: {e}")

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if findings else ToolStatus.PARTIAL,
            data={
                "query": target,
                "beneficial_owners": beneficial_owners,
                "ownership_chains": ownership_chains,
                "total_owners": len(beneficial_owners),
            },
            findings=findings,
            duration_seconds=duration,
        )
