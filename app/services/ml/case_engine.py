from __future__ import annotations

from datetime import datetime
import logging
from typing import Any, Dict, List, Optional
import uuid

from app.libs.core.database import get_db_ctx
from app.libs.core.models.entities import Case
from app.services.llm.service import llm_service


logger = logging.getLogger("service.case_engine")

class CaseEngineService:
    """Автоматизований двигун генерації аналітичних кейсів.
    Перетворює результати пошуку та аналізу в структуровані кейси українською мовою.
    """

    async def generate_case_from_analysis(
        self,
        query: str,
        analysis_answer: str,
        sources: list[dict[str, Any]],
        risk_score: int = 50,
        entity_id: str | None = None
    ) -> Case | None:
        """Створює новий аналітичний кейс на основі відповіді AI та джерел."""
        logger.info(f"Генерація кейсу для запиту: {query}")

        try:
            # 1. Формуємо заголовок та резюме через LLM
            prompt = f"""
            На основі наступного аналізу створи короткий, професійний заголовок (до 10 слів)
            та короткий опис ситуації (2-3 речення) українською мовою.

            АНАЛІЗ: {analysis_answer[:2000]}

            Відповідай у форматі JSON:
            {{
                "title": "Заголовок",
                "situation": "Опис ситуації"
            }}
            """

            response = await llm_service.generate_with_routing(
                prompt=prompt,
                system="Ти - головний аналітик системи PREDATOR. Твоє завдання - робити складні дані зрозумілими.",
                mode="precise"
            )

            title = "Аналітичний звіт"
            situation = analysis_answer[:300] + "..."

            if response.success:
                import json
                try:
                    # Clean markdown if any
                    clean_content = response.content.replace("```json", "").replace("```", "").strip()
                    data = json.loads(clean_content)
                    title = data.get("title", title)
                    situation = data.get("situation", situation)
                except:
                    pass

            # 2. Визначаємо статус на основі ризику
            status = "БЕЗПЕЧНО"
            if risk_score > 80: status = "КРИТИЧНО"
            elif risk_score > 50: status = "УВАГА"

            # 3. Зберігаємо в БД
            async with get_db_ctx() as sess:
                new_case = Case(
                    id=uuid.uuid4(),
                    title=title,
                    situation=situation,
                    conclusion=analysis_answer,
                    status=status,
                    risk_score=risk_score,
                    entity_id=entity_id,
                    ai_insight="Виявлено автоматичними алгоритмами Predator v25",
                    evidence=sources # Зберігаємо джерела як докази
                )
                sess.add(new_case)
                await sess.commit()
                # Рефреш для отримання ID
                # await sess.refresh(new_case) # asyncpg might need different approach, or we use the uuid we generated

                logger.info(f"✅ Кейс успішно створено: {new_case.id}")
                return new_case

        except Exception as e:
            logger.exception(f"Помилка при створенні кейсу: {e}")
            return None

case_engine = CaseEngineService()
