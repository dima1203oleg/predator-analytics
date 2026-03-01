from __future__ import annotations


"""GPT-4 Council Member Implementation
Uses OpenAI's GPT-4 as a council participant.
"""

from datetime import datetime
import os
from typing import Any


try:
    from openai import AsyncOpenAI
except ModuleNotFoundError:
    AsyncOpenAI = None
import json

from app.services.llm_council import CouncilMember, CouncilResponse, PeerReview


class GPT4CouncilMember(CouncilMember):
    """GPT-4 as a council member."""

    def __init__(self, model_id: str = "gpt-4-turbo-preview", config: dict[str, Any] | None = None):
        super().__init__(model_id=model_id, provider="openai", config=config or {})

        api_key = self.config.get("api_key") or os.getenv("OPENAI_API_KEY")
        self.client = AsyncOpenAI(api_key=api_key) if AsyncOpenAI is not None and api_key else None

        self.default_params = {"temperature": 0.7, "max_tokens": 2000, **self.config.get("params", {})}

    async def generate_response(self, query: str, context: str | None = None) -> CouncilResponse:
        """Generate independent response."""
        messages = [{"role": "system", "content": "You are an expert analyst providing detailed, accurate responses."}]

        if context:
            messages.append({"role": "system", "content": f"Background context:\n{context}"})

        messages.append({"role": "user", "content": query})

        if self.client is None:
            raise Exception("OpenAI client is not configured")

        try:
            completion = await self.client.chat.completions.create(
                model=self.model_id, messages=messages, **self.default_params
            )

            response_text = completion.choices[0].message.content

            # Extract confidence if model provides it
            confidence = self._estimate_confidence(response_text)

            response = CouncilResponse(
                model_id=self.model_id,
                text=response_text,
                confidence=confidence,
                metadata={
                    "usage": completion.usage.model_dump() if completion.usage else {},
                    "finish_reason": completion.choices[0].finish_reason,
                },
                timestamp=datetime.now(),
            )

            self.response_history.append(response)
            return response

        except Exception as e:
            raise Exception(f"GPT-4 generation failed: {e!s}")

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
}""",
            },
            {"role": "user", "content": review_prompt},
        ]

        if self.client is None:
            raise Exception("OpenAI client is not configured")

        try:
            completion = await self.client.chat.completions.create(
                model=self.model_id,
                messages=messages,
                temperature=0.3,  # Lower temperature for more analytical review
                max_tokens=1000,
                response_format={"type": "json_object"},
            )

            review_data = json.loads(completion.choices[0].message.content)

            return PeerReview(
                reviewer_id=self.model_id,
                reviewed_response_id=response.model_id,
                score=float(review_data.get("score", 0.5)),
                critique=review_data.get("critique", ""),
                strengths=review_data.get("strengths", []),
                weaknesses=review_data.get("weaknesses", []),
            )

        except Exception as e:
            # Fallback if JSON parsing fails
            return PeerReview(
                reviewer_id=self.model_id,
                reviewed_response_id=response.model_id,
                score=0.5,
                critique=f"Review failed: {e!s}",
                strengths=[],
                weaknesses=["Unable to complete review"],
            )

    def _estimate_confidence(self, text: str) -> float:
        """Estimate confidence from response text
        Look for uncertainty markers.
        """
        uncertainty_markers = [
            "not sure",
            "might",
            "possibly",
            "perhaps",
            "unclear",
            "uncertain",
            "cannot confirm",
            "difficult to say",
        ]

        text_lower = text.lower()
        uncertainty_count = sum(1 for marker in uncertainty_markers if marker in text_lower)

        # Base confidence 0.8, reduce by 0.1 for each uncertainty marker
        return max(0.3, 0.8 - (uncertainty_count * 0.1))


class GPT3_5CouncilMember(GPT4CouncilMember):
    """GPT-3.5 Turbo as a council member (faster, cheaper alternative)."""

    def __init__(self, config: dict[str, Any] | None = None):
        super().__init__(model_id="gpt-3.5-turbo", config=config)
