from __future__ import annotations

import asyncio
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch


# Adjust path
sys.path.append("/Users/dima-mac/Documents/Predator_21/services/api-gateway")

# Mock libs
sys.modules["libs"] = MagicMock()
sys.modules["libs.core"] = MagicMock()
sys.modules["libs.core.structured_logger"] = MagicMock()
sys.modules["app.services.model_router"] = MagicMock()
sys.modules["app.services.embedding_service"] = MagicMock()

# Import
from app.services.arbitration import ArbitrationEngine


class MockEmbeddingService:
    def generate_batch_embeddings(self, texts):
        # Return fake vectors based on text content equality
        # If texts are "Answer A", "Answer A", "Answer B"
        # We want A and A to have high sim, A and B low sim.
        vecs = []
        for t in texts:
            if "A" in t:
                vecs.append([1.0, 0.0])
            else:
                vecs.append([0.0, 1.0])
        return vecs

    def cosine_similarity(self, v1, v2):
        # Dot product for simple unit vectors
        return float(v1[0]*v2[0] + v1[1]*v2[1])

async def test_arbitration():
    print("Testing ArbitrationEngine...")

    router_mock = AsyncMock()
    # Setup mock to return different answers
    async def router_call(provider, model, msgs, temp):
        if model == "gemini-1.5-flash":
            return "Answer A (Gemini)"
        if model == "mistral":
            return "Answer A (Mistral agreed)"
        if model == "llama3.1:8b":
            return "Answer B (Llama disagreed)"
        return "Unknown"

    router_mock._execute_provider_call = router_call
    router_mock._determine_provider = lambda x: "mock_provider"

    engine = ArbitrationEngine(router_mock)
    engine.embedding_service = MockEmbeddingService()

    print("Executor cycle...")
    result = await engine.execute("Test prompt")

    print(f"Request ID: {result.request_id}")
    print(f"Best Model: {result.best_model}")
    print(f"Confidence: {result.confidence}")
    print(f"Final Answer: {result.final_answer}")
    print(f"Individual: {result.individual_responses}")

    # Check logic: A and A are similar, B is different. A/A should win.
    assert result.best_model in ["gemini", "mistral"], "Gemini or Mistral should win majority"
    assert "A" in result.final_answer

    print("\nTest 2: Complete disagreement")
    # A, B, C -> Low confidence -> Fallback chain
    engine.embedding_service.generate_batch_embeddings = lambda texts: [[1,0,0], [0,1,0], [0,0,1]] # Orthogonal
    engine.embedding_service.cosine_similarity = lambda v1, v2: 0.0

    result2 = await engine.execute("Test prompt 2")
    print(f"Best Model (Fallback): {result2.best_model}")
    # Prioritizes Gemini in fallback
    assert result2.best_model == "gemini"

if __name__ == "__main__":
    asyncio.run(test_arbitration())
