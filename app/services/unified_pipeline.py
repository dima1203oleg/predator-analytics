from __future__ import annotations


"""Unified Data Pipeline Orchestrator.

Головний оркестратор для всіх типів джерел даних:
- Автоматичне визначення типу
- Роутинг до спеціалізованих пайплайнів
- Збагачення даних (NER, embedding, зв'язки)
- Запис до відповідних баз даних
- Валідація якості даних
"""

from datetime import UTC, datetime
from enum import StrEnum
import logging
import os
from typing import Any
import uuid


logger = logging.getLogger("pipeline.unified")


class SourceType(StrEnum):
    """Типи джерел даних."""

    EXCEL = "excel"
    CSV = "csv"
    PDF = "pdf"
    IMAGE = "image"
    WORD = "word"
    AUDIO = "audio"
    VIDEO = "video"
    TELEGRAM = "telegram"
    WEBSITE = "website"
    API = "api"
    RSS = "rss"


class DataQuality(StrEnum):
    """Рівень якості даних."""

    HIGH = "high"  # Повний комплект, перевірено
    MEDIUM = "medium"  # Базові поля заповнені
    LOW = "low"  # Мінімальні дані
    INVALID = "invalid"  # Некоректні дані


class TargetDatabase(StrEnum):
    """Цільові бази даних."""

    POSTGRESQL = "postgresql"  # Структуровані дані
    OPENSEARCH = "opensearch"  # Повнотекстовий пошук
    QDRANT = "qdrant"  # Векторна БД (embeddings)
    REDIS = "redis"  # Кеш, real-time
    MINIO = "minio"  # Файлове сховище


class PipelineStage(StrEnum):
    """Стадії пайплайну."""

    INGESTION = "ingestion"
    EXTRACTION = "extraction"
    ENRICHMENT = "enrichment"
    CLASSIFICATION = "classification"
    VALIDATION = "validation"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"


