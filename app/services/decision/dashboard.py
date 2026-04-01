"""
📊 Decision Intelligence Dashboard

Аналітична панель для Decision Intelligence Engine.
Підтримує:
- Real-time метрики та KPI
- Візуалізацію ризиків та тенденцій
- Інтерактивні графіки та чарти
- Експорт даних та звітів
- Customizable widgets

Компоненти:
- DashboardEngine — основний двигун панелі
- WidgetManager — менеджер віджетів
- MetricsCollector — збирач метрик
- ChartGenerator — генератор графіків
- DataExporter — експортер даних
"""

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import pandas as pd

logger = logging.getLogger("predator.decision.dashboard")


class WidgetType(str, Enum):
    """Типи віджетів"""
    KPI_CARD = "kpi_card"
    LINE_CHART = "line_chart"
    BAR_CHART = "bar_chart"
    PIE_CHART = "pie_chart"
    TABLE = "table"
    GAUGE = "gauge"
    HEATMAP = "heatmap"
    TREND = "trend"


class TimeRange(str, Enum):
    """Часові діапазони"""
    LAST_24H = "last_24h"
    LAST_7D = "last_7d"
    LAST_30D = "last_30d"
    LAST_90D = "last_90d"
    CUSTOM = "custom"


@dataclass
class WidgetConfig:
    """Конфігурація віджету"""
    id: str
    type: WidgetType
    title: str
    position: Dict[str, int]  # {x, y, width, height}
    data_source: str
    time_range: TimeRange
    refresh_interval: int = 300  # секунди
    parameters: Dict[str, Any] = None


@dataclass
class DashboardData:
    """Дані панелі"""
    widget_id: str
    data: Any
    timestamp: datetime
    metadata: Dict[str, Any] = None


