from __future__ import annotations

import logging

from .council_orchestrator import create_default_council


logger = logging.getLogger(__name__)

class CouncilService:
    """Wrapper service for LLM Council deliberation."""

    def __init__(self):
        try:
            self._orchestrator = create_default_council()
        except Exception as e:
            logger.exception(f"Failed to initialize default council: {e}")
            self._orchestrator = None

    async def process_request(self, query: str, context: str | None = None):
        """Standard interaction point for agents/services."""
        if not self._orchestrator:
            # Fallback mock or simple response if council is dead
            from . import ConsensusResult
            return ConsensusResult(
                final_answer="[COUNCIL OFFLINE] Analysis unavailable due to infrastructure sync in progress.",
                confidence=0.0,
                contributing_models=[],
                peer_reviews=[],
                chairman_reasoning="Council failed to initialize"
            )

        return await self._orchestrator.deliberate(query, context, enable_peer_review=False)

# Singleton instance
council_service = CouncilService()
