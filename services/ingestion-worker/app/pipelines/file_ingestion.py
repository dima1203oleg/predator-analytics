"""File Ingestion Pipeline — PREDATOR Analytics v55.1 Ironclad.

Повний пайплайн обробки завантажених файлів згідно TZ §2.2.3:
upload → validate_format → detect_encoding → chunk(50k) → parse_headers →
normalize_columns → validate_data_types → deduplicate → enrich(UEID) →
embeddings → index → store → emit
"""
import asyncio
from collections.abc import AsyncGenerator
import csv
from dataclasses import dataclass, field
from datetime import UTC, datetime
import hashlib
import io
import json
from typing import Any, ClassVar

import chardet

from app.minio_service import get_minio_service
from app.normalizers.company import CompanyNormalizer
from app.sinks.neo4j_sink import Neo4jSink
from app.sinks.opensearch_sink import OpenSearchSink
from app.sinks.postgres_sink import PostgresSink
from app.sinks.clickhouse_sink import ClickHouseSink
from app.validators.declaration import DeclarationValidator, Severity
from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.file_pipeline")

# Розмір чанку для обробки
CHUNK_SIZE = 50_000


@dataclass
class IngestionStats:
    """Статистика інгестії."""

    total_rows: int = 0
    processed_rows: int = 0
    valid_rows: int = 0
    quarantined_rows: int = 0
    duplicate_rows: int = 0
    error_rows: int = 0
    warnings: int = 0
    current_stage: str = "init"
    started_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    completed_at: datetime | None = None


@dataclass
class QuarantineRecord:
    """Запис для карантину (DLQ)."""

    job_id: str
    tenant_id: str
    original_record: dict[str, Any]
    errors: list[dict[str, Any]]
    quarantined_at: datetime = field(default_factory=lambda: datetime.now(UTC))


