"""Insight Engine — PREDATOR Analytics v61.0-ELITE.

Генерація інтелектуальних висновків та пояснень для аналітиків.
Використовує AIService для інтерпретації складних графових та статистичних даних.
"""
from typing import Any

from app.services.ai_service import AIService
from predator_common.logging import get_logger

logger = get_logger("insight_engine")

class InsightEngine:
    @staticmethod
    async def generate_company_summary(
        company_data: dict[str, Any],
        risk_data: dict[str, Any],
        anomalies: list[dict[str, Any]],
        graph_data: dict[str, Any] | None = None
    ) -> str:
        """Генерує комплексний звіт по компанії."""
        prompt = f"""
        Ти — Lead OSINT Analyst платформи PREDATOR. Проаналізуй дані та дай короткий, жорсткий та професійний висновок (українською мовою).

        Компанія: {company_data.get('name')} (ЄДРПОУ: {company_data.get('edrpou')})
        CERS Score: {risk_data.get('score')} ({risk_data.get('level')})

        Аналітичні шари:
        - Behavioral: {risk_data.get('layers', {}).get('behavioral', {}).get('score')} - {risk_data.get('layers', {}).get('behavioral', {}).get('explanation')}
        - Structural: {risk_data.get('layers', {}).get('structural', {}).get('score')}

        Виявлені аномалії:
        {json.dumps(anomalies[:5], indent=2, ensure_ascii=False)}

        Графові зв'язки:
        {json.dumps(graph_data or {}, indent=2, ensure_ascii=False)}

        Формат відповіді:
        1. РЕЗЮМЕ РИЗИКУ (1 речення)
        2. КЛЮЧОВІ ФАКТОРИ (bullet points)
        3. РЕКОМЕНДАЦІЯ (дії для інспектора)
        """

        try:
            insight = await AIService.generate_insight(prompt, context={"ueid": company_data.get("ueid")})
            return insight
        except Exception as e:
            logger.error(f"Failed to generate insight: {e}")
            return "Не вдалося згенерувати автоматичний висновок. Спробуйте пізніше."

import json
