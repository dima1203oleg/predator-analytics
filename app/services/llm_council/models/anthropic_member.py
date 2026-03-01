from __future__ import annotations


"""Claude Council Member Implementation
Uses Anthropic's Claude as a council participant.
"""

from datetime import datetime
import os
from typing import Any


try:
    from anthropic import AsyncAnthropic
except ModuleNotFoundError:
    AsyncAnthropic = None
import json

from app.services.llm_council import CouncilMember, CouncilResponse, PeerReview


class ClaudeCouncilMember(CouncilMember):
    """Claude as a council member."""

    def __init__(
        self, model_id: str = "claude-3-opus-20240229", config: dict[str, Any] | None = None
    ):
        super().__init__(model_id=model_id, provider="anthropic", config=config or {})

        api_key = self.config.get("api_key") or os.getenv("ANTHROPIC_API_KEY")
        self.client = (
            AsyncAnthropic(api_key=api_key) if AsyncAnthropic is not None and api_key else None
        )

        self.default_params = {
            "temperature": 0.7,
            "max_tokens": 2048,
            **self.config.get("params", {}),
        }

    async def generate_response(self, query: str, context: str | None = None) -> CouncilResponse:
        """Generate independent response."""
        system_prompt = "You are an expert analyst providing detailed, accurate responses."

        if context:
            system_prompt += f"\n\nBackground context:\n{context}"

        if self.client is None:
            raise Exception("Anthropic client is not configured")

        try:
            message = await self.client.messages.create(
                model=self.model_id,
                system=system_prompt,
                messages=[{"role": "user", "content": query}],
                **self.default_params,
            )

            response_text = message.content[0].text

            response = CouncilResponse(
                model_id=self.model_id,
                text=response_text,
                confidence=self._estimate_confidence(response_text),
                metadata={
                    "usage": {
                        "input_tokens": message.usage.input_tokens,
                        "output_tokens": message.usage.output_tokens,
                    },
                    "stop_reason": message.stop_reason,
                },
                timestamp=datetime.now(),
            )

            self.response_history.append(response)
            return response

        except Exception as e:
            raise Exception(f"Claude generation failed: {e!s}")

    async def review_response(self, response: CouncilResponse, original_query: str) -> PeerReview:
        """Review another model's response."""
        review_prompt = await self._format_review_prompt(response, original_query)
        review_prompt += "\n\nProvide your review in JSON format."

        if self.client is None:
            raise Exception("Anthropic client is not configured")

        try:
            message = await self.client.messages.create(
                model=self.model_id,
                system="""You are a peer reviewer evaluating AI responses.
Always respond with valid JSON in this format:
{
  "score": <0.0-1.0>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "critique": "detailed analysis"
}""",
                messages=[{"role": "user", "content": review_prompt}],
                temperature=0.3,
                max_tokens=1000,
            )

            review_text = message.content[0].text

            # Claude doesn't have native JSON mode, so extract JSON manually
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
        """Extract JSON from Claude's response (may include markdown)."""
        try:
            # Try to find JSON block
            if "```json" in text:
                json_str = text.split("```json")[1].split("```", maxsplit=1)[0].strip()
            elif "{" in text and "}" in text:
                # Extract first JSON object
                start = text.index("{")
                end = text.rindex("}") + 1
                json_str = text[start:end]
            else:
                json_str = text

            return json.loads(json_str)
        except:
            return {
                "score": 0.5,
                "strengths": [],
                "weaknesses": ["Could not parse review"],
                "critique": text,
            }

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
            "difficult to say",
            "may be",
        ]

        text_lower = text.lower()
        uncertainty_count = sum(1 for marker in uncertainty_markers if marker in text_lower)

        return max(0.3, 0.85 - (uncertainty_count * 0.1))
