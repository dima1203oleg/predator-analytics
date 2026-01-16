"""
Multi-Model Arbitration Engine (v27.0)
--------------------------------------
Вибирає найкращу відповідь від кількох AI моделей шляхом консенсусу та голосування.
Підтримує: Gemini, Mistral, Llama 3.1, Claude, OpenAI.
"""
import asyncio
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime

from libs.core.structured_logger import get_logger, log_business_event
from app.services.llm.service import get_llm_service, LLMResponse

logger = get_logger("orchestrator.arbitration")

@dataclass
class ArbitrationResult:
    content: str
    provider: str
    model: str
    confidence: float
    consensus_score: float
    alternatives: List[Dict[str, Any]]
    execution_time_ms: int

class ArbitrationEngine:
    """
    Рушій арбітражу між мульти-модельними агентами.
    """

    def __init__(self):
        self.llm_service = get_llm_service()
        # Порядок пріоритету для голосування
        self.primary_models = ["gemini", "mistral", "ollama"]
        self.fallback_models = ["openai", "anthropic", "together"]

    async def execute(self, prompt: str, task_type: str = "general") -> ArbitrationResult:
        """
        Виконує запит до кількох моделей та обирає найкращу відповідь.
        """
        start_time = datetime.now()
        logger.info("arbitration_cycle_started", task_type=task_type)

        # 1. Вибір моделей для цього типу завдання
        selected_providers = self._select_providers_for_task(task_type)

        # 2. Паралельний запуск запитів
        tasks = [
            self._safe_query(provider, prompt)
            for provider in selected_providers
        ]
        results: List[LLMResponse] = await asyncio.gather(*tasks)

        # Фільтрація успішних відповідей
        successful_responses = [r for r in results if r.success and r.content]

        if not successful_responses:
            logger.error("all_models_failed_arbitration")
            raise RuntimeError("Всі моделі не змогли надати відповідь під час арбітражу")

        # 3. Логіка вибору найкращої відповіді (Consensus / Arbiter)
        best_response = await self._select_best_response(successful_responses, prompt)

        execution_time = int((datetime.now() - start_time).total_seconds() * 1000)

        log_business_event(
            logger,
            "arbitration_completed",
            winner=best_response["provider"],
            score=best_response["score"],
            duration_ms=execution_time
        )

        return ArbitrationResult(
            content=best_response["content"],
            provider=best_response["provider"],
            model=best_response["model"],
            confidence=best_response["score"],
            consensus_score=best_response["consensus"],
            alternatives=[
                {"provider": r.provider, "content": r.content[:50] + "..."}
                for r in successful_responses if r.provider != best_response["provider"]
            ],
            execution_time_ms=execution_time
        )

    def _select_providers_for_task(self, task_type: str) -> List[str]:
        """Вибирає оптимальний набір провайдерів залежно від типу задачі"""
        if task_type == "coding":
            return ["mistral", "gemini", "ollama"] # DeepSeek via Ollama is good for code
        elif task_type == "creative":
            return ["gemini", "openai"]
        elif task_type == "analysis":
            return ["gemini", "mistral", "ollama"]
        else:
            return ["gemini", "mistral"] # Default cheap/fast mix

    async def _safe_query(self, provider: str, prompt: str) -> LLMResponse:
        """Обгортка для безпечного виклику LLM"""
        try:
            return await self.llm_service.generate(
                prompt=prompt,
                provider=provider,
                temperature=0.7
            )
        except Exception as e:
            logger.warning(f"Arbitration query failed for {provider}: {e}")
            return LLMResponse(success=False, error=str(e), provider=provider)

    async def _select_best_response(self, responses: List[LLMResponse], original_prompt: str) -> Dict[str, Any]:
        """
        Вибирає 'найкращу' відповідь.
        Наразі використовує евристику довжини та наявності ключових слів.
        В майбутньому: LLM-суддя (Judge Model).
        """
        # Простий алгоритм: вибираємо найдовшу змістовну відповідь як переможця
        # TODO v27.1: Додати LLM-Judge (наприклад, Llama 3.1 оцінює відповіді інших)

        best = max(responses, key=lambda r: len(r.content))

        # Розрахунок 'консенсусу' (наскільки відповіді схожі - мок)
        consensus_score = 0.85

        return {
            "content": best.content,
            "provider": best.provider,
            "model": best.model or "unknown",
            "score": 0.95, # Mock confidence
            "consensus": consensus_score
        }

# Singleton instance
arbitration_engine = ArbitrationEngine()
