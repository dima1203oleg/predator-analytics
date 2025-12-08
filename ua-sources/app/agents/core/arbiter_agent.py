from typing import Dict, Any, List
from ..core.base_agent import BaseAgent, AgentResponse, AgentConfig
import logging

logger = logging.getLogger(__name__)


class ArbiterAgent(BaseAgent):
    """Arbiter Agent - оцінює та обирає найкращу відповідь з кандидатів"""
    
    def __init__(self):
        super().__init__(AgentConfig(name="ArbiterAgent"))
        self.quality_weights = {
            "length": 0.2,
            "specificity": 0.3,
            "completeness": 0.3,
            "structure": 0.2
        }

    async def process(self, inputs: Dict[str, Any]) -> AgentResponse:
        candidates = inputs.get("candidates", [])
        query = inputs.get("query", "")
        
        self._log_activity(f"Arbitrating between {len(candidates)} responses")
        
        if not candidates:
            return AgentResponse(
                agent_name=self.name,
                result={"best_response": "", "score": 0},
                metadata={"method": "no_candidates"}
            )
        
        if len(candidates) == 1:
            return AgentResponse(
                agent_name=self.name,
                result={"best_response": candidates[0], "score": 1.0},
                metadata={"method": "single_candidate"}
            )
        
        # Оцінюємо кожного кандидата
        scored = []
        for candidate in candidates:
            score = await self._score_response(candidate, query)
            scored.append((candidate, score))
        
        # Сортуємо за score
        scored.sort(key=lambda x: x[1], reverse=True)
        best_response, best_score = scored[0]
        
        return AgentResponse(
            agent_name=self.name,
            result={
                "best_response": best_response,
                "score": best_score,
                "rankings": [{"response": r[:100], "score": s} for r, s in scored[:3]]
            },
            metadata={"method": "quality_scoring", "candidates_count": len(candidates)}
        )
    
    async def _score_response(self, response: str, query: str) -> float:
        """Оцінює якість відповіді"""
        score = 0.0
        
        # Length score (оптимальна довжина 200-1000 символів)
        length = len(response)
        if 200 <= length <= 1000:
            length_score = 1.0
        elif length < 50:
            length_score = 0.2
        elif length > 2000:
            length_score = 0.5
        else:
            length_score = min(length / 200, 1.0) if length < 200 else max(0.5, 1 - (length - 1000) / 2000)
        score += self.quality_weights["length"] * length_score
        
        # Specificity score (наявність конкретних даних)
        specificity_indicators = ["ЄДРПОУ", "грн", "UAH", "%", "№", "код", "дата"]
        specificity_count = sum(1 for ind in specificity_indicators if ind.lower() in response.lower())
        specificity_score = min(specificity_count / 3, 1.0)
        score += self.quality_weights["specificity"] * specificity_score
        
        # Completeness score (чи згадуються ключові слова з запиту)
        if query:
            query_words = set(query.lower().split())
            response_words = set(response.lower().split())
            overlap = len(query_words & response_words)
            completeness_score = min(overlap / max(len(query_words), 1), 1.0)
            score += self.quality_weights["completeness"] * completeness_score
        else:
            score += self.quality_weights["completeness"] * 0.5
        
        # Structure score (наявність списків, пунктів)
        structure_indicators = ["\n- ", "\n• ", "\n1.", "\n2.", ":", ";"]
        structure_count = sum(1 for ind in structure_indicators if ind in response)
        structure_score = min(structure_count / 2, 1.0)
        score += self.quality_weights["structure"] * structure_score
        
        return round(score, 3)
