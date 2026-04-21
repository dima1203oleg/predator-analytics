"""Qdrant Vector Store Service — PREDATOR Analytics v58.2-WRAITH.

Семантичний пошук та RAG (Retrieval-Augmented Generation).

Модуль відповідає:
- FR-045: Семантичний пошук по декларціям та документам
- FR-046: Knowledge Base для RAG pipeline
- TZ §5.3: Vector store з cosine similarity
"""
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.config import get_settings
from predator_common.circuit_breaker import CircuitBreaker
from predator_common.logging import get_logger

logger = get_logger("qdrant_service")
settings = get_settings()

_qdrant_breaker = CircuitBreaker(
    name="qdrant",
    failure_threshold=settings.CB_FAILURE_THRESHOLD,
    reset_timeout_s=settings.CB_RESET_TIMEOUT_S,
)

# Канонічні назви колекцій
COLLECTION_DECLARATIONS = "declarations_vectors"
COLLECTION_DOCUMENTS = "documents_vectors"
COLLECTION_KNOWLEDGE = "knowledge_base"

# Розмірність embeddings (nomic-embed-text → 768)
DEFAULT_VECTOR_DIM = 768


@dataclass
class VectorSearchHit:
    """Результат векторного пошуку."""

    id: str
    score: float
    payload: dict[str, Any]
    version: int = 0


@dataclass
class VectorSearchResult:
    """Відповідь векторного пошуку."""

    hits: list[VectorSearchHit]
    total: int


