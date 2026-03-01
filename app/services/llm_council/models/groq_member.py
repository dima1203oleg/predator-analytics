from __future__ import annotations


"""Groq Council Member Implementation
Uses Groq's ultra-fast LLaMA models as a council participant.
"""

from datetime import datetime
import os
from typing import Any


try:
    from groq import AsyncGroq
except ModuleNotFoundError:
    AsyncGroq = None
import json

from app.services.llm_council import CouncilMember, CouncilResponse, PeerReview


class GroqCouncilMember(CouncilMember):
    """Groq LLaMA as a council member (fast inference)."""

    def __init__(self, model_id: str = "llama-3.1-8b-instant", config: dict[str, Any] | None = None):
        super().__init__(model_id=model_id, provider="groq", config=config or {})

        api_key = self.config.get("api_key") or os.getenv("GROQ_API_KEY")
        self.client = AsyncGroq(api_key=api_key) if AsyncGroq is not None and api_key else None

        self.default_params = {"temperature": 0.7, "max_tokens": 2048, **self.config.get("params", {})}

    async def generate_response(self, query: str, context: str | None = None) -> CouncilResponse:
        """Generate independent response."""
        messages = [{"role": "system", "content": "You are an expert analyst providing detailed, accurate responses."}]

        if context:
            messages.append({"role": "system", "content": f"Background context:\n{context}"})

        messages.append({"role": "user", "content": query})

        if self.client is None:
            raise Exception("Groq client is not configured")

        try:
            completion = await self.client.chat.completions.create(
                model=self.model_id, messages=messages, **self.default_params
            )

            response_text = completion.choices[0].message.content

            response = CouncilResponse(
                model_id=self.model_id,
                text=response_text,
                confidence=self._estimate_confidence(response_text),
                metadata={
                    "usage": {
                        "prompt_tokens": completion.usage.prompt_tokens,
                        "completion_tokens": completion.usage.completion_tokens,
                        "total_tokens": completion.usage.total_tokens,
                    },
                    "finish_reason": completion.choices[0].finish_reason,
                },
                timestamp=datetime.now(),
            )

            self.response_history.append(response)
            return response

        except Exception as e:
            raise Exception(f"Groq generation failed: {e!s}")

    async def review_response(self, response: CouncilResponse, original_query: str) -> PeerReview:
        """Review another model's response."""
        review_prompt = await self._format_review_prompt(response, original_query)

        messages = [
            {
                "role": "system",
                "content": """You are a peer reviewer evaluating AI responses.
Provide structured feedback in JSON format:
{
  "score": <0.0-1.0>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "critique": "detailed analysis"
}

Respond ONLY with valid JSON, no additional text.""",
            },
            {"role": "user", "content": review_prompt},
        ]

        if self.client is None:
            raise Exception("Groq client is not configured")

        try:
            completion = await self.client.chat.completions.create(
                model=self.model_id, messages=messages, temperature=0.3, max_tokens=1000
            )

            review_text = completion.choices[0].message.content

            # Groq doesn't have native JSON mode, extract manually
            review_data = self._extract_json(review_text)

            return PeerReview(
                reviewer_id=self.model_id,
                reviewed_response_id=response.model_id,
                score=float(review_data.get("score", 0.5)),
                critique=review_data.get("critique", ""),
                strengths=review_data.get("strengths", []),
                weaknesses=review_data.get("weaknesses", []),
            )

        except Exception as e:
            return PeerReview(
                reviewer_id=self.model_id,
                reviewed_response_id=response.model_id,
                score=0.5,
                critique=f"Review failed: {e!s}",
                strengths=[],
                weaknesses=["Unable to complete review"],
            )

    def _extract_json(self, text: str) -> dict[str, Any]:
        """Extract JSON from Groq's response."""
        try:
            # Try to find JSON block
            if "```json" in text:
                json_str = text.split("```json")[1].split("```", maxsplit=1)[0].strip()
            elif "```" in text:
                json_str = text.split("```")[1].split("```", maxsplit=1)[0].strip()
            elif "{" in text and "}" in text:
                start = text.index("{")
                end = text.rindex("}") + 1
                json_str = text[start:end]
            else:
                json_str = text

            return json.loads(json_str)
        except:
            return {"score": 0.5, "strengths": [], "weaknesses": ["Could not parse review"], "critique": text}

    def _estimate_confidence(self, text: str) -> float:
        """Estimate confidence from response text."""
        uncertainty_markers = [
            "not sure",
            "might",
            "possibly",
            "perhaps",
            "unclear",
            "uncertain",
            "cannot confirm",
            "may be",
            "probably",
        ]

        text_lower = text.lower()
        uncertainty_count = sum(1 for marker in uncertainty_markers if marker in text_lower)

        return max(0.3, 0.85 - (uncertainty_count * 0.1))


# Smaller, faster Groq model for cost-efficiency
class GroqLlama8BCouncilMember(GroqCouncilMember):
    """Groq LLaMA 8B - faster, cheaper variant."""

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(model_id="llama-3.1-8b-instant", config=config)
