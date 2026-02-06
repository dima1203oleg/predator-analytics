from __future__ import annotations


"""Gemini Council Member Implementation
Uses Google's Gemini as a council participant via centralized ModelRouter.
"""

from datetime import datetime
import json
import logging
from typing import Any, Dict, Optional

from app.services.model_router import ModelRouter

from .. import CouncilMember, CouncilResponse, PeerReview


logger = logging.getLogger(__name__)

class GeminiCouncilMember(CouncilMember):
    """Google Gemini as a council member."""

    def __init__(
        self,
        model_id: str = "gemini-2.0-flash-exp", # Default to faster model
        config: dict[str, Any] | None = None
    ):
        super().__init__(
            model_id=model_id,
            provider="google",
            config=config or {}
        )
        self.router = ModelRouter()

    async def generate_response(
        self,
        query: str,
        context: str | None = None
    ) -> CouncilResponse:
        """Generate independent response."""
        # Prepare messages
        messages = []
        if context:
            messages.append({"role": "user", "content": f"Context:\n{context}"})
        messages.append({"role": "user", "content": query})

        try:
            response_text = await self.router.chat_completion(
                model=self.model_id,
                messages=messages,
                temperature=0.7
            )

            council_response = CouncilResponse(
                model_id=self.model_id,
                text=response_text,
                confidence=self._estimate_confidence(response_text),
                metadata={
                    "provider": "gemini",
                    "router_used": True
                },
                timestamp=datetime.now()
            )

            self.response_history.append(council_response)
            return council_response

        except Exception as e:
            logger.exception(f"Gemini generation failed: {e}")
            # Return error response instead of crashing
            return CouncilResponse(
                model_id=self.model_id,
                text=f"Error generating response: {e!s}",
                confidence=0.0,
                metadata={"error": str(e)},
                timestamp=datetime.now()
            )

    async def review_response(
        self,
        response: CouncilResponse,
        original_query: str
    ) -> PeerReview:
        """Review another model's response."""
        review_prompt = await self._format_review_prompt(response, original_query)
        review_prompt += """

Respond ONLY with valid JSON in this format:
{
  "score": 0.85,
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["point 1", "point 2"],
  "critique": "detailed analysis"
}"""

        try:
            review_text = await self.router.chat_completion(
                model=self.model_id,
                messages=[{"role": "user", "content": review_prompt}],
                temperature=0.3
            )

            # Extract JSON from response
            review_data = self._extract_json(review_text)

            return PeerReview(
                reviewer_id=self.model_id,
                reviewed_response_id=response.model_id,
                score=float(review_data.get("score", 0.5)),
                critique=review_data.get("critique", ""),
                strengths=review_data.get("strengths", []),
                weaknesses=review_data.get("weaknesses", [])
            )

        except Exception as e:
            return PeerReview(
                reviewer_id=self.model_id,
                reviewed_response_id=response.model_id,
                score=0.5,
                critique=f"Review failed: {e!s}",
                strengths=[],
                weaknesses=["Unable to complete review"]
            )

    def _extract_json(self, text: str) -> dict[str, Any]:
        """Extract JSON from response text."""
        try:
            if "Error:" in text:
                return {}
            # Remove markdown code blocks if present
            if "```json" in text:
                json_str = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                json_str = text.split("```")[1].split("```")[0].strip()
            elif "{" in text and "}" in text:
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
                "critique": text
            }

    def _estimate_confidence(self, text: str) -> float:
        """Estimate confidence from response text."""
        uncertainty_markers = [
            "not sure", "might", "possibly", "perhaps", "unclear",
            "uncertain", "cannot confirm", "may be", "probably"
        ]

        text_lower = text.lower()
        uncertainty_count = sum(1 for marker in uncertainty_markers if marker in text_lower)

        return max(0.3, 0.8 - (uncertainty_count * 0.1))

