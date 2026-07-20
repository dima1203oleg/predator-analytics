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

    def init_schema(self) -> None:
        """Ініціалізація DDL для таблиць."""
        if not self.client:
            self.connect()
        if not self.client:
            return
            
        self.client.command("CREATE DATABASE IF NOT EXISTS predator_analytics")
        
        self.client.command("""
        CREATE TABLE IF NOT EXISTS predator_analytics.prozorro_tenders (
            tender_id String,
            date_modified DateTime,
            procuring_entity_edrpou String,
            procuring_entity_name String,
            status String,
            procurement_method String,
            value_amount Float64,
            value_currency String,
            title String,
            description String,
            ingested_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY (date_modified, tender_id)
        """)
        
        self.client.command("""
        CREATE TABLE IF NOT EXISTS predator_analytics.osint_dossiers (
            job_id String,
            entity_id String,
            entity_type String,
            name String,
            risk_score Float64,
            dossier_json String,
            created_at DateTime DEFAULT now()
        ) ENGINE = MergeTree()
        ORDER BY (created_at, entity_id)
        """)
        logger.info("ClickHouse schema initialized for prozorro_tenders and osint_dossiers")

    async def insert_prozorro_tenders(self, tenders_data: list[dict[str, Any]]) -> None:
        """Вставка тендерів батчем."""
        if not self.client:
            self.connect()
        if not self.client or not tenders_data:
            return

        column_names = [
            "tender_id", "date_modified", "procuring_entity_edrpou", "procuring_entity_name",
            "status", "procurement_method", "value_amount", "value_currency",
            "title", "description"
        ]
        
        rows = []
        for item in tenders_data:
            date_modified = item.get("date_modified", "")
            if date_modified and "T" in date_modified:
                date_modified = date_modified.split(".")[0][:19].replace("T", " ")
            else:
                date_modified = "1970-01-01 00:00:00"

            rows.append([
                item.get("tender_id", ""),
                date_modified,
                item.get("procuring_entity_edrpou", ""),
                item.get("procuring_entity_name", ""),
                item.get("status", ""),
                item.get("procurement_method", ""),
                float(item.get("value_amount", 0.0)) if item.get("value_amount") is not None else 0.0,
                item.get("value_currency", "UAH"),
                item.get("title", ""),
                item.get("description", ""),
            ])

        try:
            import asyncio
            await asyncio.to_thread(
                self.client.insert,
                "prozorro_tenders",
                rows,
                column_names=column_names
            )
            logger.info("Inserted batch of tenders into ClickHouse", count=len(rows))
        except Exception as e:
            logger.error("ClickHouse insertion error for prozorro_tenders", error=str(e))

    async def insert_declarations(self, data: list[dict[str, Any]]):
        if not self.client:
            self.connect()

        if not self.client:
            return

        try:
            # Мапінг даних до колонок ClickHouse
            from dateutil.parser import parse as parse_date

            rows = []
            for item in data:
                decl_date_raw = item.get("declaration_date")
                decl_date = None
                if decl_date_raw:
                    try:
                        decl_date = parse_date(str(decl_date_raw)).date()
                    except Exception:
                        decl_date = None

                rows.append([
                    str(item.get('_record_hash'))[:32] if item.get('_record_hash') else "00000000-0000-0000-0000-000000000000", # id
                    str(item.get('declaration_number')) if item.get('declaration_number') is not None else "",
                    decl_date,
                    str(item.get("exporter_name")) if item.get("exporter_name") is not None else "",
                    str(item.get("exporter_ueid")) if item.get("exporter_ueid") is not None else "",
                    str(item.get("importer_name") or item.get("company_name") or ""),
                    str(item.get("ueid")) if item.get("ueid") is not None else "",
                    str(item.get("uktzed_code")) if item.get("uktzed_code") is not None else "000000",
                    str(item.get("product_description")) if item.get("product_description") is not None else "", # hs_description
                    float(item.get('weight')) if item.get('weight') is not None else 0.0,        # weight_kg
                    float(item.get('customs_value')) if item.get('customs_value') is not None else 0.0, # value_usd
                    str(item.get('country_origin')) if item.get('country_origin') is not None else "",# origin_country
                    str(item.get('customs_post')) if item.get('customs_post') is not None else "", # destination_country
                    str(item.get('customs_post')) if item.get('customs_post') is not None else "", # customs_post_code
                    0.0, # risk_score
                ])

            if rows:
                import asyncio
                await asyncio.to_thread(
                    self.client.insert,
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
            # Використовуємо .query() для отримання результатів (рядків)
            return self.client.query(query, parameters=params).result_rows
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

    async def insert_osint_dossier(self, dossier_data: dict[str, Any]) -> None:
        """Збереження повного OSINT досьє."""
        if not self.client:
            self.connect()
        if not self.client:
            return

        import json
        import asyncio
        try:
            row = [
                str(dossier_data.get("job_id", "")),
                str(dossier_data.get("entity_id", "")),
                str(dossier_data.get("entity_type", "")),
                str(dossier_data.get("name", "")),
                float(dossier_data.get("risk_score", 0.0)),
                json.dumps(dossier_data.get("dossier", {}), ensure_ascii=False)
            ]
            
            await asyncio.to_thread(
                self.client.insert,
                "osint_dossiers",
                [row],
                column_names=["job_id", "entity_id", "entity_type", "name", "risk_score", "dossier_json"]
            )
            logger.info("Inserted OSINT dossier into ClickHouse", entity_id=dossier_data.get("entity_id"))
        except Exception as e:
            logger.error("ClickHouse insertion error for osint_dossiers", error=str(e))
