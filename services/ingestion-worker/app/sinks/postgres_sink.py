"""PostgreSQL Sink — PREDATOR Analytics v61.0-ELITE Ironclad.
© 2026 PREDATOR — HR-01, HR-05, HR-18

Відповідає за транзакційні дані та метадані (SSOT).
Згідно з HR-17, важкі аналітичні дані (декларації) мають зберігатися в ClickHouse.
"""
from datetime import UTC, datetime
import json
from typing import Any

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.config import get_settings
from predator_common.logging import get_logger
from predator_common.models import Company, Declaration
logger = get_logger("ingestion_worker.postgres")
settings = get_settings()


class PostgresSink:
    """Сінк для запису транзакційних даних та метадані у PostgreSQL."""

    def __init__(self) -> None:
        """Ініціалізація PostgreSQL клієнта з підтримкою асинхронності."""
        db_url = (
            f"postgresql+asyncpg://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
            f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
        )
        self.engine = create_async_engine(
            db_url,
            pool_pre_ping=True,
            pool_size=10,
            max_overflow=20
        )
        self.async_session = sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False
        )  # type: ignore[call-overload]

    async def upsert_companies(self, batch: list[dict[str, Any]]) -> None:
        """Виконує ідемпотентний UPSERT для компаній за UEID.
        Оновлює метадані компанії в SSOT.
        """
        if not batch:
            return

        async with self.async_session() as session:
            for item in batch:
                try:
                    # Парсинг дати
                    decl_date_raw = item.get("declaration_date")
                    decl_date = None
                    if decl_date_raw:
                        try:
                            decl_date = parse_date(str(decl_date_raw)).date()
                        except Exception:
                            decl_date = None

                    # Підготовка даних для сутності Company
                    company_data = {
                        "ueid": str(item.get("ueid")) if item.get("ueid") is not None else None,
                        "edrpou": str(item.get("edrpou")) if item.get("edrpou") is not None else None,
                        "name": str(item.get("importer_name") or item.get("exporter_name") or "Unknown"),
                        "tenant_id": item.get("tenant_id"),
                        "updated_at": datetime.now(UTC),
                    }
                    # Фільтрація порожніх значень
                    company_data = {k: v for k, v in company_data.items() if v is not None}

                    if company_data.get("ueid") or company_data.get("edrpou"):
                        stmt = insert(Company).values(**company_data)
                        if company_data.get("ueid"):
                            stmt = stmt.on_conflict_do_update(
                                index_elements=['ueid'],
                                set_={
                                    "tenant_id": stmt.excluded.tenant_id,
                                    "edrpou": stmt.excluded.edrpou,
                                    "name": stmt.excluded.name,
                                    "updated_at": stmt.excluded.updated_at
                                }
                            )
                        elif company_data.get("edrpou"):
                            stmt = stmt.on_conflict_do_update(
                                index_elements=['edrpou'],
                                set_={
                                    "tenant_id": stmt.excluded.tenant_id,
                                    "ueid": stmt.excluded.ueid,
                                    "name": stmt.excluded.name,
                                    "updated_at": stmt.excluded.updated_at
                                }
                            )
                        await session.execute(stmt)
                except Exception as e:
                    logger.error(f"❌ Помилка UPSERT компанії: {e}")

            await session.commit()

    async def insert_declarations(self, batch: list[dict[str, Any]]) -> None:
        """Зберігає декларації в SSOT."""
        if not batch:
            return

        async with self.async_session() as session:
            for item in batch:
                try:
                    from dateutil.parser import parse as parse_date
                    
                    decl_date_raw = item.get("declaration_date")
                    decl_date = None
                    if decl_date_raw:
                        try:
                            decl_date = parse_date(str(decl_date_raw)).date()
                        except Exception:
                            decl_date = None
                            
                    # Підготовка даних для сутності Declaration
                    declaration_data = {
                        "tenant_id": item.get("_tenant_id"),
                        "declaration_number": str(item.get("declaration_number")) if item.get("declaration_number") is not None else None,
                        "declaration_date": decl_date,
                        "importer_ueid": str(item.get("ueid")) if item.get("ueid") is not None else None,
                        "importer_edrpou": str(item.get("company_edrpou")) if item.get("company_edrpou") is not None else None,
                        "uktzed_code": str(item.get("uktzed_code")) if item.get("uktzed_code") is not None else None,
                        "goods_description": str(item.get("product_description")) if item.get("product_description") is not None else None,
                        "net_weight_kg": item.get("weight"),
                        "customs_value_usd": item.get("customs_value"),
                        "country_origin": str(item.get("country_origin")) if item.get("country_origin") is not None else None,
                        "customs_post": str(item.get("customs_post")) if item.get("customs_post") is not None else None,
                        "content_hash": str(item.get("_record_hash")) if item.get("_record_hash") is not None else None,
                        "raw_data": item,
                        "updated_at": datetime.now(UTC),
                    }
                    declaration_data = {k: v for k, v in declaration_data.items() if v is not None}
                    
                    if not declaration_data.get("declaration_number") or not declaration_data.get("tenant_id"):
                        continue

                    stmt = insert(Declaration).values(**declaration_data)
                    stmt = stmt.on_conflict_do_update(
                        index_elements=["declaration_number"],
                        set_={
                            k: v
                            for k, v in declaration_data.items()
                            if k not in ["declaration_number", "tenant_id", "created_at"]
                        },
                    )
                    await session.execute(stmt)
                except Exception as e:
                    logger.error(f"❌ Помилка запису декларації: {e}")

            await session.commit()



    async def save_quarantine(self, quarantine_records: list[Any]) -> None:
        """Зберігає записи, що не пройшли валідацію (Карантин/DLQ)."""
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
                                gen_random_uuid(), :tenant_id, :job_id, :original_record,
                                :errors, :quarantined_at
                            )
                        """),
                        {
                            "tenant_id": record.tenant_id,
                            "job_id": record.job_id,
                            "original_record": json.dumps(record.original_record, ensure_ascii=False, default=str),
                            "errors": json.dumps(record.errors, ensure_ascii=False, default=str),
                            "quarantined_at": record.quarantined_at,
                        },
                    )
                except Exception as e:
                    logger.error(f"❌ Помилка запису в карантин: {e}")

            await session.commit()

    async def update_job_progress(
        self,
        job_id: str,
        status: str,
        progress: int,
        records_processed: int,
        records_errors: int,
    ) -> None:
        """Оновлює статус та прогрес завдання інгестії (Метадані)."""
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
                        WHERE id = CAST(:job_id AS uuid)
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
                logger.error(f"❌ Помилка оновлення прогресу завдання: {e}")

    async def is_event_processed(self, event_id: str) -> bool:
        """Перевіряє, чи було подію вже оброблено для забезпечення ідемпотентності."""
        async with self.async_session() as session:
            try:
                result = await session.execute(
                    text("SELECT 1 FROM processed_events WHERE event_id = CAST(:event_id AS uuid)"),
                    {"event_id": event_id}
                )
                return result.scalar() is not None
            except Exception as e:
                logger.error(f"⚠️ Помилка перевірки ідемпотентності: {e}")
                return False

    async def mark_event_processed(
        self, event_id: str, tenant_id: str, source: str, status: str = "SUCCESS"
    ) -> None:
        """Позначає ідентифікатор події як оброблений."""
        async with self.async_session() as session:
            try:
                await session.execute(
                    text("""
                        INSERT INTO processed_events (event_id, tenant_id, source, status)
                        VALUES (CAST(:event_id AS uuid), CAST(:tenant_id AS uuid), :source, :status)
                        ON CONFLICT (event_id) DO NOTHING
                    """),
                    {
                        "event_id": event_id,
                        "tenant_id": tenant_id,
                        "source": source,
                        "status": status,
                    }
                )
                await session.commit()
            except Exception as e:
                logger.error(f"❌ Помилка маркування події: {e}")

    async def close(self) -> None:
        """Граціозне закриття з'єднань з БД."""
        await self.engine.dispose()
