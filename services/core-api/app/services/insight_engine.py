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
        Ти — Штучний Інтелект PREDATOR Analytics (Elite OSINT Analyzer). 
        Твоє завдання: згенерувати короткий, жорсткий та професійний аналітичний висновок українською мовою.

        Об'єкт аналізу: {company_data.get('name')} (ЄДРПОУ: {company_data.get('edrpou')})
        Системний індекс CERS: {risk_data.get('score')} ({risk_data.get('level')})

        Аналітичні шари:
        - Behavioral: {risk_data.get('layers', {}).get('behavioral', {}).get('score')} - {risk_data.get('layers', {}).get('behavioral', {}).get('explanation')}
        - Structural: {risk_data.get('layers', {}).get('structural', {}).get('score')}

        Виявлені аномалії:
        {json.dumps(anomalies[:5], indent=2, ensure_ascii=False)}

        Графові зв'язки (Knowledge Graph):
        {json.dumps(graph_data or {}, indent=2, ensure_ascii=False)}

        Формат відповіді (суворо дотримуйся):
        1. РЕЗЮМЕ РИЗИКУ (1 чітке речення, що описує головну загрозу).
        2. КЛЮЧОВІ ФАКТОРИ (маркований список з 2-3 найважливіших індикаторів).
        3. РЕКОМЕНДАЦІЯ ДЛЯ ІНСПЕКТОРА (пряма вказівка до дії).
        """

        try:
            insight = await AIService.generate_insight(prompt, context={"ueid": company_data.get("ueid")})
            return insight
        except Exception as e:
            logger.error(f"Failed to generate insight: {e}")
            return "Не вдалося згенерувати автоматичний висновок. Спробуйте пізніше."

import json
