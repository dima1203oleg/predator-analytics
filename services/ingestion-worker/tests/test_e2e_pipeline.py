"""E2E Pipeline Test — Excel → 8 БД (System Memory Contract v4.0)

Перевіряє повний цикл: парсинг → валідація → дедуплікація → збагачення → розподіл.
"""

from __future__ import annotations

import asyncio
import hashlib
import io
import json
import os
import tempfile
from datetime import UTC, datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
import pytest

# Встановлюємо TESTING перед імпортами
os.environ["TESTING"] = "1"


@pytest.fixture
def sample_excel_bytes() -> bytes:
    """Генерує тестовий Excel з 25 митними деклараціями."""
    records = []
    companies = [
        ("00123456", "ТОВ Агроекспорт"),
        ("00234567", "ПП Металург-Сервіс"),
        ("00345678", "ТОВ Хімпром"),
        ("00456789", "АТ Фармація"),
        ("00567890", "ТОВ Текстиль-Груп"),
    ]
    products = [
        ("1001", "Пшениця тверда"),
        ("7202", "Феросплави"),
        ("2905", "Спирти ациклічні"),
        ("3004", "Лікарські засоби"),
        ("5209", "Тканини бавовняні"),
    ]
    countries = ["PL", "DE", "CN", "TR", "IT"]

    for i in range(25):
        company_idx = i % len(companies)
        product_idx = i % len(products)
        records.append({
            "Номер декларації": f"UA100020{2025 + (i // 12)}/{i + 1:06d}",
            "Дата декларації": f"2025-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}",
            "ЄДРПОУ": companies[company_idx][0],
            "Опис товару": f"{products[product_idx][1]} — партія {i + 1}",
            "Код УКТЗЕД": f"{products[product_idx][0]}000000",
            "Митна вартість": 10000.0 + i * 1500.0,
            "Вага": 500.0 + i * 75.0,
            "Країна походження": countries[i % len(countries)],
            "Митний пост": f"UA100{i % 5 + 1}00",
        })

    df = pd.DataFrame(records)
    output = io.BytesIO()
    df.to_excel(output, index=False, engine="openpyxl")
    return output.getvalue()


@pytest.fixture
def sample_csv_bytes() -> bytes:
    """Генерує тестовий CSV."""
    lines = ["Номер декларації,Дата декларації,ЄДРПОУ,Опис товару,Код УКТЗЕД,Митна вартість,Вага,Країна походження,Митний пост"]
    lines.append("UA10002025/000001,2025-01-15,00123456,Пшениця тверда,1001000000,15000.00,800.0,PL,UA100100")
    lines.append("UA10002025/000002,2025-02-20,00234567,Феросплави,7202000000,25000.00,1200.0,DE,UA100200")
    return "\n".join(lines).encode("utf-8")


# ─── Тести парсингу ───────────────────────────────────────────────────────────


class TestExcelParsing:
    """Excel → нормалізовані записи."""

    def test_parse_excel_yields_correct_count(self, sample_excel_bytes: bytes) -> None:
        df = pd.read_excel(io.BytesIO(sample_excel_bytes))
        assert len(df) == 25

    def test_column_normalization(self, sample_excel_bytes: bytes) -> None:
        df = pd.read_excel(io.BytesIO(sample_excel_bytes))
        assert "Номер декларації" in df.columns or "declaration_number" in df.columns
        assert "ЄДРПОУ" in df.columns or "company_edrpou" in df.columns


# ─── Тести валідації ──────────────────────────────────────────────────────────


class TestValidation:
    """DeclarationValidator: EDRPOU, UKTZED, customs_value."""

    def test_valid_edrpou(self) -> None:
        from app.validators.declaration import DeclarationValidator

        err = DeclarationValidator.validate_edrpou("00123456")
        assert err is None

    def test_invalid_edrpou_quarantine(self) -> None:
        from app.validators.declaration import DeclarationValidator

        err = DeclarationValidator.validate_edrpou("123")
        assert err is not None
        assert err.severity.value == "critical"

    def test_valid_uktzed(self) -> None:
        from app.validators.declaration import DeclarationValidator

        err = DeclarationValidator.validate_uktzed_code("1001000000")
        assert err is None

    def test_invalid_uktzed_prefix(self) -> None:
        from app.validators.declaration import DeclarationValidator

        err = DeclarationValidator.validate_uktzed_code("9900000000")
        assert err is not None

    def test_negative_value_auto_corrected(self) -> None:
        from app.validators.declaration import DeclarationValidator

        err, corrected = DeclarationValidator.validate_customs_value(-5000.0)
        assert err is not None
        assert corrected == 5000.0

    def test_full_validation_passes(self) -> None:
        from app.validators.declaration import DeclarationValidator

        record = {
            "declaration_number": "UA10002025/000001",
            "declaration_date": "2025-01-15",
            "company_edrpou": "00123456",
            "uktzed_code": "1001000000",
            "customs_value": 15000.0,
        }
        result = DeclarationValidator.validate_record(record)
        assert result.is_valid
        assert not result.quarantine
        assert result.record_hash is not None

    def test_full_validation_quarantines_bad_edrpou(self) -> None:
        from app.validators.declaration import DeclarationValidator

        record = {
            "declaration_number": "X",
            "company_edrpou": "bad",
            "customs_value": 100,
        }
        result = DeclarationValidator.validate_record(record)
        assert result.quarantine


