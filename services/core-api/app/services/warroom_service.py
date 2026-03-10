"""
WarRoom Service — PREDATOR Analytics v55.1 Ironclad.

Situation reports, attack plans, and strategic insights.
"""
from typing import Dict, Any, List
from app.services.ai_service import AIService

class WarRoomService:
    @staticmethod
    async def generate_attack_plan(ueid: str, context: Dict[str, Any]) -> str:
        """
        Генерація стратегічного плану розслідування (Attack Plan) v55.2.
        Використовує канонічні шари CERS (Behavioral, Institutional, Influence, Structural, Predictive).
        """
        prompt = f"""
        Сформулюй стратегічний ПЛАН АТАКИ (Attack Plan) для сутності UEID: {ueid}.
        Використовуй дані 5-шарового аналізу за специфікацією v55.2-SM-EXTENDED.
        
        Контекст даних: {context}
        
        Структура плану:
        1. STRATEGIC OVERVIEW: Загальна оцінка небезпеки.
        2. VULNERABILITY MATRIX: Аналіз найслабших шарів (напр. Institutional або Structural).
        3. SHADOW DISCOVERY: План пошуку прихованих зв'язків та UBO.
        4. OPERATIONAL STEPS: Конкретні кроки для аналітика (запити, аудит, моніторинг).
        5. RISK PROJECTION: Прогноз негативного впливу на 30/90 днів.
        
        Мова: Українська. Формат: Markdown з використанням тактичної термінології.
        """
        
        return await AIService.generate_insight(prompt, context)
