from typing import Any

import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

# Опціональний імпорт — не падаємо якщо clickhouse_connect недоступний
try:
    import clickhouse_connect
except ImportError:
    clickhouse_connect = None  # type: ignore

class ClickHouseSink:
    def __init__(self):
        self.client = None
        self.host = settings.CLICKHOUSE_HOST
        self.port = settings.CLICKHOUSE_PORT
        self.user = settings.CLICKHOUSE_USER
        self.password = settings.CLICKHOUSE_PASSWORD

    def connect(self):
        if clickhouse_connect is None:
            logger.warning("clickhouse_connect не встановлено — ClickHouse недоступний")
            return
        try:
            self.client = clickhouse_connect.get_client(
                host=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                database='predator_analytics'
            )
            logger.info("Connected to ClickHouse", host=self.host, port=self.port)
        except Exception as e:
            logger.warning("ClickHouse недоступний", error=str(e))
            self.client = None

    async def insert_declarations(self, data: list[dict[str, Any]]):
        if not self.client:
            self.connect()

        try:
            # Мапінг даних до колонок ClickHouse
            rows = []
            for item in data:
                rows.append([
                    item.get('id'),
                    item.get('declaration_number'),
                    item.get('declaration_date'),
                    item.get('exporter_name'),
                    item.get('exporter_ueid'),
                    item.get('importer_name'),
                    item.get('importer_ueid'),
                    item.get('hs_code'),
                    item.get('hs_description'),
                    item.get('weight_kg'),
                    item.get('value_usd'),
                    item.get('origin_country'),
                    item.get('destination_country'),
                    item.get('customs_post_code'),
                    item.get('risk_score', 0.0)
                ])

            if rows:
                self.client.insert(
                    'customs_declarations',
                    rows,
                    column_names=[
                        'id', 'declaration_number', 'declaration_date', 'exporter_name',
                        'exporter_ueid', 'importer_name', 'importer_ueid', 'hs_code',
                        'hs_description', 'weight_kg', 'value_usd', 'origin_country',
                        'destination_country', 'customs_post_code', 'risk_score'
                    ]
                )
                logger.info("Inserted batch into ClickHouse", count=len(rows))
        except Exception as e:
            logger.error("ClickHouse insertion error", error=str(e))

    def execute_query(self, query: str, params: dict[str, Any] | None = None):
        """Виконує довільний SQL запит."""
        if not self.client:
            self.connect()
        if not self.client:
            logger.warning("ClickHouse недоступний — execute_query пропущено")
            return None
        try:
            return self.client.command(query, parameters=params)
        except Exception as e:
            logger.error("ClickHouse query execution error", query=query, error=str(e))
            raise

    async def insert_dynamic(self, table_name: str, data: list[dict[str, Any]], column_names: list[str]):
        """Динамічна вставка даних у вказану таблицю."""
        if not self.client:
            self.connect()
        if not self.client:
            logger.warning("ClickHouse недоступний — insert_dynamic пропущено")
            return

        if not data:
            return

        try:
            rows = []
            for item in data:
                rows.append([item.get(col) for col in column_names])

            self.client.insert(
                table_name,
                rows,
                column_names=column_names
            )
            logger.info("Inserted dynamic batch into ClickHouse", table=table_name, count=len(rows))
        except Exception as e:
            logger.error("ClickHouse dynamic insertion error", table=table_name, error=str(e))
            raise