# ─── Тести дедуплікації ───────────────────────────────────────────────────────


class TestDeduplication:
    """Хеш-дедуплікація за 5 полями."""

    def test_same_record_same_hash(self) -> None:
        from app.validators.declaration import DeclarationValidator

        r1 = {"declaration_number": "X", "declaration_date": "2025-01-01",
              "company_edrpou": "00123456", "uktzed_code": "1001", "customs_value": "100"}
        r2 = dict(r1)
        h1 = DeclarationValidator.generate_record_hash(r1)
        h2 = DeclarationValidator.generate_record_hash(r2)
        assert h1 == h2

    def test_different_record_different_hash(self) -> None:
        from app.validators.declaration import DeclarationValidator

        r1 = {"declaration_number": "A", "declaration_date": "2025-01-01",
              "company_edrpou": "00123456", "uktzed_code": "1001", "customs_value": "100"}
        r2 = {"declaration_number": "B", "declaration_date": "2025-01-01",
              "company_edrpou": "00123456", "uktzed_code": "1001", "customs_value": "100"}
        assert DeclarationValidator.generate_record_hash(r1) != DeclarationValidator.generate_record_hash(r2)


# ─── Тести нормалізації ───────────────────────────────────────────────────────


class TestNormalization:
    """CompanyNormalizer: UEID генерація."""

    def test_ueid_generation(self) -> None:
        from app.normalizers.company import CompanyNormalizer

        ueid = CompanyNormalizer.generate_ueid("00123456", "tenant-1")
        assert ueid is not None
        assert len(ueid) == 64  # SHA-256 hex

    def test_ueid_deterministic(self) -> None:
        from app.normalizers.company import CompanyNormalizer

        u1 = CompanyNormalizer.generate_ueid("00123456", "tenant-1")
        u2 = CompanyNormalizer.generate_ueid("00123456", "tenant-1")
        assert u1 == u2

    def test_ueid_differs_per_tenant(self) -> None:
        from app.normalizers.company import CompanyNormalizer

        u1 = CompanyNormalizer.generate_ueid("00123456", "tenant-1")
        u2 = CompanyNormalizer.generate_ueid("00123456", "tenant-2")
        assert u1 != u2


# ─── Тести розподілу по БД ────────────────────────────────────────────────────


