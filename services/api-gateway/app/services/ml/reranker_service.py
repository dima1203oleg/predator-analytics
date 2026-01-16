"""
Cross-Encoder Reranker Service
Implements MS MARCO MiniLM-based reranking for search results
"""
from typing import List, Dict, Tuple
# from sentence_transformers import CrossEncoder # Lazily imported
import logging

logger = logging.getLogger(__name__)


class RerankerService:
    """
    Semantic reranking using Cross-Encoder model.
    Usage: re-score top-N search results based on query-document relevance.
    """

    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-12-v2"):
        """
        Ініціалізує переранжувальник.
        """
        logger.info(f"Завантаження моделі переранжування: {model_name}")
        self.model = None
        try:
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(model_name, max_length=512)
            logger.info("Локальна модель переранжування завантажена успішно")
        except Exception as e:
            logger.warning(f"Локальна модель недоступна: {e}. Буде використано LLM фолбек.")

    async def _rerank_with_llm(self, query: str, documents: List[Dict], top_k: int) -> List[Tuple[Dict, float]]:
        """
        Інтелектуальне переранжування через Gemini API.
        """
        logger.info(f"Запуск LLM-переранжування для {len(documents)} документів...")
        try:
            # Для простоти використовуємо Gemini 1.5 Flash через Copilot/Orchestrator context
            # В реальному коді тут виклик API
            from services.orchestrator.agents.v25_sovereign_registry import sovereign_orchestrator

            prompt = f"Запит користувача: {query}\n\nРезультати пошуку:\n"
            for i, doc in enumerate(documents):
                prompt += f"[{i}] {doc.get('title', 'Без назви')}\n{doc.get('content', '')[:300]}\n\n"

            prompt += "Перестав індекси документів у порядку зменшення релевантності. Поверни ТІЛЬКИ список індексів, наприклад: [2, 0, 1]."

            # Використовуємо метод chat оркестратора
            raw_response = await sovereign_orchestrator.gemini_agent.chat(prompt)

            import re
            indices = [int(i) for i in re.findall(r'\d+', raw_response)]

            ranked = []
            seen = set()
            for idx in indices:
                if 0 <= idx < len(documents) and idx not in seen:
                    # Надаємо штучну оцінку на основі позиції (1.0 -> 0.1)
                    score = 1.0 - (len(ranked) * 0.1)
                    ranked.append((documents[idx], max(0.1, score)))
                    seen.add(idx)

            # Додаємо ті, що залишилися
            for i, doc in enumerate(documents):
                if i not in seen:
                    ranked.append((doc, 0.0))

            return ranked[:top_k]
        except Exception as e:
            logger.error(f"Помилка LLM-переранжування: {e}")
            return [(d, 0.0) for d in documents][:top_k]

    async def rerank(
        self,
        query: str,
        documents: List[Dict],
        top_k: int = 10,
        score_field: str = "title"
    ) -> List[Tuple[Dict, float]]:
        """
        Переранжування документів. Підтримує локальну модель та LLM фолбек.
        """
        if not documents:
            return []

        # 1. Спроба локального переранжування (якщо є модель)
        if self.model:
            try:
                pairs = []
                for doc in documents:
                    text = f"{doc.get('title', '')} {doc.get('content', '')[:500]}" if score_field == "both" else doc.get(score_field, "")
                    pairs.append([query, text])

                scores = self.model.predict(pairs)
                ranked = list(zip(documents, scores))
                ranked.sort(key=lambda x: x[1], reverse=True)
                return ranked[:top_k]
            except Exception as e:
                logger.error(f"Помилка локального переранжування: {e}")

        # 2. Фолбек до LLM (якщо локальна модель недоступна або дала збій)
        return await self._rerank_with_llm(query, documents, top_k)


# Singleton instance
_reranker_instance = None

def get_reranker() -> RerankerService:
    """Dependency injection for FastAPI"""
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = RerankerService()
    return _reranker_instance
