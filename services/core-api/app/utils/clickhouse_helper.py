import os
from app.database import get_clickhouse_client

def get_columns(table_name: str) -> str:
    """Повертає список колонок через кому для таблиці ClickHouse.
    Внутрішні колонки, що починаються з '_' (наприклад, _tenant_id, _job_id),
    виключаються.
    """
    client = get_clickhouse_client()
    query = f"DESCRIBE TABLE {table_name}"
    result = client.query(query)
    columns = [row[0] for row in result.result_rows if not row[0].startswith('_')]
    return ", ".join(columns)
