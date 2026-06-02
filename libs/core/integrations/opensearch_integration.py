"""Інтеграція з OpenSearch для повнотекстового пошуку.

Модуль для індексування документів в OpenSearch для пошуку.
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass
from typing import Any

import httpx
import orjson

logger = logging.getLogger(__name__)


@dataclass
class OpenSearchConfig:
    """Конфігурація OpenSearch."""
    url: str = "http://localhost:9200"
    index: str = "declarations"
    username: str | None = None
    password: str | None = None


class OpenSearchIntegration:
    """Інтеграція з OpenSearch."""

    def __init__(self, config: OpenSearchConfig):
        self.config = config
        self.client = httpx.AsyncClient(
            base_url=config.url,
            auth=(config.username, config.password) if config.username else None,
            timeout=30.0
        )

    async def create_index(self):
        """Створити індекс в OpenSearch."""
        index_mapping = {
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "tenant_id": {"type": "keyword"},
                    "declaration_number": {"type": "text"},
                    "declaration_date": {"type": "date"},
                    "customs_post": {"type": "keyword"},
                    "uktzed_code": {"type": "keyword"},
                    "goods_description": {
                        "type": "text",
                        "fields": {
                            "keyword": {"type": "keyword"},
                            "ngram": {"type": "text", "analyzer": "ngram_analyzer"}
                        }
                    },
                    "weight_kg": {"type": "double"},
                    "value_usd": {"type": "double"},
                    "origin_country": {"type": "keyword"},
                    "destination_country": {"type": "keyword"},
                    "importer_ueid": {"type": "keyword"},
                    "importer_edrpou": {"type": "keyword"},
                    "exporter_name": {"type": "text"},
                    "declaration_type": {"type": "keyword"},
                    "regime": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            },
            "settings": {
                "analysis": {
                    "analyzer": {
                        "ngram_analyzer": {
                            "tokenizer": "ngram_tokenizer",
                            "filter": ["lowercase"]
                        }
                    },
                    "tokenizer": {
                        "ngram_tokenizer": {
                            "type": "ngram",
                            "min_gram": 2,
                            "max_gram": 3
                        }
                    }
                }
            }
        }
        
        try:
            response = await self.client.put(
                f"/{self.config.index}",
                json=index_mapping
            )
            response.raise_for_status()
            logger.info(f"Індекс {self.config.index} створений в OpenSearch")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 400:
                # Індекс може вже існувати
                logger.warning(f"Індекс {self.config.index} може вже існувати")
            else:
                logger.error(f"Помилка створення індексу: {e}")
                raise

    async def index_document(self, doc_id: str, data: dict[str, Any]) -> int:
        """Індексувати документ в OpenSearch.
        
        Args:
            doc_id: ID документа
            data: Дані документа
            
        Returns:
            Кількість індексованих документів
        """
        try:
            response = await self.client.put(
                f"/{self.config.index}/_doc/{doc_id}",
                json=data
            )
            response.raise_for_status()
            
            logger.debug(f"Документ індексовано в OpenSearch: {doc_id}")
            return 1
            
        except Exception as e:
            logger.error(f"Помилка індексування документа: {e}")
            return 0

    async def index_documents_batch(self, documents: list[tuple[str, dict[str, Any]]]) -> int:
        """Пакетне індексування документів в OpenSearch.
        
        Args:
            documents: Список кортежів (doc_id, data)
            
        Returns:
            Кількість індексованих документів
        """
        if not documents:
            return 0
        
        indexed_count = 0
        
        for doc_id, data in documents:
            indexed_count += await self.index_document(doc_id, data)
        
        logger.info(f"Індексовано {indexed_count} документів в OpenSearch")
        return indexed_count

    async def refresh_index(self):
        """Оновити індекс в OpenSearch."""
        try:
            response = await self.client.post(f"/{self.config.index}/_refresh")
            response.raise_for_status()
            logger.info(f"Індекс {self.config.index} оновлено")
        except Exception as e:
            logger.error(f"Помилка оновлення індексу: {e}")

    async def search_documents(
        self,
        query: str,
        start_date: str | None = None,
        end_date: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Пошук документів в OpenSearch.
        
        Args:
            query: Пошуковий запит
            start_date: Початкова дата
            end_date: Кінцева дата
            limit: Ліміт результатів
            
        Returns:
            Список документів
        """
        search_body = {
            "query": {
                "bool": {
                    "must": [
                        {
                            "multi_match": {
                                "query": query,
                                "fields": [
                                    "goods_description",
                                    "declaration_number",
                                    "exporter_name"
                                ],
                                "type": "best_fields"
                            }
                        }
                    ]
                }
            },
            "size": limit
        }
        
        # Додавання фільтрів по даті
        if start_date or end_date:
            range_filter = {"range": {"declaration_date": {}}}
            if start_date:
                range_filter["range"]["declaration_date"]["gte"] = start_date
            if end_date:
                range_filter["range"]["declaration_date"]["lte"] = end_date
            search_body["query"]["bool"]["must"].append(range_filter)
        
        try:
            response = await self.client.post(
                f"/{self.config.index}/_search",
                json=search_body
            )
            response.raise_for_status()
            
            result = response.json()
            hits = result.get("hits", {}).get("hits", [])
            
            documents = []
            for hit in hits:
                documents.append(hit["_source"])
            
            return documents
            
        except Exception as e:
            logger.error(f"Помилка пошуку: {e}")
            return []

    async def delete_document(self, doc_id: str) -> bool:
        """Видалити документ з OpenSearch.
        
        Args:
            doc_id: ID документа
            
        Returns:
            True якщо успішно
        """
        try:
            response = await self.client.delete(f"/{self.config.index}/_doc/{doc_id}")
            response.raise_for_status()
            
            logger.debug(f"Документ видалено з OpenSearch: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Помилка видалення документа: {e}")
            return False

    async def close(self):
        """Закрити з'єднання з OpenSearch."""
        await self.client.aclose()
        logger.info("З'єднання з OpenSearch закрито")


def get_opensearch_integration(config: OpenSearchConfig | None = None) -> OpenSearchIntegration:
    """Отримати інстанс інтеграції з OpenSearch."""
    if config is None:
        config = OpenSearchConfig(
            url=os.getenv("OPENSEARCH_URL", "http://localhost:9200"),
            index=os.getenv("OPENSEARCH_INDEX", "declarations"),
            username=os.getenv("OPENSEARCH_USERNAME"),
            password=os.getenv("OPENSEARCH_PASSWORD"),
        )
    return OpenSearchIntegration(config)