class MetricsCollector:
    """Збирач метрик для панелі"""
    
    def __init__(self):
        self.metrics_cache: Dict[str, Any] = {}
        self.last_update = None
    
    async def collect_kpi_metrics(self) -> Dict[str, Any]:
        """Зібрати KPI метрики"""
        try:
            # Демонстраційні дані KPI
            metrics = {
                "total_companies_analyzed": 15420,
                "high_risk_companies": 1247,
                "avg_risk_score": 34.5,
                "total_savings_identified": 2450000,
                "active_alerts": 23,
                "reports_generated_today": 47,
                "batch_analyses_completed": 156,
                "avg_processing_time_ms": 125
            }
            
            # Розрахунок похідних метрик
            metrics["risk_ratio"] = metrics["high_risk_companies"] / metrics["total_companies_analyzed"] * 100
            metrics["savings_per_company"] = metrics["total_savings_identified"] / max(1, metrics["total_companies_analyzed"])
            
            self.metrics_cache.update(metrics)
            self.last_update = datetime.now(UTC)
            
            return metrics
            
        except Exception as e:
            logger.error("Error collecting KPI metrics: %s", e)
            return {}
    
    async def collect_risk_trends(self, time_range: TimeRange) -> List[Dict[str, Any]]:
        """Зібрати тренд ризиків"""
        try:
            # Генерація часових даних трендів
            days = self._get_days_from_range(time_range)
            base_date = datetime.now(UTC) - timedelta(days=days)
            
            trends = []
            for i in range(days):
                date = base_date + timedelta(days=i)
                
                # Симуляція даних тренду
                base_score = 35 + 10 * (i / days)  # Зростаючий тренд
                noise = (hash(str(date)) % 100 - 50) / 10  # Випадкові коливання
                score = max(0, min(100, base_score + noise))
                
                trends.append({
                    "date": date.strftime("%Y-%m-%d"),
                    "avg_risk_score": round(score, 1),
                    "high_risk_count": int(score * 0.15),
                    "total_analyzed": int(500 + i * 2)
                })
            
            return trends
            
        except Exception as e:
            logger.error("Error collecting risk trends: %s", e)
            return []
    
    async def collect_procurement_metrics(self) -> Dict[str, Any]:
        """Зібрати закупівельні метрики"""
        try:
            metrics = {
                "total_suppliers": 342,
                "active_suppliers": 287,
                "avg_supplier_rating": 7.8,
                "total_savings_ytd": 1245000,
                "procurement_efficiency": 0.87,
                "top_countries": [
                    {"country": "Китай", "share": 45.2, "avg_price": 850},
                    {"country": "Німеччина", "share": 22.8, "avg_price": 1200},
                    {"country": "США", "share": 18.5, "avg_price": 1450},
                    {"country": "Польща", "share": 8.7, "avg_price": 920},
                    {"country": "Туреччина", "share": 4.8, "avg_price": 780}
                ],
                "monthly_savings": [
                    {"month": "Січ", "savings": 95000},
                    {"month": "Лют", "savings": 112000},
                    {"month": "Бер", "savings": 98000},
                    {"month": "Квіт", "savings": 134000},
                    {"month": "Трав", "savings": 145000},
                    {"month": "Черв", "savings": 128000}
                ]
            }
            
            return metrics
            
        except Exception as e:
            logger.error("Error collecting procurement metrics: %s", e)
            return {}
    
    async def collect_alert_metrics(self) -> Dict[str, Any]:
        """Зібрати метрики алертів"""
        try:
            metrics = {
                "total_alerts_today": 47,
                "critical_alerts": 3,
                "high_alerts": 12,
                "medium_alerts": 23,
                "low_alerts": 9,
                "alert_types": {
                    "HIGH_RISK": 15,
                    "MARKET_OPPORTUNITY": 8,
                    "SYSTEM_ERROR": 2,
                    "BATCH_COMPLETE": 22
                },
                "alert_channels": {
                    "email": 35,
                    "telegram": 28,
                    "webhook": 15,
                    "slack": 12
                },
                "response_times": {
                    "avg_response_time_min": 8.5,
                    "critical_response_time_min": 2.1,
                    "high_response_time_min": 5.2
                }
            }
            
            return metrics
            
        except Exception as e:
            logger.error("Error collecting alert metrics: %s", e)
            return {}
    
    def _get_days_from_range(self, time_range: TimeRange) -> int:
        """Отримати кількість днів з діапазону"""
        mapping = {
            TimeRange.LAST_24H: 1,
            TimeRange.LAST_7D: 7,
            TimeRange.LAST_30D: 30,
            TimeRange.LAST_90D: 90,
            TimeRange.CUSTOM: 30
        }
        return mapping.get(time_range, 30)


