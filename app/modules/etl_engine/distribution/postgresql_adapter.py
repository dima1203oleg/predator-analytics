from __future__ import annotations

"""
PostgreSQL Distribution Adapter (Canonical v4.2.0)

Handles distribution of data to PostgreSQL relational database using asyncpg
for extremely fast bulk insertion. (COMP-041)
"""

import asyncio
from datetime import datetime
import logging
import os
from typing import Any

import asyncpg

from app.modules.etl_engine.distribution.data_distributor import DistributionResult

logger = logging.getLogger(__name__)

class PostgreSQLAdapter:
    """PostgreSQL distribution adapter.

    Handles storing structured data in PostgreSQL using fast asyncpg bulk inserts.
    """

    def __init__(self, enabled: bool = True, table_name: str = "staging_customs_v45"):
        self.enabled = enabled
        self.table_name = table_name
        self.raw_db_url = os.getenv(
            "DATABASE_URL", "postgresql://predator:predator_password@localhost:5432/predator_db"
        )
        # Ensure asyncpg compatible URL (no +asyncpg) for direct asyncpg usage
        self.db_url = self.raw_db_url.replace("postgresql+asyncpg://", "postgresql://")

        # Track whether we've created the table during this session
        self._table_ensured = False

        if enabled:
            logger.info(f"PostgreSQL adapter initialized for table: {table_name}")
        else:
            logger.info("PostgreSQL adapter is disabled")

    def distribute(self, data: dict[str, Any] | list[dict[str, Any]]) -> DistributionResult:
        """Distribute data to PostgreSQL using asyncpg."""
        if not self.enabled:
            return DistributionResult(False, "postgresql", error="Adapter is disabled")

        if not data:
            return DistributionResult(False, "postgresql", error="No data provided")

        records = data if isinstance(data, list) else [data]

        try:
            # We run the async logic in the current thread.
            # If there's an existing loop we must use it (like when called directly),
            # but usually this adapter is invoked from `asyncio.to_thread`, which has no loop.
            try:
                loop = asyncio.get_running_loop()
                # Run as a task if we are in an event loop (Not ideal for standard use, but safe)
                result = loop.run_until_complete(self._distribute_async(records))
            except RuntimeError:
                # No running loop, perfect for `asyncio.to_thread`
                result = asyncio.run(self._distribute_async(records))

            return result

        except Exception as e:
            error_msg = f"PostgreSQL distribution failed: {e!s}"
            logger.exception(error_msg)
            return DistributionResult(False, "postgresql", error=error_msg)

    async def _distribute_async(self, records: list[dict[str, Any]]) -> DistributionResult:
        """Asynchronous bulk insert implementation."""
        columns_list = list(records[0].keys())

        if not self._table_ensured:
            await self._create_table_dynamic(columns_list)
            self._table_ensured = True

        conn = await asyncpg.connect(self.db_url)
        try:
            placeholders = ", ".join([f"${i + 1}" for i in range(len(columns_list))])

            # Escape col names to avoid syntax errors with spaces or special chars
            safe_cols = ", ".join([f'"{col}"' for col in columns_list])
            insert_sql = f"INSERT INTO {self.table_name} ({safe_cols}) VALUES ({placeholders})"

            # Convert all fields to strings for safe text ingestion.
            # In a strict schema pipeline, we would map to actual types.
            batch_values = [[str(r.get(col, "")) for col in columns_list] for r in records]

            await conn.executemany(insert_sql, batch_values)

            record_count = len(records)
            logger.info(f"PostgreSQL inserted {record_count} records into '{self.table_name}'")

            return DistributionResult(
                True,
                "postgresql",
                data={
                    "table": self.table_name,
                    "records_inserted": record_count,
                    "timestamp": datetime.now().isoformat()
                },
            )
        finally:
            await conn.close()

    async def _create_table_dynamic(self, columns: list[str]) -> None:
        """Creates table dynamically based on record columns if it doesn't exist."""
        conn = await asyncpg.connect(self.db_url)
        try:
            # All TEXT is safe for raw imported data in landing/staging tables
            cols_def = ", ".join([f'"{col}" TEXT' for col in columns])
            sql = f"""
            CREATE TABLE IF NOT EXISTS {self.table_name} (
                id SERIAL PRIMARY KEY,
                {cols_def},
                created_at TIMESTAMP DEFAULT NOW()
            )
            """
            await conn.execute(sql)
            logger.debug(f"Ensured table {self.table_name} exists")
        finally:
            await conn.close()
