"""OpenSearch Service — PREDATOR Analytics v61.0-ELITE.

Повнотекстовий пошук, індексація декларацій та компаній.
Tenant-ізоляція через окремі індекси: {entity}-{tenant_id}.

Модуль відповідає:
- FR-003: Full-text search з підсвіткою результатів
- FR-044: Індексація при інгестії (Phase 3)
- HR-07: Конкретні поля (ніколи SELECT *)
"""
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.config import get_settings
from predator_common.circuit_breaker import CircuitBreaker
from predator_common.logging import get_logger

logger = get_logger("opensearch_service")
settings = get_settings()

_os_breaker = CircuitBreaker(
    name="opensearch",
    failure_threshold=settings.CB_FAILURE_THRESHOLD,
    reset_timeout_s=settings.CB_RESET_TIMEOUT_S,
)


@dataclass
class SearchHit:
    """Результат пошуку з OpenSearch."""

    id: str
    index: str
    score: float
    source: dict[str, Any]
    highlights: dict[str, list[str]] = field(default_factory=dict)


@dataclass
class SearchResult:
    """Відповідь на пошуковий запит."""

    total: int
    hits: list[SearchHit]
    took_ms: int
    query: str


class OpenSearchService:
    """Клієнт OpenSearch з Circuit Breaker та tenant-ізоляцією."""

    def __init__(self) -> None:
        self._base_url = settings.OPENSEARCH_HOSTS.rstrip("/")
        self._auth = (settings.OPENSEARCH_USERNAME, settings.OPENSEARCH_PASSWORD)
        self._verify_ssl = settings.OPENSEARCH_TLS_VERIFY

    def _index_name(self, entity: str, tenant_id: str) -> str:
        """Формування імені індексу з tenant-ізоляцією."""
        safe_tenant = tenant_id.replace("-", "")[:16]
        return f"{entity}-{safe_tenant}"

    async def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        timeout: float = 30.0,
    ) -> dict[str, Any]:
        """Базовий HTTP запит до OpenSearch з Circuit Breaker."""
        if not _os_breaker.allow_request():
            logger.warning("OpenSearch Circuit Breaker OPEN — запит відхилено")
            return {"error": "OpenSearch тимчасово недоступний"}

        try:
            async with httpx.AsyncClient(verify=self._verify_ssl) as client:
                response = await client.request(
                    method,
                    f"{self._base_url}{path}",
                    json=body,
                    auth=self._auth,
                    timeout=timeout,
                    headers={"Content-Type": "application/json"},
                )

                if response.status_code < 400:
                    _os_breaker.record_success()
                    return response.json()

                _os_breaker.record_failure()
                logger.error(
                    f"OpenSearch error: {response.status_code}",
                    extra={"body": response.text[:500]},
                )
                return {"error": f"HTTP {response.status_code}", "detail": response.text[:200]}
        except Exception as e:
            _os_breaker.record_failure()
            logger.error(f"OpenSearch connection failed: {e!s}")
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Управління індексами
    # ------------------------------------------------------------------

    async def ensure_index(
        self,
        entity: str,
        tenant_id: str,
        mappings: dict[str, Any] | None = None,
    ) -> bool:
        """Створити індекс якщо він не існує."""
        index = self._index_name(entity, tenant_id)

        # Перевірити існування
        check = await self._request("HEAD", f"/{index}")
        if "error" not in check:
            return True

        # Створити з маппінгами
        default_mappings = mappings or self._default_mappings(entity)
        body: dict[str, Any] = {
            "settings": {
                "number_of_shards": 1,
                "number_of_replicas": 0,
                "analysis": {
                    "analyzer": {
                        "ukrainian": {
                            "type": "custom",
                            "tokenizer": "standard",
                            "filter": ["lowercase", "asciifolding"],
                        }
                    }
                },
            },
            "mappings": default_mappings,
        }

        result = await self._request("PUT", f"/{index}", body)
        if "error" not in result:
            logger.info(f"Індекс створено: {index}")
            return True

        logger.error(f"Помилка створення індексу {index}: {result}")
        return False

    def _default_mappings(self, entity: str) -> dict[str, Any]:
        """Маппінги за замовчуванням для різних типів сутностей."""
        if entity == "declarations":
            return {
                "properties": {
                    "declaration_number": {"type": "keyword"},
                    "declaration_date": {"type": "date"},
                    "importer_name": {"type": "text", "analyzer": "ukrainian"},
                    "importer_edrpou": {"type": "keyword"},
                    "exporter_name": {"type": "text", "analyzer": "ukrainian"},
                    "goods_description": {"type": "text", "analyzer": "ukrainian"},
                    "uktzed_code": {"type": "keyword"},
                    "customs_value_usd": {"type": "float"},
                    "country_origin": {"type": "keyword"},
                    "tenant_id": {"type": "keyword"},
                    "ueid": {"type": "keyword"},
                    "created_at": {"type": "date"},
                }
            }
        if entity == "companies":
            return {
                "properties": {
                    "name": {"type": "text", "analyzer": "ukrainian"},
                    "name_normalized": {"type": "keyword"},
                    "edrpou": {"type": "keyword"},
                    "ueid": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "sector": {"type": "keyword"},
                    "cers_score": {"type": "integer"},
                    "cers_level": {"type": "keyword"},
                    "address": {"type": "text", "analyzer": "ukrainian"},
                    "tenant_id": {"type": "keyword"},
                    "created_at": {"type": "date"},
                }
            }
        # Fallback — динамічний маппінг
        return {"dynamic": True}

    # ------------------------------------------------------------------
    # Індексація документів
    # ------------------------------------------------------------------

    async def index_document(
        self,
        entity: str,
        tenant_id: str,
        doc_id: str,
        document: dict[str, Any],
    ) -> bool:
        """Індексація одного документа."""
        index = self._index_name(entity, tenant_id)
        result = await self._request("PUT", f"/{index}/_doc/{doc_id}", document)
        return "error" not in result

    async def bulk_index(
        self,
        entity: str,
        tenant_id: str,
        documents: list[tuple[str, dict[str, Any]]],
    ) -> dict[str, int]:
        """Масова індексація документів (bulk API).

        Args:
            documents: Список (doc_id, document) кортежів.

        Returns:
            {"indexed": N, "errors": M}
        """
        if not documents:
            return {"indexed": 0, "errors": 0}

        index = self._index_name(entity, tenant_id)

        # Формуємо NDJSON для bulk API
        lines: list[str] = []
        for doc_id, doc in documents:
            import orjson
            action = orjson.dumps({"index": {"_index": index, "_id": doc_id}}).decode()
            data = orjson.dumps(doc).decode()
            lines.append(action)
            lines.append(data)

        ndjson_body = "\n".join(lines) + "\n"

        if not _os_breaker.allow_request():
            return {"indexed": 0, "errors": len(documents)}

        try:
            async with httpx.AsyncClient(verify=self._verify_ssl) as client:
                response = await client.post(
                    f"{self._base_url}/_bulk",
                    content=ndjson_body,
                    auth=self._auth,
                    timeout=60.0,
                    headers={"Content-Type": "application/x-ndjson"},
                )

                if response.status_code < 400:
                    _os_breaker.record_success()
                    result = response.json()
                    errors = sum(1 for item in result.get("items", []) if item.get("index", {}).get("error"))
                    return {
                        "indexed": len(documents) - errors,
                        "errors": errors,
                    }

                _os_breaker.record_failure()
                return {"indexed": 0, "errors": len(documents)}
        except Exception as e:
            _os_breaker.record_failure()
            logger.error(f"Bulk index error: {e!s}")
            return {"indexed": 0, "errors": len(documents)}

    # ------------------------------------------------------------------
    # Пошук
    # ------------------------------------------------------------------

    async def search(
        self,
        entity: str,
        tenant_id: str,
        query: str,
        fields: list[str] | None = None,
        size: int = 20,
        from_: int = 0,
        filters: dict[str, Any] | None = None,
    ) -> SearchResult:
        """Повнотекстовий пошук з підсвіткою та фільтрами."""
        index = self._index_name(entity, tenant_id)
        search_fields = fields or ["name", "goods_description", "importer_name", "exporter_name"]

        # Побудова запиту
        must: list[dict[str, Any]] = [
            {
                "multi_match": {
                    "query": query,
                    "fields": search_fields,
                    "type": "best_fields",
                    "fuzziness": "AUTO",
                }
            }
        ]

        # Додаткові фільтри
        filter_clauses: list[dict[str, Any]] = []
        if filters:
            for fk, fv in filters.items():
                if isinstance(fv, list):
                    filter_clauses.append({"terms": {fk: fv}})
                else:
                    filter_clauses.append({"term": {fk: fv}})

        body: dict[str, Any] = {
            "query": {
                "bool": {
                    "must": must,
                    "filter": filter_clauses,
                }
            },
            "highlight": {
                "fields": {f: {"fragment_size": 150} for f in search_fields},
                "pre_tags": ["<mark>"],
                "post_tags": ["</mark>"],
            },
            "size": size,
            "from": from_,
            "_source": True,
        }

        result = await self._request("POST", f"/{index}/_search", body)

        if "error" in result:
            return SearchResult(total=0, hits=[], took_ms=0, query=query)

        hits_data = result.get("hits", {})
        total = hits_data.get("total", {}).get("value", 0)
        took = result.get("took", 0)

        hits = [
            SearchHit(
                id=h["_id"],
                index=h["_index"],
                score=h.get("_score", 0.0),
                source=h.get("_source", {}),
                highlights=h.get("highlight", {}),
            )
            for h in hits_data.get("hits", [])
        ]

        return SearchResult(total=total, hits=hits, took_ms=took, query=query)


# Singleton
opensearch_service = OpenSearchService()
