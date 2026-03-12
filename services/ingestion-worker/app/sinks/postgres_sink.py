"""PostgreSQL Sink — PREDATOR Analytics v55.2-SM-EXTENDED.

Ефективний запис пакетів даних з підтримкою UPSERT.
"""
from datetime import UTC, datetime
import json
from typing import Any
from uuid import uuid4

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from predator_common.logging import get_logger
from predator_common.models import Company

logger = get_logger("ingestion_worker.postgres")
settings = get_settings()


class PostgresSink:
    """Сінк для запису в PostgreSQL."""

    def __init__(self) -> None:
        """Ініціалізація PostgreSQL клієнта."""
        db_url = (
            f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
            f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        )
        self.engine = create_async_engine(db_url, pool_pre_ping=True)
        self.async_session = sessionmaker(
            bind=self.engine, class_=AsyncSession, expire_on_commit=False
        )  # type: ignore[call-overload]

    async def upsert_companies(self, batch: list[dict[str, Any]]) -> None:
        """Виконує UPSERT для компаній за UEID."""
        if not batch:
            return

        async with self.async_session() as session:
            for item in batch:
                try:
                    # Підготовка даних для Company
                    company_data = {
                        "ueid": item.get("ueid"),
                        "edrpou": item.get("edrpou"),
                        "tenant_id": item.get("tenant_id"),
                        "updated_at": datetime.now(UTC),
                    }
                    # Фільтруємо None значення
                    company_data = {k: v for k, v in company_data.items() if v is not None}

                    if not company_data.get("ueid"):
                        continue

                    stmt = insert(Company).values(**company_data)
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["ueid"],
                        set_={
                            k: v
                            for k, v in company_data.items()
                            if k not in ["ueid", "created_at"]
                        },
                    )
                    await session.execute(stmt)
                except Exception as e:
                    logger.error(f"Failed to upsert company: {e}")

            await session.commit()

    async def save_declarations(self, batch: list[dict[str, Any]]) -> None:
        """Зберігає декларації."""
        if not batch:
            return

        async with self.async_session() as session:
            for record in batch:
                try:
                    # Використовуємо raw SQL для гнучкості
                    await session.execute(
                        text("""
                            INSERT INTO customs_declarations (
                                id, tenant_id, declaration_number, declaration_date,
                                company_edrpou, ueid, product_description, uktzed_code,
                                customs_value, weight, country_origin, customs_post,
                                record_hash, job_id, created_at
                            ) VALUES (
                                :id, :tenant_id, :declaration_number, :declaration_date,
                                :company_edrpou, :ueid, :product_description, :uktzed_code,
                                :customs_value, :weight, :country_origin, :customs_post,
                                :record_hash, :job_id, :created_at
                            )
                            ON CONFLICT (record_hash) DO NOTHING
                        """),
                        {
                            "id": str(uuid4()),
                            "tenant_id": record.get("_tenant_id"),
                            "declaration_number": record.get("declaration_number"),
                            "declaration_date": record.get("declaration_date"),
                            "company_edrpou": record.get("company_edrpou"),
                            "ueid": record.get("ueid"),
                            "product_description": record.get("product_description"),
                            "uktzed_code": record.get("uktzed_code"),
                            "customs_value": record.get("customs_value"),
                            "weight": record.get("weight"),
                            "country_origin": record.get("country_origin"),
                            "customs_post": record.get("customs_post"),
                            "record_hash": record.get("_record_hash"),
                            "job_id": record.get("_job_id"),
                            "created_at": datetime.now(UTC),
                        },
                    )
                except Exception as e:
                    logger.error(f"Failed to save declaration: {e}")

            await session.commit()

    async def save_quarantine(self, quarantine_records: list[Any]) -> None:
        """Зберігає карантинні записи (DLQ)."""
        if not quarantine_records:
            return

        async with self.async_session() as session:
            for record in quarantine_records:
                try:
                    await session.execute(
                        text("""
                            INSERT INTO ingestion_quarantine (
                                id, tenant_id, job_id, original_record,
                                errors, quarantined_at
                            ) VALUES (
                                :id, :tenant_id, :job_id, :original_record,
                                :errors, :quarantined_at
                            )
                        """),
                        {
                            "id": str(uuid4()),
                            "tenant_id": record.tenant_id,
                            "job_id": record.job_id,
                            "original_record": json.dumps(record.original_record, ensure_ascii=False, default=str),
                            "errors": json.dumps(record.errors, ensure_ascii=False, default=str),
                            "quarantined_at": record.quarantined_at,
                        },
                    )
                except Exception as e:
                    logger.error(f"Failed to save quarantine record: {e}")

            await session.commit()

    async def update_job_progress(
        self,
        job_id: str,
        status: str,
        progress: int,
        records_processed: int,
        records_errors: int,
    ) -> None:
        """Оновлює прогрес ingestion job."""
        async with self.async_session() as session:
            try:
                await session.execute(
                    text("""
                        UPDATE ingestion_jobs
                        SET status = :status,
                            progress = :progress,
                            records_processed = :records_processed,
                            records_errors = :records_errors,
                            updated_at = :updated_at
                        WHERE id = :job_id::uuid
                    """),
                    {
                        "job_id": job_id,
                        "status": status,
                        "progress": progress,
                        "records_processed": records_processed,
                        "records_errors": records_errors,
                        "updated_at": datetime.now(UTC),
                    },
                )
                await session.commit()
            except Exception as e:
                logger.error(f"Failed to update job progress: {e}")

    async def write_batch(self, table_name: str, batch: list[dict[str, Any]]) -> None:
        """Загальний метод запису."""
        if table_name == "companies":
            await self.upsert_companies(batch)
        elif table_name == "declarations":
            await self.save_declarations(batch)

    async def close(self) -> None:
        """Закриття з'єднання."""
        await self.engine.dispose()
