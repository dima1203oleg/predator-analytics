"""OMNIVERSE Synergy Engine — Крос-доменний аналіз сутностей.

Знаходить зв'язки між різними таблицями Omniverse на основі Entity Resolution.
"""
from typing import Any

from app.database import get_clickhouse_client
from predator_common.logging import get_logger

logger = get_logger("core_api.omniverse_synergy")

class OmniverseSynergy:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.client = get_clickhouse_client()

    async def get_all_omniverse_tables(self) -> list[str]:
        """Отримує список всіх таблиць Omniverse для поточного тенанта."""
        query = f"SHOW TABLES LIKE 'omniverse_{self.tenant_id}_%'"
        result = self.client.query(query)
        return [row[0] for row in result.result_rows if not row[0].endswith('_alerts')]

    async def find_entity_globally(self, search_term: str) -> list[dict[str, Any]]:
        """Шукає сутність у всіх таблицях Omniverse."""
        tables = await self.get_all_omniverse_tables()
        all_matches = []

        for table in tables:
            try:
                # Намагаємось знайти колонки, що схожі на Назву або ID
                schema_query = f"DESCRIBE TABLE {table}"
                schema = self.client.query(schema_query)
                columns = [row[0] for row in schema.result_rows]

                # Пошук по всіх колонках (спрощено)
                # В реальності ми б шукали лише в 'name', 'edrpou' тощо.
                search_query = f"""
                    SELECT * FROM {table} 
                    WHERE arrayExists(x -> toString(x) ILIKE '%{search_term}%', tupleElement(*, 1)) -- спрощено для MVP
                    OR toString(*) ILIKE '%{search_term}%'
                    LIMIT 5
                """
                # Оскільки ClickHouse не підтримує універсальний пошук по всіх колонках так легко без динаміки:
                # Ми будемо шукати по перших 3 текстових колонках
                text_cols = [c for c in columns if 'String' in str(schema.result_rows[columns.index(c)][1])]
                if not text_cols: continue

                where_clause = " OR ".join([f"{c} ILIKE '%{search_term}%'" for c in text_cols[:3]])
                query = f"SELECT * FROM {table} WHERE {where_clause} LIMIT 10"

                result = self.client.query(query)
                for row in result.result_rows:
                    data = dict(zip(result.column_names, row))
                    all_matches.append({
                        "table": table,
                        "data": data
                    })
            except Exception as e:
                logger.error(f"Error searching in {table}: {e}")

        return all_matches

    async def get_entity_synergy_profile(self, ueid: str) -> dict[str, Any]:
        """Формує 360-профіль сутності на основі її UEID (якщо він є в даних)."""
        # В Omniverse ми додаємо ueid_ column під час інгестії (опціонально)
        # Якщо ueid немає, ми намагаємось знайти за назвою
        return {
            "ueid": ueid,
            "domains": ["Customs", "Finance", "Shipping"], # Mock
            "risk_index": 42,
            "connections": 15
        }
