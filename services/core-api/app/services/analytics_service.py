"""Analytics Service — Аналітичний двигун на базі ClickHouse.

Цей сервіс відповідає за швидку агрегацію великих масивів даних для Dashboard та Analytics.
"""
from typing import Any, Dict, List
from datetime import datetime, timedelta
from app.database import get_clickhouse_client
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """Сервіс для виконання OLAP-запитів до ClickHouse."""

    def __init__(self):
        self.client = get_clickhouse_client()

    def get_dashboard_stats(self, tenant_id: str) -> Dict[str, Any]:
        """Отримати агреговану статистику для дашборду."""
        try:
            # 1. Загальна сума та кількість декларацій
            stats_query = f\"\"\"
                SELECT 
                    count() as total_count,
                    sum(customs_value_usd) as total_value,
                    countIf(direction = 'import') as import_count,
                    countIf(direction = 'export') as export_count
                FROM customs_declarations
                WHERE tenant_id = '{tenant_id}'
            \"\"\"
            stats_result = self.client.query(stats_query)
            
            if not stats_result.result_rows:
                return {}

            row = stats_result.result_rows[0]
            
            # 2. Топ категорій (УКТЗЕД)
            categories_query = f\"\"\"
                SELECT 
                    substring(uktzed_code, 1, 4) as cat_code,
                    count() as count,
                    sum(customs_value_usd) as value
                FROM customs_declarations
                WHERE tenant_id = '{tenant_id}'
                GROUP BY cat_code
                ORDER BY count DESC
                LIMIT 5
            \"\"\"
            cat_result = self.client.query(categories_query)
            categories = {{row[0]: {{"count": row[1], "value": row[2]}} for row in cat_result.result_rows}}

            # 3. Топ країн
            countries_query = f\"\"\"
                SELECT 
                    origin_country,
                    count() as count,
                    sum(customs_value_usd) as value
                FROM customs_declarations
                WHERE tenant_id = '{tenant_id}'
                GROUP BY origin_country
                ORDER BY value DESC
                LIMIT 5
            \"\"\"
            country_result = self.client.query(countries_query)
            countries = {{row[0]: {{"count": row[1], "value": row[2]}} for row in country_result.result_rows}}

            return {{
                "total_count": row[0],
                "total_value_usd": row[1],
                "import_count": row[2],
                "export_count": row[3],
                "categories": categories,
                "countries": countries
            }}
        except Exception as e:
            logger.error(f"Error fetching ClickHouse stats: {{e}}")
            return {{}}

    def get_anomaly_trends(self, tenant_id: str, days: int = 30) -> Dict[str, Any]:
        """Отримати тренди системних подій (як проксі для аномалій)."""
        try:
            query = f\"\"\"
                SELECT 
                    toDate(timestamp) as date,
                    event_type,
                    count() as count
                FROM system_events
                WHERE tenant_id = '{tenant_id}' 
                  AND timestamp > now() - INTERVAL {{days}} DAY
                GROUP BY date, event_type
                ORDER BY date ASC
            \"\"\"
            result = self.client.query(query)
            
            daily_counts = []
            for row in result.result_rows:
                daily_counts.append({{
                    "date": row[0].isoformat(),
                    "type": row[1],
                    "count": row[2]
                }})
                
            return {{
                "daily_counts": daily_counts
            }}
        except Exception as e:
            logger.error(f"Error fetching anomaly trends: {{e}}")
            return {{"daily_counts": []}}
