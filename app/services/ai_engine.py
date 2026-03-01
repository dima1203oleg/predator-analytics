from __future__ import annotations


"""AI Engine Service - Core AI analysis capabilities
Combines LLM with Ukrainian data sources for intelligent analysis.
"""
from dataclasses import dataclass
from datetime import UTC, datetime
import logging
from typing import Any

from app.connectors.prozorro import prozorro_connector
from app.connectors.registry import registry_connector

from .llm import llm_service


logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    query: str
    answer: str
    sources: list[dict[str, Any]]
    confidence: float
    processing_time_ms: float
    model_used: str
    timestamp: datetime


from app.core.prompts import get_prompt


class AIEngine:
    """Core AI Engine for Predator Analytics
    Combines LLM capabilities with real Ukrainian data sources.
    """

    def __init__(self):
        self.system_prompt = get_prompt("analyst")

    async def analyze(
        self,
        query: str,
        sectors: list[str] | None = None,
        depth: str = "standard",
        llm_mode: str = "auto",
        preferred_provider: str | None = None,
        tenant_id: str = "default",
    ) -> AnalysisResult:
        """Виконує всебічний аналіз:
        1. Зовнішні реєстри (Prozorro, EDR).
        2. Внутрішні дані (OpenSearch + Qdrant через Hybrid Search).
        3. Генерація висновків через LLM.
        4. Автоматичне створення Кейсу.
        """
        import time

        from .ml.case_engine import case_engine
        from .search_fusion import hybrid_search_with_rrf

        start_time = time.time()
        sectors = sectors or ["GOV", "BIZ"]
        sources = []
        context_parts = []

        # 1. Зовнішні реєстри
        try:
            # Пошук в ЄДР
            edr_result = await registry_connector.search(query, limit=5)
            if edr_result.success and edr_result.data:
                sources.append({"name": "ЄДР (Реєстр бізнесу)", "type": "registry", "data": edr_result.data[:3]})
                context_parts.append(f"Дані ЄДР: {edr_result.data[:3]}")

            # Пошук у Prozorro
            proz_result = await prozorro_connector.search(query, limit=5)
            if proz_result.success and proz_result.data:
                sources.append({"name": "Prozorro (Тендери)", "type": "procurement", "data": proz_result.data[:3]})
                context_parts.append(f"Тендери Prozorro: {proz_result.data[:3]}")
        except Exception as e:
            logger.exception(f"Помилка зовнішнього пошуку: {e}")

        # 2. Гібридний пошук по внутрішніх даних (V45 Triple-DB)
        try:
            internal_data = await hybrid_search_with_rrf(query, tenant_id=tenant_id)
            if internal_data["results"]:
                sources.append({
                    "name": "Predator Internal (Hybrid)",
                    "type": "internal",
                    "count": internal_data["total"],
                    "data": internal_data["results"][:5],
                })
                internal_text = "\n".join([
                    f"- {r.get('content', '')} (AI: {r.get('ai_reason', '')})" for r in internal_data["results"][:5]
                ])
                context_parts.append(f"Внутрішні дані Predator:\n{internal_text}")
        except Exception as e:
            logger.exception(f"Помилка внутрішнього пошуку: {e}")

        # 3. Генерація висновків
        context = "\n\n".join(context_parts) if context_parts else "Дані в реєстрах та внутрішній базі не знайдено."
        prompt = f"""
        ЗАПИТ КОРИСТУВАЧА: {query}
        ЗІБРАНИЙ КОНТЕКСТ:
        {context}

        Проаналізуй ситуацію, вияви ризики та надай структуровану відповідь українською мовою.
        Відповідь має бути професійною, без технічного жаргону.
        """

        llm_response = await llm_service.generate_with_routing(
            prompt=prompt, system=self.system_prompt, mode=llm_mode, preferred_provider=preferred_provider
        )
        answer = llm_response.content if llm_response.success else "Помилка відповіді AI."
        model_used = f"{llm_response.provider}/{llm_response.model}"

        # 4. АВТОМАТИЧНЕ СТВОРЕННЯ КЕЙСУ (якщо знайдено важливі дані)
        if sources:
            await case_engine.generate_case_from_analysis(
                query=query,
                analysis_answer=answer,
                sources=sources,
                entity_id=query if len(query) == 8 and query.isdigit() else None,
            )

        processing_time = (time.time() - start_time) * 1000
        return AnalysisResult(
            query=query,
            answer=answer,
            sources=sources,
            confidence=0.9 if sources else 0.7,
            processing_time_ms=processing_time,
            model_used=model_used,
            timestamp=datetime.now(UTC),
        )

    async def quick_check(self, edrpou: str) -> dict[str, Any]:
        """Quick company check by EDRPOU."""
        company = await registry_connector.get_company_by_edrpou(edrpou)

        return {
            "edrpou": edrpou,
            "found": company is not None,
            "data": company,
            "timestamp": datetime.now(UTC).isoformat(),
        }


# Singleton instance
ai_engine = AIEngine()