class UnifiedDataPipeline:
    """Головний оркестратор обробки даних."""

    def __init__(self):
        # Lazy imports для уникнення циклічних залежностей
        self._doc_processor = None
        self._media_processor = None
        self._telegram_pipeline = None

        # Конфігурація пайплайнів для різних джерел
        self.pipeline_configs = {
            SourceType.EXCEL: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.VALIDATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.POSTGRESQL, TargetDatabase.OPENSEARCH],
                "enrichment": ["column_types", "statistics"],
            },
            SourceType.CSV: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.VALIDATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.POSTGRESQL, TargetDatabase.OPENSEARCH],
                "enrichment": ["column_types", "statistics"],
            },
            SourceType.PDF: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.ENRICHMENT,
                    PipelineStage.CLASSIFICATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.QDRANT, TargetDatabase.MINIO],
                "enrichment": ["ner", "embedding", "summary"],
            },
            SourceType.IMAGE: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,  # OCR
                    PipelineStage.ENRICHMENT,
                    PipelineStage.CLASSIFICATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.MINIO],
                "enrichment": ["ocr", "ner"],
            },
            SourceType.AUDIO: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,  # Транскрипція
                    PipelineStage.ENRICHMENT,
                    PipelineStage.CLASSIFICATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.QDRANT, TargetDatabase.MINIO],
                "enrichment": ["transcription", "ner", "embedding", "speaker_diarization"],
            },
            SourceType.VIDEO: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,  # Аудіо + кадри
                    PipelineStage.ENRICHMENT,
                    PipelineStage.CLASSIFICATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.QDRANT, TargetDatabase.MINIO],
                "enrichment": ["transcription", "frame_ocr", "ner", "embedding"],
            },
            SourceType.TELEGRAM: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.ENRICHMENT,
                    PipelineStage.CLASSIFICATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.QDRANT, TargetDatabase.REDIS],
                "enrichment": ["media_processing", "ner", "embedding", "entity_linking"],
            },
            SourceType.WEBSITE: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.ENRICHMENT,
                    PipelineStage.CLASSIFICATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.QDRANT],
                "enrichment": ["html_parsing", "ner", "embedding", "link_extraction"],
            },
            SourceType.API: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.VALIDATION,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.POSTGRESQL, TargetDatabase.OPENSEARCH],
                "enrichment": ["schema_validation", "deduplication"],
            },
            SourceType.RSS: {
                "stages": [
                    PipelineStage.INGESTION,
                    PipelineStage.EXTRACTION,
                    PipelineStage.ENRICHMENT,
                    PipelineStage.INDEXING,
                ],
                "targets": [TargetDatabase.OPENSEARCH, TargetDatabase.REDIS],
                "enrichment": ["ner", "categorization"],
            },
        }

    @property
    def doc_processor(self):
        """Lazy load document processor."""
        if self._doc_processor is None:
            from .document_processor import get_document_processor

            self._doc_processor = get_document_processor()
        return self._doc_processor

    @property
    def media_processor(self):
        """Lazy load media processor."""
        if self._media_processor is None:
            from .media_processor import get_media_processor

            self._media_processor = get_media_processor()
        return self._media_processor

    @property
    def telegram_pipeline(self):
        """Lazy load telegram pipeline."""
        if self._telegram_pipeline is None:
            from .telegram_pipeline import get_telegram_pipeline

            self._telegram_pipeline = get_telegram_pipeline()
        return self._telegram_pipeline

    async def process(
        self,
        source_type: str | SourceType,
        input_data: str | dict[str, Any] | bytes,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Головна точка входу для обробки даних.

        Args:
            source_type: Тип джерела даних
            input_data: Шлях до файлу, URL, або дані
            options: Додаткові параметри

        Returns:
            Результат обробки з метаданими
        """
        options = options or {}
        job_id = str(uuid.uuid4())

        # Нормалізація типу
        if isinstance(source_type, str):
            try:
                source_type = SourceType(source_type)
            except ValueError:
                return {"job_id": job_id, "status": "error", "error": f"Невідомий тип джерела: {source_type}"}

        # Ініціалізація результату
        result = {
            "job_id": job_id,
            "source_type": source_type.value,
            "started_at": datetime.now(UTC).isoformat(),
            "stages_completed": [],
            "current_stage": None,
            "status": "processing",
            "data": {},
            "metadata": {},
            "targets": [],
            "quality": None,
            "errors": [],
        }

        # Отримання конфігурації пайплайну
        config = self.pipeline_configs.get(source_type)
        if not config:
            result["status"] = "error"
            result["error"] = f"Немає конфігурації для {source_type}"
            return result

        try:
            # === STAGE 1: INGESTION ===
            result["current_stage"] = PipelineStage.INGESTION.value
            ingested_data = await self._stage_ingestion(source_type, input_data, options)
            result["data"]["ingested"] = ingested_data
            result["stages_completed"].append(PipelineStage.INGESTION.value)

            # === STAGE 2: EXTRACTION ===
            result["current_stage"] = PipelineStage.EXTRACTION.value
            extracted_data = await self._stage_extraction(source_type, ingested_data, options)
            result["data"]["extracted"] = extracted_data
            result["stages_completed"].append(PipelineStage.EXTRACTION.value)

            # === STAGE 3: ENRICHMENT (опціонально) ===
            if PipelineStage.ENRICHMENT in config["stages"]:
                result["current_stage"] = PipelineStage.ENRICHMENT.value
                enriched_data = await self._stage_enrichment(source_type, extracted_data, config["enrichment"], options)
                result["data"]["enriched"] = enriched_data
                result["stages_completed"].append(PipelineStage.ENRICHMENT.value)
            else:
                enriched_data = extracted_data

            # === STAGE 4: CLASSIFICATION ===
            if PipelineStage.CLASSIFICATION in config["stages"]:
                result["current_stage"] = PipelineStage.CLASSIFICATION.value
                classification = await self._stage_classification(source_type, enriched_data, options)
                result["data"]["classification"] = classification
                result["stages_completed"].append(PipelineStage.CLASSIFICATION.value)

            # === STAGE 5: VALIDATION ===
            if PipelineStage.VALIDATION in config["stages"]:
                result["current_stage"] = PipelineStage.VALIDATION.value
                validation = await self._stage_validation(source_type, enriched_data, options)
                result["data"]["validation"] = validation
                result["quality"] = validation.get("quality", DataQuality.MEDIUM.value)
                result["stages_completed"].append(PipelineStage.VALIDATION.value)

            # === STAGE 6: INDEXING ===
            result["current_stage"] = PipelineStage.INDEXING.value
            indexing_results = await self._stage_indexing(source_type, enriched_data, config["targets"], options)
            result["targets"] = indexing_results
            result["stages_completed"].append(PipelineStage.INDEXING.value)

            # Завершення
            result["current_stage"] = PipelineStage.COMPLETED.value
            result["status"] = "completed"
            result["completed_at"] = datetime.now(UTC).isoformat()

        except Exception as e:
            logger.exception(f"Pipeline error for {job_id}: {e}")
            result["status"] = "failed"
            result["current_stage"] = PipelineStage.FAILED.value
            result["errors"].append(str(e))
            result["failed_at"] = datetime.now(UTC).isoformat()

        return result

    async def _stage_ingestion(
        self, source_type: SourceType, input_data: str | dict | bytes, options: dict[str, Any]
    ) -> dict[str, Any]:
        """Стадія завантаження даних."""
        result = {
            "source_type": source_type.value,
            "input_type": type(input_data).__name__,
            "timestamp": datetime.now(UTC).isoformat(),
        }

        if isinstance(input_data, str):
            if os.path.isfile(input_data):
                result["input_type"] = "file"
                result["file_path"] = input_data
                result["file_size"] = os.path.getsize(input_data)
                result["file_name"] = os.path.basename(input_data)
            elif input_data.startswith(("http://", "https://", "t.me/")):
                result["input_type"] = "url"
                result["url"] = input_data
            else:
                result["input_type"] = "text"
                result["content"] = input_data

        elif isinstance(input_data, dict):
            result["input_type"] = "structured"
            result["data"] = input_data

        elif isinstance(input_data, bytes):
            result["input_type"] = "binary"
            result["size"] = len(input_data)
            # Зберігаємо у тимчасовий файл
            import tempfile

            with tempfile.NamedTemporaryFile(delete=False, suffix=".bin") as f:
                f.write(input_data)
                result["file_path"] = f.name

        return result

    async def _stage_extraction(
        self, source_type: SourceType, ingested: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Стадія витягнення даних."""
        file_path = ingested.get("file_path")
        url = ingested.get("url")

        if source_type in [SourceType.EXCEL, SourceType.CSV]:
            if file_path:
                return await self.doc_processor.process_file(file_path, source_type.value, options)

        elif source_type == SourceType.PDF:
            if file_path:
                return await self.doc_processor.process_file(file_path, "pdf", options)

        elif source_type == SourceType.IMAGE:
            if file_path:
                return await self.doc_processor.process_file(file_path, "image", options)

        elif source_type == SourceType.WORD:
            if file_path:
                return await self.doc_processor.process_file(file_path, "word", options)

        elif source_type == SourceType.AUDIO:
            if file_path:
                return await self.media_processor.process_audio(file_path, options)

        elif source_type == SourceType.VIDEO:
            if file_path:
                return await self.media_processor.process_video(file_path, options)

        elif source_type == SourceType.TELEGRAM:
            # Для Telegram потрібна спеціальна обробка
            if ingested.get("data"):
                return await self.telegram_pipeline.process_message(ingested["data"])
            if url:
                return await self.doc_processor.process_url(url, "telegram", options)

        elif source_type == SourceType.WEBSITE:
            if url:
                return await self.doc_processor.process_url(url, "website", options)

        elif source_type == SourceType.API:
            if url:
                return await self.doc_processor.process_url(url, "api", options)

        elif source_type == SourceType.RSS and url:
            return await self.doc_processor.process_url(url, "rss", options)

        return {"status": "no_extraction", "reason": "Немає даних для обробки"}

    async def _stage_enrichment(
        self, source_type: SourceType, extracted: dict[str, Any], enrichment_types: list[str], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Стадія збагачення даних (NER, embeddings, тощо)."""
        enriched = dict(extracted)
        enriched["enrichments"] = {}

        text_content = self._extract_text_content(extracted)

        for enrichment_type in enrichment_types:
            try:
                if enrichment_type == "ner" and text_content:
                    enriched["enrichments"]["ner"] = await self._extract_entities(text_content)

                elif enrichment_type == "embedding" and text_content:
                    enriched["enrichments"]["embedding"] = await self._generate_embedding(text_content)

                elif enrichment_type == "summary" and text_content and len(text_content) > 500:
                    enriched["enrichments"]["summary"] = await self._generate_summary(text_content)

                elif enrichment_type == "statistics" and extracted.get("records"):
                    enriched["enrichments"]["statistics"] = self._calculate_statistics(extracted["records"])

            except Exception as e:
                logger.warning(f"Enrichment {enrichment_type} failed: {e}")
                enriched["enrichments"][enrichment_type] = {"error": str(e)}

        return enriched

    async def _stage_classification(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Стадія класифікації контенту."""
        text_content = self._extract_text_content(data)

        if not text_content:
            return {
                "is_valuable": False,
                "confidence": 0.5,
                "category": "unknown",
                "reason": "Немає текстового контенту",
            }

        # Використовуємо класифікатор з media_processor
        return await self.media_processor._classify_content(text_content)

    async def _stage_validation(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Стадія валідації якості даних."""
        issues = []
        quality = DataQuality.HIGH

        # Перевірка наявності ключових полів
        if source_type in [SourceType.EXCEL, SourceType.CSV]:
            records = data.get("records", [])
            if not records:
                issues.append("Немає записів")
                quality = DataQuality.INVALID
            elif len(records) < 10:
                issues.append("Мало записів")
                quality = DataQuality.LOW

        # Перевірка текстового контенту
        text_content = self._extract_text_content(data)
        if text_content:
            if len(text_content) < 50:
                issues.append("Занадто короткий текст")
                quality = DataQuality.LOW
        elif source_type not in [SourceType.EXCEL, SourceType.CSV, SourceType.API]:
            issues.append("Немає текстового контенту")
            quality = DataQuality.LOW

        # Перевірка класифікації
        classification = data.get("classification", {})
        if classification.get("category") == "noise":
            issues.append("Класифіковано як шум")
            quality = DataQuality.LOW

        return {
            "quality": quality.value,
            "issues": issues,
            "is_valid": quality != DataQuality.INVALID,
            "checked_at": datetime.now(UTC).isoformat(),
        }

    async def _stage_indexing(
        self, source_type: SourceType, data: dict[str, Any], targets: list[TargetDatabase], options: dict[str, Any]
    ) -> list[dict[str, Any]]:
        """Стадія індексації в цільові бази даних."""
        results = []

        for target in targets:
            try:
                if target == TargetDatabase.POSTGRESQL:
                    result = await self._index_to_postgresql(source_type, data, options)
                elif target == TargetDatabase.OPENSEARCH:
                    result = await self._index_to_opensearch(source_type, data, options)
                elif target == TargetDatabase.QDRANT:
                    result = await self._index_to_qdrant(source_type, data, options)
                elif target == TargetDatabase.REDIS:
                    result = await self._index_to_redis(source_type, data, options)
                elif target == TargetDatabase.MINIO:
                    result = await self._index_to_minio(source_type, data, options)
                else:
                    result = {"status": "skipped", "reason": f"Невідома база: {target}"}

                results.append({
                    "target": target.value if isinstance(target, TargetDatabase) else str(target),
                    **result,
                })

            except Exception as e:
                logger.exception(f"Indexing to {target} failed: {e}")
                results.append({
                    "target": target.value if isinstance(target, TargetDatabase) else str(target),
                    "status": "error",
                    "error": str(e),
                })

        return results

    # === HELPER METHODS ===

    def _extract_text_content(self, data: dict[str, Any]) -> str:
        """Витягнути текстовий контент з даних."""
        # Пробуємо різні поля
        text_fields = ["text", "full_text", "transcript", "content", "extracted_text", "caption", "description"]

        for field in text_fields:
            if data.get(field):
                return str(data[field])

        # Рекурсивний пошук
        if data.get("records") and isinstance(data["records"], list):
            texts = []
            for record in data["records"][:10]:  # Обмеження
                if isinstance(record, dict):
                    for field in text_fields:
                        if record.get(field):
                            texts.append(str(record[field]))
                            break
            return " ".join(texts)

        if data.get("transcript") and isinstance(data["transcript"], dict):
            return data["transcript"].get("text", "")

        return ""

    async def _extract_entities(self, text: str) -> dict[str, Any]:
        """Витягнення іменованих сутностей (NER)."""
        # Базова реалізація через regex (можна замінити на spaCy/transformers)
        import re

        entities = {"organizations": [], "persons": [], "locations": [], "dates": [], "money": [], "codes": []}

        # Коди ТН ЗЕД (митні)
        hs_codes = re.findall(r"\b\d{4}[\.\s]?\d{2}[\.\s]?\d{2}[\.\s]?\d{2}\b", text)
        entities["codes"].extend([{"type": "hs_code", "value": c} for c in hs_codes[:20]])

        # Суми (гроші)
        money_patterns = re.findall(
            r"(?:USD|EUR|UAH|грн|\$|€)\s*[\d\s,\.]+|\d+[\s,\.]*(?:USD|EUR|UAH|грн)", text, re.IGNORECASE
        )
        entities["money"].extend([{"value": m.strip()} for m in money_patterns[:20]])

        # Дати
        date_patterns = re.findall(r"\d{1,2}[\./-]\d{1,2}[\./-]\d{2,4}", text)
        entities["dates"].extend([{"value": d} for d in date_patterns[:20]])

        return entities

    async def _generate_embedding(self, text: str) -> dict[str, Any]:
        """Генерація векторного ембедінгу."""
        # TODO: Інтеграція з моделлю ембедінгів (sentence-transformers, OpenAI)
        return {"status": "pending", "model": "nomic-embed-text", "dimensions": 768, "text_length": len(text)}

    async def _generate_summary(self, text: str) -> dict[str, Any]:
        """Генерація резюме тексту."""
        # Базова реалізація - перші 500 символів
        return {
            "summary": text[:500] + "..." if len(text) > 500 else text,
            "original_length": len(text),
            "method": "truncation",
        }

    def _calculate_statistics(self, records: list[dict]) -> dict[str, Any]:
        """Розрахунок статистики для табличних даних."""
        if not records:
            return {}

        return {
            "total_records": len(records),
            "columns": list(records[0].keys()) if records else [],
            "sample_size": min(len(records), 5),
        }

    # === DATABASE INDEXING METHODS ===

    async def _index_to_postgresql(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Індексація в PostgreSQL."""
        # TODO: Реальна інтеграція
        records = data.get("records", [])
        return {"status": "simulated", "records_count": len(records), "table": f"data_{source_type.value}"}

    async def _index_to_opensearch(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Індексація в OpenSearch."""
        text_content = self._extract_text_content(data)
        return {"status": "simulated", "index": f"predator_{source_type.value}", "document_size": len(text_content)}

    async def _index_to_qdrant(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Індексація в Qdrant (векторна БД)."""
        embedding = data.get("enrichments", {}).get("embedding", {})
        return {
            "status": "simulated" if embedding.get("status") == "pending" else "skipped",
            "collection": f"predator_{source_type.value}_vectors",
        }

    async def _index_to_redis(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Індексація в Redis (кеш/real-time)."""
        return {"status": "simulated", "key_prefix": f"predator:{source_type.value}:", "ttl": 3600}

    async def _index_to_minio(
        self, source_type: SourceType, data: dict[str, Any], options: dict[str, Any]
    ) -> dict[str, Any]:
        """Збереження файлів в MinIO."""
        file_path = data.get("file_path")
        return {
            "status": "simulated" if file_path else "skipped",
            "bucket": "predator-documents",
            "object_key": f"{source_type.value}/{datetime.now().strftime('%Y/%m/%d')}/",
        }


# Singleton
_unified_pipeline: UnifiedDataPipeline | None = None


def get_unified_pipeline() -> UnifiedDataPipeline:
    """Get or create UnifiedDataPipeline singleton."""
    global _unified_pipeline
    if _unified_pipeline is None:
        _unified_pipeline = UnifiedDataPipeline()
    return _unified_pipeline
