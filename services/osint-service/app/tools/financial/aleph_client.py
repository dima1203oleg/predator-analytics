"""Aleph Tool — OCCRP платформа для розслідувань."""
import logging
from datetime import datetime, UTC
from typing import Any

import httpx

from app.tools.base import BaseTool, ToolResult, ToolStatus

logger = logging.getLogger(__name__)


class AlephTool(BaseTool):
    """Адаптер для OCCRP Aleph.

    Aleph — найпотужніша платформа для журналістських розслідувань.
    Використовується для Panama Papers, Paradise Papers, Pandora Papers.

    Можливості:
    - Пошук документів
    - Аналіз компаній
    - Зв'язки між людьми
    - Фінансові транзакції
    - Cross-reference datasets

    GitHub: https://github.com/alephdata/aleph
    API: https://aleph.occrp.org/api/2/
    """

    name = "aleph"
    description = "OCCRP Aleph — платформа для розслідувань (Panama Papers)"
    version = "3.0"
    categories = ["financial", "investigation", "documents"]
    supported_targets = ["company", "person", "document"]

    def __init__(self, api_key: str = "", timeout: int = 60):
        """Ініціалізація.

        Args:
            api_key: API ключ Aleph (OCCRP)
            timeout: Таймаут запитів
        """
        super().__init__(timeout)
        self.api_key = api_key
        self.base_url = "https://aleph.occrp.org/api/2"

    async def is_available(self) -> bool:
        """Перевірка доступності API."""
        # Aleph має публічний API для базового пошуку
        return True

    async def run(self, target: str, options: dict[str, Any] | None = None) -> ToolResult:
        """Пошук в Aleph.

        Args:
            target: Назва компанії, ім'я особи або ключові слова
            options: Додаткові опції:
                - entity_type: "company" | "person" | "document"
                - collections: список колекцій для пошуку
                - limit: максимум результатів (default: 50)

        Returns:
            ToolResult з результатами пошуку
        """
        start_time = datetime.now(UTC)
        options = options or {}

        entity_type = options.get("entity_type", "any")
        limit = options.get("limit", 50)

        findings = []
        entities = []
        documents = []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {}
                if self.api_key:
                    headers["Authorization"] = f"ApiKey {self.api_key}"

                # Пошук entities
                response = await client.get(
                    f"{self.base_url}/entities",
                    params={
                        "q": target,
                        "limit": limit,
                    },
                    headers=headers,
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])

                    for result in results:
                        schema = result.get("schema", "")
                        properties = result.get("properties", {})

                        entity = {
                            "id": result.get("id"),
                            "name": properties.get("name", [""])[0] if properties.get("name") else result.get("id"),
                            "schema": schema,
                            "collection": result.get("collection", {}).get("label"),
                            "countries": properties.get("country", []),
                            "properties": properties,
                        }

                        if schema in ("Company", "Organization", "LegalEntity"):
                            entities.append(entity)
                            findings.append({
                                "type": "company",
                                "value": entity["name"],
                                "confidence": 0.85,
                                "source": "aleph",
                                "metadata": {
                                    "aleph_id": entity["id"],
                                    "collection": entity["collection"],
                                    "countries": entity["countries"],
                                },
                            })
                        elif schema == "Person":
                            entities.append(entity)
                            findings.append({
                                "type": "person",
                                "value": entity["name"],
                                "confidence": 0.85,
                                "source": "aleph",
                                "metadata": entity,
                            })
                        elif schema == "Document":
                            documents.append(entity)

                # Пошук документів
                doc_response = await client.get(
                    f"{self.base_url}/documents",
                    params={
                        "q": target,
                        "limit": min(limit, 20),
                    },
                    headers=headers,
                )

                if doc_response.status_code == 200:
                    doc_data = doc_response.json()
                    for doc in doc_data.get("results", []):
                        documents.append({
                            "id": doc.get("id"),
                            "title": doc.get("title"),
                            "file_name": doc.get("file_name"),
                            "collection": doc.get("collection", {}).get("label"),
                            "countries": doc.get("countries", []),
                        })

        except httpx.TimeoutException:
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.TIMEOUT,
                errors=["Таймаут запиту до Aleph"],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )
        except Exception as e:
            logger.error(f"Aleph error: {e}")
            return ToolResult(
                tool_name=self.name,
                status=ToolStatus.FAILED,
                errors=[str(e)],
                duration_seconds=(datetime.now(UTC) - start_time).total_seconds(),
            )

        duration = (datetime.now(UTC) - start_time).total_seconds()

        return ToolResult(
            tool_name=self.name,
            status=ToolStatus.SUCCESS if (entities or documents) else ToolStatus.PARTIAL,
            data={
                "query": target,
                "entities": entities,
                "documents": documents,
                "total_entities": len(entities),
                "total_documents": len(documents),
            },
            findings=findings,
            duration_seconds=duration,
        )
