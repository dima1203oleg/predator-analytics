"""OMNIVERSE Briefing Service — Генерація стратегічних звітів.

Агрегує дані з усіх модулів OMNIVERSE для створення Executive Summary.
"""
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_clickhouse_client
from app.services.elite_risk_engine import EliteRiskEngine
from app.services.forecast_service import ForecastService
from predator_common.logging import get_logger

logger = get_logger("core_api.omniverse_briefing")

class OmniverseBriefing:
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.client = get_clickhouse_client()

    async def generate_entity_intelligence_brief(
        self,
        ueid: str,
        db: AsyncSession
    ) -> dict[str, Any]:
        """Генерує глибокий аналітичний звіт для конкретної сутності."""
        logger.info(f"Generating high-fidelity intelligence brief for {ueid}")

        # 1. Розраховуємо повний ризик через EliteRiskEngine
        risk_engine = EliteRiskEngine(db)
        risk_data = await risk_engine.compute_full_risk(ueid, self.tenant_id)

        # 2. Отримуємо прогнози попиту/діяльності
        # (Використовуємо ueid як product_code для демонстрації агрегації)
        forecast_service = ForecastService()
        forecast_data = await forecast_service.get_demand_forecast(ueid)

        # 3. Формуємо стратегічний контекст
        brief = {
            "entity_ueid": ueid,
            "risk_assessment": {
                "cers_score": risk_data["cers"],
                "risk_level": risk_data["level"],
                "layer_breakdown": risk_data["layers"]
            },
            "predictive_analytics": {
                "forecast_trend": forecast_data.get("forecast", []),
                "confidence": forecast_data.get("confidence_score", 0.0),
                "interpretation": forecast_data.get("interpretation_uk", "")
            },
            "ai_executive_summary": (
                f"Компанія {ueid} має рівень ризику {risk_data['level']} ({risk_data['cers']}). "
                f"Прогноз діяльності показує {forecast_data.get('interpretation_uk', 'стабільний тренд')}. "
                f"Рекомендовано: {'Посилений моніторинг' if risk_data['cers'] > 50 else 'Стандартний нагляд'}."
            )
        }

        return brief

    async def generate_executive_brief(self) -> dict[str, Any]:
        """Генерує зведення останніх подій та інсайтів."""
        try:
            # 1. Отримуємо останні алерти (Watchdog)
            alerts_query = f"SELECT id, severity, message, company, detected_at FROM omniverse_alerts WHERE tenant_id = '{self.tenant_id}' ORDER BY detected_at DESC LIMIT 5"
            alerts_res = self.client.query(alerts_query)
            alerts = [dict(zip(alerts_res.column_names, row)) for row in alerts_res.result_rows]

            # 2. Отримуємо статистику по таблицях
            tables_query = f"SHOW TABLES LIKE 'omniverse_{self.tenant_id}_%'"
            tables_res = self.client.query(tables_query)
            table_count = len(tables_res.result_rows)

            # 3. Формуємо AI Briefing (через AIService в роутері)
            # Тут ми просто повертаємо агреговані дані, які AI перетворить на текст у роутері

            return {
                "summary": {
                    "total_datasets": table_count,
                    "active_alerts": len(alerts),
                    "last_scan": alerts[0]["detected_at"] if alerts else None
                },
                "key_findings": alerts,
                "strategic_outlook": "POSITIVE" if not alerts else "NEUTRAL"
            }
        except Exception as e:
            logger.error(f"Error generating brief: {e}")
            return {"error": str(e)}