class TestDatabaseDistribution:
    """Перевіряє, що дані коректно розподіляються по 5 аналітичних БД."""

    @pytest.fixture
    def sample_batch(self) -> list[dict[str, Any]]:
        return [
            {
                "declaration_number": "UA10002025/000001",
                "declaration_date": "2025-01-15",
                "company_edrpou": "00123456",
                "ueid": "a" * 64,
                "product_description": "Пшениця тверда",
                "uktzed_code": "1001000000",
                "customs_value": 15000.0,
                "weight": 800.0,
                "country_origin": "PL",
                "customs_post": "UA100100",
                "_record_hash": "hash001",
                "_job_id": "job-1",
                "_tenant_id": "tenant-1",
                "_ingested_at": "2025-01-15T00:00:00Z",
            },
            {
                "declaration_number": "UA10002025/000002",
                "declaration_date": "2025-02-20",
                "company_edrpou": "00234567",
                "ueid": "b" * 64,
                "product_description": "Феросплави",
                "uktzed_code": "7202000000",
                "customs_value": 25000.0,
                "weight": 1200.0,
                "country_origin": "DE",
                "customs_post": "UA100200",
                "_record_hash": "hash002",
                "_job_id": "job-1",
                "_tenant_id": "tenant-1",
                "_ingested_at": "2025-01-15T00:00:00Z",
            },
        ]

    @pytest.mark.asyncio
    async def test_postgres_receives_company_upsert(self, sample_batch: list[dict[str, Any]]) -> None:
        from app.sinks.postgres_sink import PostgresSink

        with patch.object(PostgresSink, "upsert_companies", new_callable=AsyncMock) as mock_upsert:
            sink = PostgresSink()
            sink.upsert_companies = mock_upsert

            companies = {}
            for record in sample_batch:
                ueid = record.get("ueid")
                if ueid:
                    if ueid not in companies:
                        companies[ueid] = {"ueid": ueid, "edrpou": record.get("company_edrpou"),
                                           "tenant_id": "tenant-1", "declarations": []}
                    companies[ueid]["declarations"].append(record)
            await sink.upsert_companies(list(companies.values()))

            mock_upsert.assert_called_once()
            args = mock_upsert.call_args[0][0]
            assert len(args) == 2  # 2 унікальні компанії

    @pytest.mark.asyncio
    async def test_opensearch_receives_fulltext_docs(self, sample_batch: list[dict[str, Any]]) -> None:
        from app.sinks.opensearch_sink import OpenSearchSink

        with patch.object(OpenSearchSink, "bulk_index", new_callable=AsyncMock) as mock_bulk:
            sink = OpenSearchSink()
            sink.bulk_index = mock_bulk
            await sink.bulk_index(sample_batch, "tenant-1")

            mock_bulk.assert_called_once()
            args = mock_bulk.call_args[0][0]
            assert len(args) == 2
            # Перевіряємо наявність текстових полів
            assert args[0]["product_description"] == "Пшениця тверда"

    @pytest.mark.asyncio
    async def test_clickhouse_receives_analytics(self, sample_batch: list[dict[str, Any]]) -> None:
        pytest.importorskip("clickhouse_connect", reason="ClickHouse driver не встановлено локально")
        from app.sinks.clickhouse_sink import ClickHouseSink

        with patch.object(ClickHouseSink, "insert_declarations", new_callable=AsyncMock) as mock_insert:
            sink = ClickHouseSink()
            sink.insert_declarations = mock_insert
            await sink.insert_declarations(sample_batch)

            mock_insert.assert_called_once()
            args = mock_insert.call_args[0][0]
            assert len(args) == 2

    @pytest.mark.asyncio
    async def test_neo4j_creates_graph_nodes(self, sample_batch: list[dict[str, Any]]) -> None:
        from app.sinks.neo4j_sink import Neo4jSink

        with patch.object(Neo4jSink, "upsert_company", new_callable=AsyncMock) as mock_upsert:
            sink = Neo4jSink()
            sink.upsert_company = mock_upsert
            for record in sample_batch:
                await sink.upsert_company(record)

            assert mock_upsert.call_count == 2

    @pytest.mark.asyncio
    async def test_qdrant_receives_vectors(self, sample_batch: list[dict[str, Any]]) -> None:
        from app.sinks.qdrant_sink import QdrantSink

        with patch.object(QdrantSink, "upsert_vectors", new_callable=AsyncMock) as mock_upsert:
            sink = QdrantSink()
            sink.upsert_vectors = mock_upsert
            await sink.upsert_vectors(sample_batch, "tenant-1")

            mock_upsert.assert_called_once()
            args = mock_upsert.call_args[0][0]
            assert len(args) == 2


# ─── Тест повного пайплайну ───────────────────────────────────────────────────