class ChartGenerator:
    """Генератор графіків для панелі"""
    
    def __init__(self):
        self.chart_cache: Dict[str, Any] = {}
    
    async def generate_kpi_card(self, metrics: Dict[str, Any], config: WidgetConfig) -> Dict[str, Any]:
        """Генерація KPI картки"""
        try:
            metric_name = config.parameters.get("metric", "total_companies_analyzed")
            value = metrics.get(metric_name, 0)
            
            # Форматування значення
            if metric_name in ["total_savings_identified", "total_savings_ytd"]:
                formatted_value = f"${value:,.0f}"
            elif metric_name == "avg_processing_time_ms":
                formatted_value = f"{value}мс"
            elif metric_name in ["risk_ratio", "procurement_efficiency"]:
                formatted_value = f"{value:.1%}"
            else:
                formatted_value = f"{value:,}"
            
            # Визначення тренду
            trend = self._calculate_trend(metric_name, value)
            
            return {
                "type": "kpi_card",
                "title": config.title,
                "value": formatted_value,
                "raw_value": value,
                "trend": trend,
                "color": self._get_kpi_color(metric_name, value),
                "icon": self._get_kpi_icon(metric_name),
                "timestamp": datetime.now(UTC).isoformat()
            }
            
        except Exception as e:
            logger.error("Error generating KPI card: %s", e)
            return {"error": str(e)}
    
    async def generate_line_chart(self, data: List[Dict[str, Any]], config: WidgetConfig) -> Dict[str, Any]:
        """Генерація лінійного графіка"""
        try:
            x_field = config.parameters.get("x_field", "date")
            y_field = config.parameters.get("y_field", "value")
            
            chart_data = {
                "type": "line_chart",
                "title": config.title,
                "data": [
                    {
                        "x": item[x_field],
                        "y": item[y_field]
                    }
                    for item in data
                ],
                "options": {
                    "responsive": True,
                    "scales": {
                        "x": {"title": x_field.replace("_", " ").title()},
                        "y": {"title": y_field.replace("_", " ").title()}}
                    },
                    "plugins": {
                        "legend": {"display": True}
                    }
                },
                "timestamp": datetime.now(UTC).isoformat()
            }
            
            return chart_data
            
        except Exception as e:
            logger.error("Error generating line chart: %s", e)
            return {"error": str(e)}
    
    async def generate_bar_chart(self, data: List[Dict[str, Any]], config: WidgetConfig) -> Dict[str, Any]:
        """Генерація стовпчикового графіка"""
        try:
            x_field = config.parameters.get("x_field", "name")
            y_field = config.parameters.get("y_field", "value")
            
            chart_data = {
                "type": "bar_chart",
                "title": config.title,
                "data": [
                    {
                        "x": item[x_field],
                        "y": item[y_field]
                    }
                    for item in data
                ],
                "options": {
                    "responsive": True,
                    "scales": {
                        "x": {"title": x_field.replace("_", " ").title()},
                        "y": {"title": y_field.replace("_", " ").title()}}
                    },
                    "plugins": {
                        "legend": {"display": False}
                    }
                },
                "timestamp": datetime.now(UTC).isoformat()
            }
            
            return chart_data
            
        except Exception as e:
            logger.error("Error generating bar chart: %s", e)
            return {"error": str(e)}
    
    async def generate_pie_chart(self, data: List[Dict[str, Any]], config: WidgetConfig) -> Dict[str, Any]:
        """Генерація кругового графіка"""
        try:
            label_field = config.parameters.get("label_field", "name")
            value_field = config.parameters.get("value_field", "value")
            
            chart_data = {
                "type": "pie_chart",
                "title": config.title,
                "data": [
                    {
                        "label": item[label_field],
                        "value": item[value_field]
                    }
                    for item in data
                ],
                "options": {
                    "responsive": True,
                    "plugins": {
                        "legend": {"position": "right"}
                    }
                },
                "timestamp": datetime.now(UTC).isoformat()
            }
            
            return chart_data
            
        except Exception as e:
            logger.error("Error generating pie chart: %s", e)
            return {"error": str(e)}
    
    async def generate_table(self, data: List[Dict[str, Any]], config: WidgetConfig) -> Dict[str, Any]:
        """Генерація таблиці"""
        try:
            columns = config.parameters.get("columns", [])
            if not columns and data:
                columns = list(data[0].keys())
            
            table_data = {
                "type": "table",
                "title": config.title,
                "columns": columns,
                "rows": [
                    [str(item.get(col, "")) for col in columns]
                    for item in data[:config.parameters.get("limit", 100)]
                ],
                "pagination": {
                    "total": len(data),
                    "page_size": config.parameters.get("limit", 100)
                },
                "timestamp": datetime.now(UTC).isoformat()
            }
            
            return table_data
            
        except Exception as e:
            logger.error("Error generating table: %s", e)
            return {"error": str(e)}
    
    def _calculate_trend(self, metric: str, current_value: float) -> str:
        """Розрахувати тренд метрики"""
        # Імітація розрахунку тренду
        if metric in ["total_companies_analyzed", "total_savings_identified"]:
            return "up"  # Зростаючі метрики
        elif metric in ["high_risk_companies", "avg_risk_score"]:
            return "down"  # Бажано зменшуються
        else:
            return "stable"
    
    def _get_kpi_color(self, metric: str, value: float) -> str:
        """Отримати колір KPI"""
        if metric == "avg_risk_score":
            if value >= 50:
                return "red"
            elif value >= 30:
                return "yellow"
            else:
                return "green"
        elif metric == "procurement_efficiency":
            if value >= 0.8:
                return "green"
            elif value >= 0.6:
                return "yellow"
            else:
                return "red"
        elif metric in ["total_savings_identified", "total_savings_ytd"]:
            return "green" if value > 0 else "gray"
        else:
            return "blue"
    
    def _get_kpi_icon(self, metric: str) -> str:
        """Отримати іконку KPI"""
        icon_mapping = {
            "total_companies_analyzed": "🏢",
            "high_risk_companies": "⚠️",
            "avg_risk_score": "📊",
            "total_savings_identified": "💰",
            "active_alerts": "🔔",
            "reports_generated_today": "📋",
            "batch_analyses_completed": "📦",
            "avg_processing_time_ms": "⚡"
        }
        return icon_mapping.get(metric, "📈")