class QdrantService:
    """Async Qdrant client з Circuit Breaker та tenant-ізоляцією.

    Використовує REST API для сумісності без додаткових залежностей.
    """

    def __init__(self) -> None:
        self._base_url = settings.QDRANT_URL.rstrip("/")
        self._api_key = settings.QDRANT_API_KEY

    def _headers(self) -> dict[str, str]:
        """Заголовки для автентифікації."""
        headers: dict[str, str] = {"Content-Type": "application/json"}
        if self._api_key:
            headers["api-key"] = self._api_key
        return headers

    async def _request(
        self,
        method: str,
        path: str,
        body: dict[str, Any] | None = None,
        timeout: float = 30.0,
    ) -> dict[str, Any]:
        """Базовий HTTP запит до Qdrant з Circuit Breaker."""
        if not _qdrant_breaker.allow_request():
            logger.warning("Qdrant Circuit Breaker OPEN — запит відхилено")
            return {"error": "Qdrant тимчасово недоступний"}

        try:
            async with httpx.AsyncClient() as client:
                response = await client.request(
                    method,
                    f"{self._base_url}{path}",
                    json=body,
                    headers=self._headers(),
                    timeout=timeout,
                )

                if response.status_code < 400:
                    _qdrant_breaker.record_success()
                    return response.json()

                _qdrant_breaker.record_failure()
                logger.error(
                    f"Qdrant error: {response.status_code}",
                    extra={"body": response.text[:300]},
                )
                return {"error": f"HTTP {response.status_code}"}
        except Exception as e:
            _qdrant_breaker.record_failure()
            logger.error(f"Qdrant connection failed: {e!s}")
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Управління колекціями
    # ------------------------------------------------------------------

    async def ensure_collection(
        self,
        collection: str,
        vector_dim: int = DEFAULT_VECTOR_DIM,
    ) -> bool:
        """Створити колекцію якщо вона не існує."""
        check = await self._request("GET", f"/collections/{collection}")
        if "error" not in check and check.get("result"):
            return True

        body = {
            "vectors": {
                "size": vector_dim,
                "distance": "Cosine",
            }
        }

        result = await self._request("PUT", f"/collections/{collection}", body)
        if "error" not in result:
            logger.info(f"Qdrant колекція створена: {collection} (dim={vector_dim})")

            # Створити payload індекси для фільтрації
            await self._create_payload_indexes(collection)
            return True

        logger.error(f"Помилка створення колекції {collection}: {result}")
        return False

    async def _create_payload_indexes(self, collection: str) -> None:
        """Створити індекси для payload полів (tenant_id, entity_type)."""
        for field_name, field_schema in [
            ("tenant_id", {"type": "keyword"}),
            ("entity_type", {"type": "keyword"}),
            ("ueid", {"type": "keyword"}),
        ]:
            await self._request(
                "PUT",
                f"/collections/{collection}/index",
                {"field_name": field_name, "field_schema": field_schema},
            )

    async def init_collections(self) -> None:
        """Ініціалізувати всі канонічні колекції."""
        for coll in [COLLECTION_DECLARATIONS, COLLECTION_DOCUMENTS, COLLECTION_KNOWLEDGE]:
            await self.ensure_collection(coll)

    # ------------------------------------------------------------------
    # Upsert / Index
    # ------------------------------------------------------------------

    async def upsert_vectors(
        self,
        collection: str,
        points: list[dict[str, Any]],
    ) -> bool:
        """Upsert векторних точок у колекцію.

        Args:
            points: Список точок у форматі:
                [{"id": "...", "vector": [...], "payload": {...}}]
        """
        if not points:
            return True

        body = {"points": points}
        result = await self._request("PUT", f"/collections/{collection}/points", body)
        return "error" not in result

    async def upsert_single(
        self,
        collection: str,
        point_id: str,
        vector: list[float],
        payload: dict[str, Any],
    ) -> bool:
        """Upsert однієї точки."""
        return await self.upsert_vectors(
            collection,
            [{"id": point_id, "vector": vector, "payload": payload}],
        )

    # ------------------------------------------------------------------
    # Семантичний пошук
    # ------------------------------------------------------------------

    async def search(
        self,
        collection: str,
        query_vector: list[float],
        tenant_id: str,
        limit: int = 10,
        score_threshold: float = 0.5,
        additional_filters: dict[str, Any] | None = None,
    ) -> VectorSearchResult:
        """Семантичний пошук з tenant-фільтрацією.

        Args:
            query_vector: Embedding запиту
            tenant_id: Обов'язковий tenant для ізоляції
            limit: Максимум результатів
            score_threshold: Мінімальний поріг cosine similarity
            additional_filters: Додаткові Qdrant filter conditions
        """
        # Tenant-ізоляція через filter
        must_conditions: list[dict[str, Any]] = [
            {"key": "tenant_id", "match": {"value": tenant_id}},
        ]

        # Додаткові фільтри
        if additional_filters:
            for key, value in additional_filters.items():
                must_conditions.append({"key": key, "match": {"value": value}})

        body: dict[str, Any] = {
            "vector": query_vector,
            "limit": limit,
            "score_threshold": score_threshold,
            "filter": {"must": must_conditions},
            "with_payload": True,
        }

        result = await self._request("POST", f"/collections/{collection}/points/search", body)

        if "error" in result:
            return VectorSearchResult(hits=[], total=0)

        hits_data = result.get("result", [])
        hits = [
            VectorSearchHit(
                id=str(h.get("id", "")),
                score=h.get("score", 0.0),
                payload=h.get("payload", {}),
                version=h.get("version", 0),
            )
            for h in hits_data
        ]

        return VectorSearchResult(hits=hits, total=len(hits))

    async def search_similar(
        self,
        collection: str,
        point_id: str,
        tenant_id: str,
        limit: int = 5,
    ) -> VectorSearchResult:
        """Пошук схожих точок за ID існуючої точки."""
        body: dict[str, Any] = {
            "positive": [point_id],
            "limit": limit,
            "filter": {
                "must": [{"key": "tenant_id", "match": {"value": tenant_id}}],
            },
            "with_payload": True,
        }

        result = await self._request("POST", f"/collections/{collection}/points/recommend", body)

        if "error" in result:
            return VectorSearchResult(hits=[], total=0)

        hits_data = result.get("result", [])
        hits = [
            VectorSearchHit(
                id=str(h.get("id", "")),
                score=h.get("score", 0.0),
                payload=h.get("payload", {}),
            )
            for h in hits_data
        ]

        return VectorSearchResult(hits=hits, total=len(hits))

    # ------------------------------------------------------------------
    # Видалення
    # ------------------------------------------------------------------

    async def delete_by_filter(
        self,
        collection: str,
        tenant_id: str,
        entity_ueid: str | None = None,
    ) -> bool:
        """Видалити точки за фільтром (tenant + опціональний ueid)."""
        must_conditions: list[dict[str, Any]] = [
            {"key": "tenant_id", "match": {"value": tenant_id}},
        ]
        if entity_ueid:
            must_conditions.append({"key": "ueid", "match": {"value": entity_ueid}})

        body = {"filter": {"must": must_conditions}}
        result = await self._request("POST", f"/collections/{collection}/points/delete", body)
        return "error" not in result

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    async def health_check(self) -> dict[str, Any]:
        """Перевірка стану Qdrant."""
        result = await self._request("GET", "/")
        if "error" in result:
            return {"status": "unhealthy", "error": result["error"]}
        return {"status": "healthy", "version": result.get("version", "unknown")}


# Singleton
qdrant_service = QdrantService()