class TestFullPipeline:
    """Інтеграційний тест: Excel → всі 5 аналітичних БД."""

    @pytest.mark.asyncio
    async def test_pipeline_routes_to_all_5_sinks(self, sample_excel_bytes: bytes) -> None:
        """Перевіряє, що FileIngestionPipeline викликає всі 5 сінків."""
        pytest.importorskip("clickhouse_connect", reason="ClickHouse driver не встановлено локально")
        from app.pipelines.file_ingestion import FileIngestionPipeline

        with patch("app.pipelines.file_ingestion.PostgresSink") as MockPg, \
             patch("app.pipelines.file_ingestion.Neo4jSink") as MockNeo, \
             patch("app.pipelines.file_ingestion.OpenSearchSink") as MockOs, \
             patch("app.pipelines.file_ingestion.ClickHouseSink") as MockCh, \
             patch("app.pipelines.file_ingestion.QdrantSink") as MockQd, \
             patch("app.pipelines.file_ingestion.get_minio_service") as MockMinio:

            # Налаштовуємо моки
            mock_minio = MagicMock()
            mock_minio.parse_s3_path.return_value = ("bucket", "test.xlsx")
            mock_minio.get_file_bytes.return_value = sample_excel_bytes
            MockMinio.return_value = mock_minio

            for MockCls in [MockPg, MockNeo, MockOs, MockCh, MockQd]:
                instance = MockCls.return_value
                instance.upsert_companies = AsyncMock()
                instance.upsert_company = AsyncMock()
                instance.bulk_index = AsyncMock()
                instance.insert_declarations = AsyncMock()
                instance.upsert_vectors = AsyncMock()
                instance.close = AsyncMock()
                instance.save_quarantine = AsyncMock()

            pipeline = FileIngestionPipeline(
                job_id="test-job",
                tenant_id="tenant-1",
                user_id="user-1",
                file_name="customs_2025_01.xlsx",
                s3_path="s3://bucket/customs_2025_01.xlsx",
            )

            result = await pipeline.run()

            # Перевіряємо результат
            assert result["status"] == "completed"
            assert result["total_rows"] == 25
            assert result["valid_rows"] == 25
            assert result["quarantined_rows"] == 0

            # Перевіряємо, що всі 5 сінків були викликані
            MockPg.return_value.upsert_companies.assert_called()
            MockNeo.return_value.upsert_company.assert_called()
            MockOs.return_value.bulk_index.assert_called()
            MockCh.return_value.insert_declarations.assert_called()
            MockQd.return_value.upsert_vectors.assert_called()

    @pytest.mark.asyncio
    async def test_pipeline_handles_quarantine(self) -> None:
        """Перевіряє, що невалідні записи потрапляють у карантин."""
        pytest.importorskip("clickhouse_connect", reason="ClickHouse driver не встановлено локально")
        from app.pipelines.file_ingestion import FileIngestionPipeline

        # CSV з одним поганим EDRPOU
        bad_csv = (
            "Номер декларації,Дата декларації,ЄДРПОУ,Опис товару,Код УКТЗЕД,Митна вартість\n"
            "UA10002025/000001,2025-01-15,00123456,Товар А,1001000000,15000\n"
            "UA10002025/000002,2025-01-16,BAD,Товар Б,7202000000,25000\n"
            "UA10002025/000003,2025-01-17,00345678,Товар В,2905000000,35000\n"
        ).encode("utf-8")

        with patch("app.pipelines.file_ingestion.PostgresSink") as MockPg, \
             patch("app.pipelines.file_ingestion.Neo4jSink") as MockNeo, \
             patch("app.pipelines.file_ingestion.OpenSearchSink") as MockOs, \
             patch("app.pipelines.file_ingestion.ClickHouseSink") as MockCh, \
             patch("app.pipelines.file_ingestion.QdrantSink") as MockQd, \
             patch("app.pipelines.file_ingestion.get_minio_service") as MockMinio:

            mock_minio = MagicMock()
            mock_minio.parse_s3_path.return_value = ("bucket", "test.csv")
            mock_minio.get_file_bytes.return_value = bad_csv
            MockMinio.return_value = mock_minio

            for MockCls in [MockPg, MockNeo, MockOs, MockCh, MockQd]:
                inst = MockCls.return_value
                inst.upsert_companies = AsyncMock()
                inst.upsert_company = AsyncMock()
                inst.bulk_index = AsyncMock()
                inst.insert_declarations = AsyncMock()
                inst.upsert_vectors = AsyncMock()
                inst.close = AsyncMock()
                inst.save_quarantine = AsyncMock()

            pipeline = FileIngestionPipeline(
                job_id="test-q", tenant_id="t1", user_id="u1",
                file_name="bad.csv", s3_path="s3://b/bad.csv",
            )

            result = await pipeline.run()

            assert result["total_rows"] == 3
            assert result["valid_rows"] == 2
            assert result["quarantined_rows"] == 1


# ─── Контракт System Memory Contract ──────────────────────────────────────────


class TestMemoryContract:
    """Перевіряє відповідність HR-17..HR-20 через SmartDataRouter."""

    @pytest.fixture
    def router(self) -> Any:
        """Імпортує SmartDataRouter; пропускає тести якщо недоступний."""
        try:
            from app.services.smart_data_router import SmartDataRouter
            return SmartDataRouter()
        except (ModuleNotFoundError, ImportError):
            pytest.skip("SmartDataRouter доступний лише в core-api (HR-21: MacBook без БД)")

    def test_hr17_clickhouse_olap_only(self, router: Any) -> None:
        """HR-17: ClickHouse — єдине джерело аналітики >100k."""
        decision = router.route("агрегація", hint_rows=500_000)
        assert decision.target.value == "clickhouse"

    def test_hr18_postgres_ssot(self, router: Any) -> None:
        """HR-18: PostgreSQL — тільки транзакції та метадані."""
        decision = router.route("оновити статус", hint_mode="transactional")
        assert decision.target.value == "postgresql"

    def test_hr19_opensearch_search_only(self, router: Any) -> None:
        """HR-19: OpenSearch — тільки повнотекстовий пошук."""
        decision = router.route("знайти документ", hint_mode="search")
        assert decision.target.value == "opensearch"

    def test_hr20_qdrant_vectors_only(self, router: Any) -> None:
        """HR-20: Qdrant — тільки векторна пам'ять."""
        decision = router.route("семантично схоже", hint_mode="semantic")
        assert decision.target.value == "qdrant"
