from __future__ import annotations

import asyncio
from datetime import datetime

from pydantic import BaseModel

from app.libs.core.structured_logger import get_logger
from app.services.model_router import ModelRouter

logger = get_logger("service.arbitration")


class ArbitrationResult(BaseModel):
    request_id: str
    final_answer: str
    confidence: float
    contributing_models: list[str]
    individual_responses: dict[str, str]
    best_model: str
    timestamp: str


class ArbitrationEngine:
    """Multi-Model Arbitration Engine (v45.0).
    Executes parallel inference across multiple AI providers and selects the optimal consensus using semantic similarity.
    """

    def __init__(self, model_router: ModelRouter):
        self.router = model_router
        from app.services.embedding_service import get_embedding_service

        self.embedding_service = get_embedding_service()
        # Fallback chain priorities
        self.priority_chain = ["gemini", "mistral", "llama", "claude"]
        # Configuration for models to participate in arbitration
        self.default_council = [
            {"id": "gemini", "model": "gemini-1.5-flash"},
            {"id": "mistral", "model": "mistral"},  # Usually local via Ollama
            {"id": "llama", "model": "llama3.1:8b"},
        ]

    async def execute(
        self, prompt: str, council: list[dict[str, str]] | None = None
    ) -> ArbitrationResult:
        """Executes the arbitration cycle.
        1. Parallel inference
        2. Semantic Consensus (Voting)
        3. Result aggregation.
        """
        council = council or self.default_council
        request_id = f"arb-{int(datetime.now().timestamp())}"

        logger.info("arbitration_cycle_started", request_id=request_id, council_size=len(council))

        # 1. Parallel Inference
        tasks = []
        for member in council:
            tasks.append(self._get_model_response(member["id"], member["model"], prompt))

        results = await asyncio.gather(*tasks)

        individual_responses = {}
        for idx, member in enumerate(council):
            individual_responses[member["id"]] = results[idx]

        # 2. Consensus Selection via Semantic Voting
        final_answer, best_model, confidence = await self._select_consensus(
            prompt, individual_responses
        )

        result = ArbitrationResult(
            request_id=request_id,
            final_answer=final_answer,
            confidence=confidence,
            contributing_models=[m["id"] for m in council],
            individual_responses=individual_responses,
            best_model=best_model,
            timestamp=datetime.now().isoformat(),
        )

        logger.info(
            "arbitration_cycle_completed",
            request_id=request_id,
            best_model=best_model,
            confidence=confidence,
        )

        # Async metrics logging
        self._log_metrics(result)

        return result

    async def _get_model_response(self, member_id: str, model_name: str, prompt: str) -> str:
        try:
            # We bypass the default failover of model_router for arbitration
            # To get specific results from each provider.
            provider = self.router._determine_provider(model_name)
            messages = [{"role": "user", "content": prompt}]
            # Use lower temperature for consistency
            return await self.router._execute_provider_call(
                provider, model_name, messages, temp=0.3
            )
        except Exception as e:
            logger.exception("arbitration_model_failed", member=member_id, error=str(e))
            return f"Error: {e!s}"

    async def _select_consensus(self, prompt: str, responses: dict[str, str]) -> (str, str, float):
        """Selects the best answer using semantic similarity voting."""
        valid_responses = {k: v for k, v in responses.items() if not v.startswith("Error")}

        if not valid_responses:
            return "Arbitration failed: All models returned errors.", "none", 0.0

        if len(valid_responses) == 1:
            best_id = next(iter(valid_responses.keys()))
            return valid_responses[best_id], best_id, 0.7

        # Calculate semantic embeddings
        ids = list(valid_responses.keys())
        texts = [valid_responses[k] for k in ids]

        try:
            embeddings = self.embedding_service.generate_batch_embeddings(texts)
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}. Fallback to priority chain.")
            return self._fallback_selection(valid_responses)

        # Calculate pairwise similarity matrix
        n = len(ids)
        scores = dict.fromkeys(ids, 0.0)

        for i in range(n):
            for j in range(n):
                if i != j:
                    sim = self.embedding_service.cosine_similarity(embeddings[i], embeddings[j])
                    scores[ids[i]] += sim

        # Normalize scores (average similarity to others)
        for id_ in scores:
            scores[id_] /= n - 1

        # Select winner (Majority wins via semantic proximity)
        best_id = max(scores, key=scores.get)
        confidence = scores[best_id]

        # If confidence is too low (<0.5), it means high disagreement. Fallback to priority chain.
        if confidence < 0.5:
            logger.warning("Low consensus confidence", confidence=confidence, winner=best_id)
            return self._fallback_selection(valid_responses)

        return valid_responses[best_id], best_id, confidence

    def _fallback_selection(self, responses: dict[str, str]) -> (str, str, float):
        """Fallback Chain: Gemini -> Mistral -> Llama -> Claude."""
        for provider in self.priority_chain:
            if provider in responses and not responses[provider].startswith("Error"):
                return responses[provider], provider, 0.8

        # Ultimate fallback: longest response
        best_id = max(responses, key=lambda k: len(responses[k]))
        return responses[best_id], best_id, 0.5

    def _log_metrics(self, result: ArbitrationResult):
        # Placeholder for detailed metrics logging
        pass


# Singleton instance for the system


_router = ModelRouter()
arbitration_engine = ArbitrationEngine(_router)
