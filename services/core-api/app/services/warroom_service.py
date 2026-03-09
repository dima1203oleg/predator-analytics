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
        Генерація плану дій (Attack Plan) для розслідування конкретної сутності.
        """
        prompt = f"""
        Ти - стратегічний аналітик PREDATOR. Проаналізуй наступну сутність (UEID: {ueid}) та її контекст:
        {context}
        
        Сформулюй детальний 'План атаки' (Attack Plan):
        1. Найбільш вразливі місця (ризикові вузли).
        2. Рекомендовані запити до реєстрів.
        3. Гіпотези щодо прихованих бенефіціарів.
        4. Оцінка загрози національній безпеці.
        
        Відповідь надай українською мовою у форматі Markdown.
        """
        
        messages = [
            {"role": "system", "content": "Ти професіонал OSINT та економічної розвідки."},
            {"role": "user", "content": prompt}
        ]
        
        return await AIService.chat_completion(messages)