class WidgetManager:
    """Менеджер віджетів панелі"""
    
    def __init__(self):
        self.widgets: Dict[str, WidgetConfig] = {}
        self.widget_data: Dict[str, DashboardData] = {}
        self.metrics_collector = MetricsCollector()
        self.chart_generator = ChartGenerator()
    
    def add_widget(self, config: WidgetConfig):
        """Додати віджет"""
        self.widgets[config.id] = config
        logger.info("Added widget: %s", config.id)
    
    def remove_widget(self, widget_id: str):
        """Видалити віджет"""
        if widget_id in self.widgets:
            del self.widgets[widget_id]
            if widget_id in self.widget_data:
                del self.widget_data[widget_id]
            logger.info("Removed widget: %s", widget_id)
    
    async def refresh_widget(self, widget_id: str) -> Optional[DashboardData]:
        """Оновити дані віджету"""
        if widget_id not in self.widgets:
            return None
        
        config = self.widgets[widget_id]
        
        try:
            # Збір даних залежно від типу віджету
            if config.data_source == "kpi_metrics":
                metrics = await self.metrics_collector.collect_kpi_metrics()
                chart_data = await self.chart_generator.generate_kpi_card(metrics, config)
            elif config.data_source == "risk_trends":
                trends = await self.metrics_collector.collect_risk_trends(config.time_range)
                chart_data = await self.chart_generator.generate_line_chart(trends, config)
            elif config.data_source == "procurement_metrics":
                metrics = await self.metrics_collector.collect_procurement_metrics()
                
                if config.type == WidgetType.BAR_CHART:
                    data = metrics.get("top_countries", [])
                    chart_data = await self.chart_generator.generate_bar_chart(data, config)
                elif config.type == WidgetType.LINE_CHART:
                    data = metrics.get("monthly_savings", [])
                    chart_data = await self.chart_generator.generate_line_chart(data, config)
                else:
                    chart_data = {"error": "Unsupported chart type for procurement metrics"}
            elif config.data_source == "alert_metrics":
                metrics = await self.metrics_collector.collect_alert_metrics()
                
                if config.type == WidgetType.PIE_CHART:
                    data = [{"name": k, "value": v} for k, v in metrics.get("alert_types", {}).items()]
                    chart_data = await self.chart_generator.generate_pie_chart(data, config)
                elif config.type == WidgetType.TABLE:
                    data = [{"type": k, "count": v} for k, v in metrics.get("alert_types", {}).items()]
                    chart_data = await self.chart_generator.generate_table(data, config)
                else:
                    chart_data = {"error": "Unsupported chart type for alert metrics"}
            else:
                chart_data = {"error": f"Unknown data source: {config.data_source}"}
            
            # Збереження даних
            dashboard_data = DashboardData(
                widget_id=widget_id,
                data=chart_data,
                timestamp=datetime.now(UTC)
            )
            
            self.widget_data[widget_id] = dashboard_data
            return dashboard_data
            
        except Exception as e:
            logger.error("Error refreshing widget %s: %s", widget_id, e)
            return None
    
    async def refresh_all_widgets(self) -> Dict[str, DashboardData]:
        """Оновити всі віджети"""
        tasks = []
        for widget_id in self.widgets:
            task = asyncio.create_task(self.refresh_widget(widget_id))
            tasks.append(task)
        
        results = {}
        if tasks:
            completed = await asyncio.gather(*tasks, return_exceptions=True)
            
            for i, widget_id in enumerate(self.widgets):
                if not isinstance(completed[i], Exception):
                    results[widget_id] = completed[i]
        
        return results
    
    def get_widget_data(self, widget_id: str) -> Optional[DashboardData]:
        """Отримати дані віджету"""
        return self.widget_data.get(widget_id)
    
    def get_all_widgets(self) -> Dict[str, WidgetConfig]:
        """Отримати всі віджети"""
        return self.widgets.copy()