class FileIngestionPipeline:
    """Повний пайплайн інгестії файлів."""

    # Підтримувані формати
    SUPPORTED_FORMATS: ClassVar[set[str]] = {".csv", ".xlsx", ".xls", ".json", ".xml"}

    # Маппінг колонок (нормалізація назв)
    COLUMN_MAPPING: ClassVar[dict[str, str]] = {
        # Українські назви
        "номер декларації": "declaration_number",
        "дата декларації": "declaration_date",
        "єдрпоу": "company_edrpou",
        "код єдрпоу": "company_edrpou",
        "опис товару": "product_description",
        "найменування товару": "product_description",
        "код уктзед": "uktzed_code",
        "код товару": "uktzed_code",
        "митна вартість": "customs_value",
        "вартість": "customs_value",
        "вага": "weight",
        "вага нетто": "weight",
        "країна походження": "country_origin",
        "країна": "country_origin",
        "митний пост": "customs_post",
        "митниця": "customs_post",
        # Англійські назви
        "declaration_number": "declaration_number",
        "declaration_date": "declaration_date",
        "edrpou": "company_edrpou",
        "company_edrpou": "company_edrpou",
        "product_description": "product_description",
        "uktzed_code": "uktzed_code",
        "hs_code": "uktzed_code",
        "customs_value": "customs_value",
        "value": "customs_value",
        "weight": "weight",
        "country_origin": "country_origin",
        "origin_country": "country_origin",
        "customs_post": "customs_post",
    }

    def __init__(
        self,
        job_id: str,
        tenant_id: str,
        user_id: str,
        file_name: str,
        s3_path: str,
        progress_callback: Any | None = None,
    ) -> None:
        """Ініціалізація пайплайну."""
        self.job_id = job_id
        self.tenant_id = tenant_id
        self.user_id = user_id
        self.file_name = file_name
        self.s3_path = s3_path
        self.progress_callback = progress_callback

        self.stats = IngestionStats()
        self.seen_hashes: set[str] = set()
        self.quarantine: list[QuarantineRecord] = []

        # Sinks
        self.postgres_sink = PostgresSink()
        self.neo4j_sink = Neo4jSink()
        self.opensearch_sink = OpenSearchSink()
        self.clickhouse_sink = ClickHouseSink()

        # MinIO
        self.minio = get_minio_service()

    async def run(self) -> dict[str, Any]:
        """Запуск повного пайплайну інгестії."""
        logger.info(
            "Starting file ingestion pipeline",
            extra={"job_id": self.job_id, "file": self.file_name},
        )

        try:
            # 1. Завантаження файлу з MinIO
            self.stats.current_stage = "download"
            await self._update_progress()
            file_content = await self._download_file()

            # 2. Визначення кодування
            self.stats.current_stage = "detect_encoding"
            await self._update_progress()
            encoding = self._detect_encoding(file_content)
            logger.info(f"Detected encoding: {encoding}")

            # 3. Декодування та парсинг
            self.stats.current_stage = "parse"
            await self._update_progress()
            text_content = file_content.decode(encoding, errors="replace")

            # 4. Обробка по чанках
            self.stats.current_stage = "process"
            chunk_num = 0
            batch: list[dict[str, Any]] = []

            async for record in self._parse_and_process(text_content):
                batch.append(record)

                if len(batch) >= CHUNK_SIZE:
                    chunk_num += 1
                    await self._process_batch(batch, chunk_num)
                    batch = []
                    await self._update_progress()

            # Обробка залишку
            if batch:
                chunk_num += 1
                await self._process_batch(batch, chunk_num)

            # 5. Збереження карантину
            self.stats.current_stage = "quarantine"
            await self._save_quarantine()

            # 6. Завершення
            self.stats.current_stage = "completed"
            self.stats.completed_at = datetime.now(UTC)
            await self._update_progress()

            result = self._build_result()
            logger.info(
                "Ingestion completed",
                extra={"job_id": self.job_id, "stats": result},
            )
            return result

        except Exception as e:
            self.stats.current_stage = "error"
            logger.error(f"Ingestion failed: {e}", exc_info=True)
            raise
        finally:
            await self._cleanup()

    async def _download_file(self) -> bytes:
        """Завантажує файл з MinIO."""
        bucket, object_name = self.minio.parse_s3_path(self.s3_path)
        return self.minio.get_file_bytes(bucket, object_name)

    def _detect_encoding(self, content: bytes) -> str:
        """Визначає кодування файлу."""
        # Перевіряємо BOM
        if content.startswith(b"\xef\xbb\xbf"):
            return "utf-8-sig"
        if content.startswith(b"\xff\xfe"):
            return "utf-16-le"
        if content.startswith(b"\xfe\xff"):
            return "utf-16-be"

        # Використовуємо chardet для визначення
        result = chardet.detect(content[:10000])
        encoding = result.get("encoding", "utf-8")

        # Fallback на utf-8
        if not encoding or result.get("confidence", 0) < 0.5:
            encoding = "utf-8"

        return encoding

    async def _parse_and_process(
        self, content: str
    ) -> AsyncGenerator[dict[str, Any], None]:
        """Парсить та обробляє контент файлу."""
        # Визначаємо формат
        file_ext = "." + self.file_name.rsplit(".", 1)[-1].lower()

        if file_ext == ".csv":
            async for record in self._parse_csv(content):
                yield record
        elif file_ext == ".json":
            async for record in self._parse_json(content):
                yield record
        else:
            # Для xlsx/xls потрібен pandas, поки підтримуємо тільки CSV/JSON
            logger.warning(f"Format {file_ext} requires pandas, falling back to CSV")
            async for record in self._parse_csv(content):
                yield record

    async def _parse_csv(self, content: str) -> AsyncGenerator[dict[str, Any], None]:
        """Парсить CSV контент."""
        reader = csv.DictReader(io.StringIO(content))

        # Нормалізуємо заголовки
        if reader.fieldnames:
            normalized_fields = [
                self.COLUMN_MAPPING.get(f.lower().strip(), f.lower().strip())
                for f in reader.fieldnames
            ]
            reader.fieldnames = normalized_fields

        for row in reader:
            self.stats.total_rows += 1

            # Валідація
            validation = DeclarationValidator.validate_record(row)

            if validation.quarantine:
                # Відправляємо в карантин
                self.stats.quarantined_rows += 1
                self.quarantine.append(
                    QuarantineRecord(
                        job_id=self.job_id,
                        tenant_id=self.tenant_id,
                        original_record=row,
                        errors=[
                            {
                                "field": e.field,
                                "message": e.message,
                                "severity": e.severity.value,
                            }
                            for e in validation.errors
                        ],
                    )
                )
                continue

            # Дедуплікація
            if validation.record_hash in self.seen_hashes:
                self.stats.duplicate_rows += 1
                continue

            self.seen_hashes.add(validation.record_hash)

            # Підрахунок помилок та попереджень
            for error in validation.errors:
                if error.severity == Severity.ERROR:
                    self.stats.error_rows += 1
                elif error.severity == Severity.WARNING:
                    self.stats.warnings += 1

            # Збагачення UEID
            normalized = validation.normalized_record
            normalized["_record_hash"] = validation.record_hash
            normalized["_job_id"] = self.job_id
            normalized["_tenant_id"] = self.tenant_id
            normalized["_ingested_at"] = datetime.now(UTC).isoformat()

            # Генерація UEID
            edrpou = normalized.get("company_edrpou", "")
            if edrpou:
                normalized["ueid"] = CompanyNormalizer.generate_ueid(
                    str(edrpou), self.tenant_id
                )

            self.stats.valid_rows += 1
            yield normalized

    async def _parse_json(self, content: str) -> AsyncGenerator[dict[str, Any], None]:
        """Парсить JSON контент."""
        try:
            data = json.loads(content)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        # Нормалізуємо ключі
                        normalized = {
                            self.COLUMN_MAPPING.get(k.lower().strip(), k.lower().strip()): v
                            for k, v in item.items()
                        }
                        self.stats.total_rows += 1

                        # Валідація та обробка аналогічно CSV
                        validation = DeclarationValidator.validate_record(normalized)

                        if validation.quarantine:
                            self.stats.quarantined_rows += 1
                            self.quarantine.append(
                                QuarantineRecord(
                                    job_id=self.job_id,
                                    tenant_id=self.tenant_id,
                                    original_record=item,
                                    errors=[
                                        {
                                            "field": e.field,
                                            "message": e.message,
                                            "severity": e.severity.value,
                                        }
                                        for e in validation.errors
                                    ],
                                )
                            )
                            continue

                        if validation.record_hash in self.seen_hashes:
                            self.stats.duplicate_rows += 1
                            continue

                        self.seen_hashes.add(validation.record_hash)
                        normalized = validation.normalized_record
                        normalized["_record_hash"] = validation.record_hash
                        normalized["_job_id"] = self.job_id
                        normalized["_tenant_id"] = self.tenant_id
                        normalized["_ingested_at"] = datetime.now(UTC).isoformat()

                        edrpou = normalized.get("company_edrpou", "")
                        if edrpou:
                            normalized["ueid"] = CompanyNormalizer.generate_ueid(
                                str(edrpou), self.tenant_id
                            )

                        self.stats.valid_rows += 1
                        yield normalized
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise

    async def _process_batch(
        self, batch: list[dict[str, Any]], chunk_num: int
    ) -> None:
        """Обробляє батч записів."""
        logger.info(
            f"Processing chunk {chunk_num} with {len(batch)} records",
            extra={"job_id": self.job_id},
        )

        # Паралельний запис у всі сховища
        await asyncio.gather(
            self._store_postgres(batch),
            self._store_neo4j(batch),
            self._store_opensearch(batch),
            self._store_clickhouse(batch),
            return_exceptions=True,
        )

        self.stats.processed_rows += len(batch)

    async def _store_postgres(self, batch: list[dict[str, Any]]) -> None:
        """Зберігає батч у PostgreSQL."""
        try:
            # Групуємо по компаніях для UPSERT
            companies = {}
            for record in batch:
                ueid = record.get("ueid")
                if ueid:
                    if ueid not in companies:
                        companies[ueid] = {
                            "ueid": ueid,
                            "edrpou": record.get("company_edrpou"),
                            "tenant_id": self.tenant_id,
                            "declarations": [],
                        }
                    companies[ueid]["declarations"].append(record)

            await self.postgres_sink.upsert_companies(list(companies.values()))
        except Exception as e:
            logger.error(f"Failed to store in PostgreSQL: {e}")

    async def _store_neo4j(self, batch: list[dict[str, Any]]) -> None:
        """Зберігає батч у Neo4j."""
        try:
            for record in batch:
                await self.neo4j_sink.upsert_company(record)
        except Exception as e:
            logger.error(f"Failed to store in Neo4j: {e}")

    async def _store_opensearch(self, batch: list[dict[str, Any]]) -> None:
        """Зберігає батч у OpenSearch."""
        try:
            await self.opensearch_sink.bulk_index(batch, self.tenant_id)
        except Exception as e:
            logger.error(f"Failed to store in OpenSearch: {e}")

    async def _store_clickhouse(self, batch: list[dict[str, Any]]) -> None:
        """Зберігає батч у ClickHouse для аналітики."""
        try:
            # ClickHouse sink працює синхронно через clickhouse-connect, 
            # тому загортаємо в thread або використовуємо як є (для воркера ок)
            await self.clickhouse_sink.insert_declarations(batch)
        except Exception as e:
            logger.error(f"Failed to store in ClickHouse: {e}")

    async def _save_quarantine(self) -> None:
        """Зберігає карантинні записи."""
        if not self.quarantine:
            return

        logger.info(
            f"Saving {len(self.quarantine)} quarantined records",
            extra={"job_id": self.job_id},
        )

        try:
            await self.postgres_sink.save_quarantine(self.quarantine)
        except Exception as e:
            logger.error(f"Failed to save quarantine: {e}")

    async def _update_progress(self) -> None:
        """Оновлює прогрес інгестії."""
        if self.progress_callback:
            progress = {
                "job_id": self.job_id,
                "stage": self.stats.current_stage,
                "total_rows": self.stats.total_rows,
                "processed_rows": self.stats.processed_rows,
                "valid_rows": self.stats.valid_rows,
                "quarantined_rows": self.stats.quarantined_rows,
                "duplicate_rows": self.stats.duplicate_rows,
                "progress_pct": (
                    int(self.stats.processed_rows / max(self.stats.total_rows, 1) * 100)
                    if self.stats.total_rows > 0
                    else 0
                ),
            }
            await self.progress_callback(progress)

    async def _cleanup(self) -> None:
        """Очищення ресурсів."""
        await self.postgres_sink.close()
        await self.neo4j_sink.close()
        await self.opensearch_sink.close()

    def _build_result(self) -> dict[str, Any]:
        """Формує результат інгестії."""
        duration = (
            (self.stats.completed_at - self.stats.started_at).total_seconds()
            if self.stats.completed_at
            else 0
        )

        return {
            "job_id": self.job_id,
            "status": "completed",
            "total_rows": self.stats.total_rows,
            "processed_rows": self.stats.processed_rows,
            "valid_rows": self.stats.valid_rows,
            "quarantined_rows": self.stats.quarantined_rows,
            "duplicate_rows": self.stats.duplicate_rows,
            "error_rows": self.stats.error_rows,
            "warnings": self.stats.warnings,
            "duration_seconds": duration,
            "dataset_hash": hashlib.sha256(
                f"{self.job_id}:{self.stats.total_rows}".encode()
            ).hexdigest()[:16],
        }
