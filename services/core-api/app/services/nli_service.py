"""NLI Service (Natural Language Investigation) — PREDATOR Analytics v61.0-ELITE.

Обробка запитів природною мовою, класифікація інтентів, та генерація пояснень (Anomaly Narratives).
"""
import json
from typing import Any

from app.services.ai_service import AIService


class NLIService:
    @staticmethod
    async def process_investigation_query(query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        """
        Аналізує текстовий запит і виконує класифікацію інтенту + витяг параметрів.
        Повертає структурований JSON з наміром, параметрами, кроками думок, та наративом.
        """
        prompt = f"""
        Ти — PREDATOR ORACLE (AI NLI), елітний аналітик-маршрутизатор митних даних України.
        Твоя ціль — проаналізувати запит користувача, класифікувати інтент, витягти сутності та побудувати розслідувальний наратив.

        ЗАПИТ КОРИСТУВАЧА: "{query}"

        ДІЇ:
        1. Визнач `intent`. Дозволені значення: `SEARCH_COMPANY`, `ANALYZE_RISK`, `FIND_ANOMALIES`, `GRAPH_SEARCH`, `GENERAL_INQUIRY`.
        2. Витягни `parameters` (ЄДРПОУ, ПІБ, дати, суми тощо).
        3. Згенеруй `thought_process` (3-4 коротких кроки того, як ти обмірковував цей запит).
        4. Згенеруй `narrative` (Anomaly Narrative) - текстовий аналіз/відповідь на основі запиту (навіть якщо даних немає, поясни що і як шукатиме система).

        Поверни результат СУВОРО у форматі JSON без жодних блоків коду та маркдауну:
        {{
            "intent": "...",
            "parameters": {{"key": "value"}},
            "thought_process": ["крок 1", "крок 2", "крок 3"],
            "narrative": "Твій текст пояснення..."
        }}
        """

        try:
            messages = [{"role": "system", "content": prompt}]
            response_text = await AIService.chat_completion(messages, model="gemini-1.5-pro")
            
            # Clean up markdown
            import re
            clean_json = re.sub(r'```json\s*', '', response_text)
            clean_json = re.sub(r'```\s*', '', clean_json).strip()
            
            data = json.loads(clean_json)
            return data
            
        except Exception as e:
            return {
                "intent": "ERROR",
                "parameters": {},
                "thought_process": ["Помилка доступу до AI ядра", str(e)],
                "narrative": "Виникла помилка під час класифікації вашого запиту."
            }