class DashboardEngine:
    """Основний двигун аналітичної панелі"""
    
    def __init__(self):
        self.widget_manager = WidgetManager()
        self.is_running = False
        self.refresh_task = None
    
    def create_default_dashboard(self):
        """Створити панель за замовчуванням"""
        # KPI картки
        self.widget_manager.add_widget(WidgetConfig(
            id="total_companies",
            type=WidgetType.KPI_CARD,
            title="Всього компаній проаналізовано",
            position={"x": 0, "y": 0, "width": 3, "height": 2},
            data_source="kpi_metrics",
            time_range=TimeRange.LAST_30D,
            parameters={"metric": "total_companies_analyzed"}
        ))
        
        self.widget_manager.add_widget(WidgetConfig(
            id="high_risk_companies",
            type=WidgetType.KPI_CARD,
            title="Високоризикові компанії",
            position={"x": 3, "y": 0, "width": 3, "height": 2},
            data_source="kpi_metrics",
            time_range=TimeRange.LAST_30D,
            parameters={"metric": "high_risk_companies"}
        ))
        
        self.widget_manager.add_widget(WidgetConfig(
            id="total_savings",
            type=WidgetType.KPI_CARD,
            title="Загальна економія",
            position={"x": 6, "y": 0, "width": 3, "height": 2},
            data_source="kpi_metrics",
            time_range=TimeRange.LAST_30D,
            parameters={"metric": "total_savings_identified"}
        ))
        
        self.widget_manager.add_widget(WidgetConfig(
            id="avg_processing_time",
            type=WidgetType.KPI_CARD,
            title="Середній час обробки",
            position={"x": 9, "y": 0, "width": 3, "height": 2},
            data_source="kpi_metrics",
            time_range=TimeRange.LAST_24H,
            parameters={"metric": "avg_processing_time_ms"}
        ))
        
        # Графіки
        self.widget_manager.add_widget(WidgetConfig(
            id="risk_trends",
            type=WidgetType.LINE_CHART,
            title="Тренд ризиків",
            position={"x": 0, "y": 2, "width": 6, "height": 4},
            data_source="risk_trends",
            time_range=TimeRange.LAST_30D,
            parameters={"x_field": "date", "y_field": "avg_risk_score"}
        ))
        
        self.widget_manager.add_widget(WidgetConfig(
            id="top_countries",
            type=WidgetType.BAR_CHART,
            title="Топ країни постачальників",
            position={"x": 6, "y": 2, "width": 6, "height": 4},
            data_source="procurement_metrics",
            time_range=TimeRange.LAST_30D,
            parameters={"x_field": "country", "y_field": "share"}
        ))
        
        self.widget_manager.add_widget(WidgetConfig(
            id="alert_types",
            type=WidgetType.PIE_CHART,
            title="Типи алертів",
            position={"x": 0, "y": 6, "width": 6, "height": 4},
            data_source="alert_metrics",
            time_range=TimeRange.LAST_24H,
            parameters={"label_field": "name", "value_field": "count"}
        ))
        
        self.widget_manager.add_widget(WidgetConfig(
            id="monthly_savings",
            type=WidgetType.LINE_CHART,
            title="Щомісячна економія",
            position={"x": 6, "y": 6, "width": 6, "height": 4},
            data_source="procurement_metrics",
            time_range=TimeRange.LAST_90D,
            parameters={"x_field": "month", "y_field": "savings"}
        ))
        
        logger.info("Default dashboard created with %d widgets", len(self.widget_manager.widgets))
    
    async def start_auto_refresh(self, interval: int = 300):
        """Запустити автоматичне оновлення"""
        if self.is_running:
            return
        
        self.is_running = True
        self.refresh_task = asyncio.create_task(self._auto_refresh_loop(interval))
        logger.info("Dashboard auto-refresh started with %ds interval", interval)
    
    async def stop_auto_refresh(self):
        """Зупинити автоматичне оновлення"""
        self.is_running = False
        if self.refresh_task:
            self.refresh_task.cancel()
            try:
                await self.refresh_task
            except asyncio.CancelledError:
                pass
        logger.info("Dashboard auto-refresh stopped")
    
    async def _auto_refresh_loop(self, interval: int):
        """Цикл автоматичного оновлення"""
        while self.is_running:
            try:
                await self.widget_manager.refresh_all_widgets()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Error in auto-refresh loop: %s", e)
                await asyncio.sleep(60)  # Чекаємо 1 хвилину перед повторною спробою
    
    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Отримати дані панелі"""
        widgets_data = {}
        
        for widget_id, widget_config in self.widget_manager.get_all_widgets().items():
            widget_data = self.widget_manager.get_widget_data(widget_id)
            if widget_data:
                widgets_data[widget_id] = {
                    "config": {
                        "id": widget_config.id,
                        "type": widget_config.type.value,
                        "title": widget_config.title,
                        "position": widget_config.position
                    },
                    "data": widget_data.data,
                    "last_updated": widget_data.timestamp.isoformat()
                }
        
        return {
            "dashboard_id": "decision_intelligence_main",
            "title": "Decision Intelligence Dashboard",
            "widgets": widgets_data,
            "last_refresh": datetime.now(UTC).isoformat(),
            "auto_refresh": self.is_running
        }
    
    async def export_dashboard_data(self, format: str = "json") -> str:
        """Експортувати дані панелі"""
        dashboard_data = await self.get_dashboard_data()
        
        if format == "json":
            return json.dumps(dashboard_data, ensure_ascii=False, indent=2, default=str)
        elif format == "csv":
            # Експорт у CSV формат
            csv_data = []
            for widget_id, widget_info in dashboard_data["widgets"].items():
                if widget_info["data"].get("type") == "table":
                    csv_data.append(f"Widget: {widget_info['config']['title']}")
                    csv_data.append(",".join(widget_info["data"]["columns"]))
                    for row in widget_info["data"]["rows"]:
                        csv_data.append(",".join(row))
                    csv_data.append("")
            
            return "\n".join(csv_data)
        else:
            raise ValueError(f"Unsupported export format: {format}")


# Фабричні функції
def get_dashboard_engine() -> DashboardEngine:
    """Отримати інстанс двигуна панелі"""
    return DashboardEngine()


def get_widget_manager() -> WidgetManager:
    """Отримати інстанс менеджера віджетів"""
    return WidgetManager()


# Приклади використання
async def example_dashboard_usage():
    """Приклади використання аналітичної панелі"""
    
    dashboard = get_dashboard_engine()
    
    # Створення панелі за замовчуванням
    dashboard.create_default_dashboard()
    
    # Запуск автоматичного оновлення
    await dashboard.start_auto_refresh(interval=60)
    
    # Отримання даних панелі
    dashboard_data = await dashboard.get_dashboard_data()
    print("Dashboard data:", json.dumps(dashboard_data, ensure_ascii=False, indent=2, default=str)[:500])
    
    # Експорт даних
    json_export = await dashboard.export_dashboard_data("json")
    print("JSON export length:", len(json_export))
    
    # Зупинка автоматичного оновлення
    await dashboard.stop_auto_refresh()
    
    print("Dashboard example completed!")


if __name__ == "__main__":
    asyncio.run(example_dashboard_usage())
