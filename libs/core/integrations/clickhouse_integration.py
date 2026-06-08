"""Інтеграція з ClickHouse для OLAP аналітики.

Модуль для завантаження історичних даних в ClickHouse для швидкої аналітики.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date
import logging
from typing import Any

from clickhouse_connect import get_client as get_clickhouse_client

logger = logging.getLogger(__name__)


@dataclass
class ClickHouseConfig:
    """Конфігурація ClickHouse."""

    host: str = "localhost"
    port: int = 8123
    username: str = "default"
    password: str = ""
    database: str = "predator"


class ClickHouseIntegration:
    """Інтеграція з ClickHouse."""

    def __init__(self, config: ClickHouseConfig):
        self.config = config
        self.client = get_clickhouse_client(
            host=config.host,
            port=config.port,
            username=config.username,
            password=config.password,
            database=config.database,
        )

    def create_declarations_table(self):
        """Створити таблицю декларацій в ClickHouse."""
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS declarations (
            id UUID,
            tenant_id UUID,
            declaration_number String,
            declaration_date Date,
            customs_post String,
            uktzed_code String,
            goods_description String,
            weight_kg Decimal(18, 3),
            value_usd Decimal(18, 2),
            price_per_unit_usd Decimal(18, 4),
            origin_country String,
            destination_country String,
            importer_ueid String,
            importer_edrpou String,
            exporter_name String,
            declaration_type String,
            regime String,
            procedure_code String,
            status String,
            created_at DateTime,
            updated_at DateTime
        ) ENGINE = MergeTree()
        PARTITION BY toYYYYMM(declaration_date)
        ORDER BY (declaration_date, importer_ueid, uktzed_code)
        SETTINGS index_granularity = 8192
        """

        try:
            self.client.command(create_table_sql)
            logger.info("Таблиця declarations створена в ClickHouse")
        except Exception as e:
            logger.error(f"Помилка створення таблиці: {e}")
            raise

    def insert_declaration(self, data: dict[str, Any]) -> int:
        """Вставити декларацію в ClickHouse.
        
        Args:
            data: Дані декларації
            
        Returns:
            Кількість вставлених рядків

        """
        try:
            # Підготовка даних
            row = (
                data.get('id'),
                data.get('tenant_id'),
                data.get('declaration_number'),
                data.get('declaration_date'),
                data.get('customs_post'),
                data.get('uktzed_code'),
                data.get('goods_description'),
                data.get('weight_kg'),
                data.get('value_usd'),
                data.get('price_per_unit_usd'),
                data.get('origin_country'),
                data.get('destination_country'),
                data.get('importer_ueid'),
                data.get('importer_edrpou'),
                data.get('exporter_name'),
                data.get('declaration_type'),
                data.get('regime'),
                data.get('procedure_code'),
                data.get('status'),
                data.get('created_at'),
                data.get('updated_at'),
            )

            # Вставка
            self.client.insert(
                'declarations',
                [row],
                column_names=[
                    'id', 'tenant_id', 'declaration_number', 'declaration_date',
                    'customs_post', 'uktzed_code', 'goods_description', 'weight_kg',
                    'value_usd', 'price_per_unit_usd', 'origin_country', 'destination_country',
                    'importer_ueid', 'importer_edrpou', 'exporter_name', 'declaration_type',
                    'regime', 'procedure_code', 'status', 'created_at', 'updated_at'
                ]
            )

            logger.debug(f"Вставлено декларацію в ClickHouse: {data.get('id')}")
            return 1

        except Exception as e:
            logger.error(f"Помилка вставки в ClickHouse: {e}")
            return 0

    def insert_declarations_batch(self, data_list: list[dict[str, Any]]) -> int:
        """Пакетна вставка декларацій в ClickHouse.
        
        Args:
            data_list: Список даних декларацій
            
        Returns:
            Кількість вставлених рядків

        """
        if not data_list:
            return 0

        try:
            # Підготовка даних
            rows = []
            for data in data_list:
                row = (
                    data.get('id'),
                    data.get('tenant_id'),
                    data.get('declaration_number'),
                    data.get('declaration_date'),
                    data.get('customs_post'),
                    data.get('uktzed_code'),
                    data.get('goods_description'),
                    data.get('weight_kg'),
                    data.get('value_usd'),
                    data.get('price_per_unit_usd'),
                    data.get('origin_country'),
                    data.get('destination_country'),
                    data.get('importer_ueid'),
                    data.get('importer_edrpou'),
                    data.get('exporter_name'),
                    data.get('declaration_type'),
                    data.get('regime'),
                    data.get('procedure_code'),
                    data.get('status'),
                    data.get('created_at'),
                    data.get('updated_at'),
                )
                rows.append(row)

            # Пакетна вставка
            self.client.insert(
                'declarations',
                rows,
                column_names=[
                    'id', 'tenant_id', 'declaration_number', 'declaration_date',
                    'customs_post', 'uktzed_code', 'goods_description', 'weight_kg',
                    'value_usd', 'price_per_unit_usd', 'origin_country', 'destination_country',
                    'importer_ueid', 'importer_edrpou', 'exporter_name', 'declaration_type',
                    'regime', 'procedure_code', 'status', 'created_at', 'updated_at'
                ]
            )

            logger.info(f"Вставлено {len(rows)} декларацій в ClickHouse")
            return len(rows)

        except Exception as e:
            logger.error(f"Помилка пакетної вставки в ClickHouse: {e}")
            return 0

    def optimize_table(self):
        """Оптимізувати таблицю ClickHouse."""
        try:
            self.client.command("OPTIMIZE TABLE declarations FINAL")
            logger.info("Таблиця declarations оптимізована")
        except Exception as e:
            logger.error(f"Помилка оптимізації: {e}")

    def get_monthly_stats(self, start_date: date, end_date: date) -> list[dict[str, Any]]:
        """Отримати щомісячну статистику з ClickHouse.
        
        Args:
            start_date: Початкова дата
            end_date: Кінцева дата
            
        Returns:
            Список статистики

        """
        query = """
        SELECT
            toStartOfMonth(declaration_date) AS month,
            count() AS total_declarations,
            sum(value_usd) AS total_value_usd,
            sum(weight_kg) AS total_weight_kg,
            uniq(importer_ueid) AS unique_importers,
            uniq(uktzed_code) AS unique_uktzed_codes
        FROM declarations
        WHERE declaration_date >= %(start_date)s AND declaration_date <= %(end_date)s
        GROUP BY month
        ORDER BY month
        """

        try:
            result = self.client.query(
                query,
                parameters={
                    'start_date': start_date,
                    'end_date': end_date
                }
            )

            stats = []
            for row in result.named_results():
                stats.append({
                    'month': row['month'],
                    'total_declarations': row['total_declarations'],
                    'total_value_usd': row['total_value_usd'],
                    'total_weight_kg': row['total_weight_kg'],
                    'unique_importers': row['unique_importers'],
                    'unique_uktzed_codes': row['unique_uktzed_codes'],
                })

            return stats

        except Exception as e:
            logger.error(f"Помилка отримання статистики: {e}")
            return []

    def close(self):
        """Закрити з'єднання з ClickHouse."""
        if self.client:
            self.client.close()
            logger.info("З'єднання з ClickHouse закрито")


def get_clickhouse_integration(config: ClickHouseConfig | None = None) -> ClickHouseIntegration:
    """Отримати інстанс інтеграції з ClickHouse."""
    if config is None:
        import os
        config = ClickHouseConfig(
            host=os.getenv("CLICKHOUSE_HOST", "localhost"),
            port=int(os.getenv("CLICKHOUSE_PORT", "8123")),
            username=os.getenv("CLICKHOUSE_USER", "default"),
            password=os.getenv("CLICKHOUSE_PASSWORD", ""),
            database=os.getenv("CLICKHOUSE_DATABASE", "predator"),
        )
    return ClickHouseIntegration(config)
