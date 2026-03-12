"""OpenSearch Sink — PREDATOR Analytics v55.1 Ironclad.

Індексація документів для повнотекстового пошуку OSINT.
"""
import os
from typing import Any

import httpx

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.opensearch")


class OpenSearchSink:
    """Сінк для індексації в OpenSearch."""

    INDEX_NAME = "predator-declarations"

    def __init__(self) -> None:
        """Ініціалізація OpenSearch клієнта."""
        self.hosts = os.getenv("OPENSEARCH_HOSTS", "https://localhost:9200")
        self.username = os.getenv("OPENSEARCH_USERNAME", "admin")
        self.password = os.getenv("OPENSEARCH_PASSWORD", "admin")
        self.verify_ssl = os.getenv("OPENSEARCH_TLS_VERIFY", "false").lower() == "true"

        self._client: httpx.AsyncClient | None = None
        self._initialized = False

    async def _get_client(self) -> httpx.AsyncClient:
        """Отримує або створює HTTP клієнт."""
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.hosts,
                auth=(self.username, self.password),
                verify=self.verify_ssl,
                timeout=30.0,
            )
        return self._client

    async def _ensure_index(self, tenant_id: str) -> None:
        """Створює індекс якщо не існує."""
        if self._initialized:
            return

        index_name = f"{self.INDEX_NAME}-{tenant_id}"
        client = await self._get_client()

        try:
            # Перевіряємо чи існує індекс
            response = await client.head(f"/{index_name}")
            if response.status_code == 404:
                # Створюємо індекс з маппінгом
                mapping = {
                    "settings": {
                        "number_of_shards": 1,
                        "number_of_replicas": 0,
                        "analysis": {
                            "analyzer": {
                                "ukrainian": {
                                    "type": "custom",
                                    "tokenizer": "standard",
                                    "filter": ["lowercase", "ukrainian_stop"],
                                },
                            },
                            "filter": {
                                "ukrainian_stop": {
                                    "type": "stop",
                                    "stopwords": "_ukrainian_",
                                },
                            },
                        },
                    },
                    "mappings": {
                        "properties": {
                            "declaration_number": {"type": "keyword"},
                            "declaration_date": {"type": "date"},
                            "company_edrpou": {"type": "keyword"},
                            "ueid": {"type": "keyword"},
                            "product_description": {
                                "type": "text",
                                "analyzer": "ukrainian",
                            },
                            "uktzed_code": {"type": "keyword"},
                            "customs_value": {"type": "float"},
                            "weight": {"type": "float"},
                            "country_origin": {"type": "keyword"},
                            "customs_post": {"type": "keyword"},
                            "tenant_id": {"type": "keyword"},
                            "job_id": {"type": "keyword"},
                            "ingested_at": {"type": "date"},
                        },
                    },
                }
                await client.put(f"/{index_name}", json=mapping)
                logger.info(f"Created OpenSearch index: {index_name}")

            self._initialized = True
        except Exception as e:
            logger.warning(f"Failed to ensure index: {e}")

    async def index_document(
        self, index: str, doc_id: str, document: dict[str, Any]
    ) -> None:
        """Індексація одного документа."""
        client = await self._get_client()
        try:
            await client.put(f"/{index}/_doc/{doc_id}", json=document)
        except Exception as e:
            logger.error(f"Failed to index document {doc_id}: {e}")

    async def bulk_index(
        self, documents: list[dict[str, Any]], tenant_id: str
    ) -> None:
        """Bulk індексація документів."""
        if not documents:
            return

        await self._ensure_index(tenant_id)

        index_name = f"{self.INDEX_NAME}-{tenant_id}"
        client = await self._get_client()

        # Формуємо bulk request
        bulk_body = ""
        for doc in documents:
            doc_id = doc.get("_record_hash", doc.get("declaration_number", ""))
            # Готуємо документ для індексації
            index_doc = {
                "declaration_number": doc.get("declaration_number"),
                "declaration_date": doc.get("declaration_date"),
                "company_edrpou": doc.get("company_edrpou"),
                "ueid": doc.get("ueid"),
                "product_description": doc.get("product_description"),
                "uktzed_code": doc.get("uktzed_code"),
                "customs_value": doc.get("customs_value"),
                "weight": doc.get("weight"),
                "country_origin": doc.get("country_origin"),
                "customs_post": doc.get("customs_post"),
                "tenant_id": tenant_id,
                "job_id": doc.get("_job_id"),
                "ingested_at": doc.get("_ingested_at"),
            }

            # NDJSON формат для bulk API
            bulk_body += f'{{"index": {{"_index": "{index_name}", "_id": "{doc_id}"}}}}\n'
            bulk_body += f"{self._json_dumps(index_doc)}\n"

        try:
            response = await client.post(
                "/_bulk",
                content=bulk_body,
                headers={"Content-Type": "application/x-ndjson"},
            )
            if response.status_code >= 400:
                logger.error(f"Bulk index failed: {response.text}")
            else:
                logger.debug(f"Bulk indexed {len(documents)} documents")
        except Exception as e:
            logger.error(f"Bulk index error: {e}")

    def _json_dumps(self, obj: dict[str, Any]) -> str:
        """Серіалізація в JSON без None значень."""
        import json

        return json.dumps(
            {k: v for k, v in obj.items() if v is not None},
            ensure_ascii=False,
            default=str,
        )

    async def close(self) -> None:
        """Закриття клієнта."""
        if self._client:
            await self._client.aclose()
            self._client = None
