from __future__ import annotations


"""LLM Council Orchestrator
Coordinates multiple LLMs to reach consensus following Karpathy's pattern.

Workflow:
1. Independent Generation: All models answer simultaneously
2. Peer Review: Models critique each other's responses
3. Consensus: Chairman synthesizes best answer
"""

import asyncio
from datetime import datetime
import logging
from typing import Any, Dict, List, Optional

from . import ConsensusResult, CouncilMember, CouncilResponse, PeerReview
from .models.anthropic_member import ClaudeCouncilMember
from .models.gemini_member import GeminiCouncilMember
from .models.groq_member import GroqCouncilMember
from .models.openai_member import GPT3_5CouncilMember, GPT4CouncilMember


logger = logging.getLogger(__name__)


class LLMCouncilOrchestrator:
    """Orchestrates a council of LLMs to produce high-quality consensus answers.

    Example:
        council = LLMCouncilOrchestrator(
            members=[
                GPT4CouncilMember(),
                ClaudeCouncilMember(),
                GPT3_5CouncilMember()
            ],
            chairman=GPT4CouncilMember(model_id="gpt-4")
        )

        result = await council.deliberate(
            query="Analyze customs declaration anomalies in 2024 data"
        )
    """

    def __init__(
        self,
        members: list[CouncilMember],
        chairman: CouncilMember | None = None,
        min_consensus: float = 0.7
    ):
        """Args:
        members: List of council members (different LLMs)
        chairman: The model that will synthesize final answer (defaults to first member)
        min_consensus: Minimum agreement threshold (0.0 to 1.0).
        """
        self.members = members
        self.chairman = chairman or members[0]
        self.min_consensus = min_consensus

        self.deliberation_history: list[dict[str, Any]] = []

    async def deliberate(
        self,
        query: str,
        context: str | None = None,
        enable_peer_review: bool = True
    ) -> ConsensusResult:
        """Main deliberation workflow.

        Args:
            query: The question/task for the council
            context: Optional background information
            enable_peer_review: Whether to perform peer review (slower but higher quality)

        Returns:
            ConsensusResult with final answer and metadata
        """
        logger.info(f"Starting council deliberation with {len(self.members)} members")
        start_time = datetime.now()

        # Step 0: Inject System Context
        try:
            from ..system_control_service import SystemControlService
            control_service = SystemControlService()
            is_locked = await control_service.is_lockdown()
            if is_locked:
                system_ctx = "[SYSTEM ALERT] ROOT PROTOCOL LOCKDOWN IS ACTIVE. Operations are restricted. Safety protocols enabled."
                context = f"{system_ctx}\n\n{context}" if context else system_ctx
                logger.warning("Council deliberation running under SYSTEM LOCKDOWN context.")
        except ImportError:
            # Fallback if path is different or service not available
            logger.debug("SystemControlService not available for context injection")
        except Exception as e:
            logger.exception(f"System context injection failed: {e}")

        # Step 1: Independent Generation
        logger.info("Step 1: Independent generation by all members")
        responses = await self._parallel_generation(query, context)

        if not responses:
            raise Exception("No council members produced responses")

        # Step 2: Peer Review (optional)
        peer_reviews = []
        if enable_peer_review and len(responses) > 1:
            logger.info("Step 2: Peer review phase")
            peer_reviews = await self._peer_review_phase(responses, query)

        # Step 3: Consensus Formation
        logger.info("Step 3: Chairman forming consensus")
        consensus = await self._form_consensus(
            query=query,
            responses=responses,
            peer_reviews=peer_reviews
        )

        # Add metadata
        elapsed_time = (datetime.now() - start_time).total_seconds()
        consensus.metadata = {
            "deliberation_time_seconds": elapsed_time,
            "num_members": len(self.members),
            "peer_reviews_conducted": len(peer_reviews),
            "timestamp": datetime.now().isoformat()
        }

        # Store in history
        self.deliberation_history.append({
            "query": query,
            "result": consensus,
            "timestamp": datetime.now()
        })

        logger.info(f"Deliberation completed in {elapsed_time:.2f}s")
        return consensus

    async def _parallel_generation(
        self,
        query: str,
        context: str | None
    ) -> list[CouncilResponse]:
        """Step 1: All members generate responses simultaneously."""
        tasks = [
            member.generate_response(query, context)
            for member in self.members
        ]

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out failures
        responses = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.error(f"Member {self.members[i].model_id} failed: {result}")
            else:
                responses.append(result)

        return responses

    async def _peer_review_phase(
        self,
        responses: list[CouncilResponse],
        original_query: str
    ) -> list[PeerReview]:
        """Step 2: Each member reviews others' responses
        Models act as judges for each other.
        """
        review_tasks = []

        # Each member reviews all other responses
        for reviewer in self.members:
            for response in responses:
                # Don't review your own response
                if response.model_id != reviewer.model_id:
                    review_tasks.append(
                        reviewer.review_response(response, original_query)
                    )

        reviews = await asyncio.gather(*review_tasks, return_exceptions=True)

        # Filter out failed reviews
        peer_reviews = [r for r in reviews if not isinstance(r, Exception)]

        logger.info(f"Completed {len(peer_reviews)} peer reviews")
        return peer_reviews

    async def _form_consensus(
        self,
        query: str,
        responses: list[CouncilResponse],
        peer_reviews: list[PeerReview]
    ) -> ConsensusResult:
        """Step 3: Chairman synthesizes all information into final answer
        Takes into account:
        - Original responses
        - Peer review scores and critiques
        - Identified strengths/weaknesses.
        """
        # Calculate average peer review score for each response
        response_scores = {}
        for response in responses:
            relevant_reviews = [
                r for r in peer_reviews
                if r.reviewed_response_id == response.model_id
            ]

            if relevant_reviews:
                avg_score = sum(r.score for r in relevant_reviews) / len(relevant_reviews)
                response_scores[response.model_id] = avg_score
            else:
                # No peer reviews, use model's self-confidence
                response_scores[response.model_id] = response.confidence

        # Prepare synthesis prompt for chairman
        synthesis_prompt = self._build_synthesis_prompt(
            query, responses, peer_reviews, response_scores
        )

        # Chairman creates final answer
        try:
            chairman_response = await self.chairman.generate_response(
                query=synthesis_prompt,
                context=None  # All context is in the prompt
            )

            final_answer = chairman_response.text

        except Exception as e:
            logger.exception(f"Chairman synthesis failed: {e}")
            # Fallback: use highest-scored response
            best_response = max(responses, key=lambda r: response_scores.get(r.model_id, 0))
            final_answer = best_response.text

        # Identify dissenting opinions (low-scored responses with significant differences)
        dissenting = []
        avg_score = sum(response_scores.values()) / len(response_scores) if response_scores else 0

        for response in responses:
            score = response_scores.get(response.model_id, 0)
            if score < avg_score - 0.2:  # Significantly lower than average
                dissenting.append({
                    "model": response.model_id,
                    "text": response.text[:200] + "...",  # Truncate
                    "score": score
                })

        # Collect all individual responses for transparency
        all_responses = [
            {
                "model_id": r.model_id,
                "text": r.text,
                "confidence": r.confidence
            }
            for r in responses
        ]

        return ConsensusResult(
            final_answer=final_answer,
            confidence=max(response_scores.values()) if response_scores else 0.5,
            contributing_models=[r.model_id for r in responses],
            peer_reviews=peer_reviews,
            chairman_reasoning=f"Synthesized from {len(responses)} responses with avg review score {avg_score:.2f}",
            dissenting_opinions=dissenting,
            individual_responses=all_responses
        )

    def _build_synthesis_prompt(
        self,
        original_query: str,
        responses: list[CouncilResponse],
        peer_reviews: list[PeerReview],
        scores: dict[str, float]
    ) -> str:
        """Build prompt for chairman to synthesize consensus."""
        prompt = f"""You are the chairman of a council of AI models. Your task is to synthesize the best possible answer from multiple perspectives.

Original Query:
{original_query}

Council Responses:
"""

        for i, response in enumerate(responses, 1):
            score = scores.get(response.model_id, 0)
            prompt += f"\n--- Response {i} from {response.model_id} (Peer Score: {score:.2f}) ---\n"
            prompt += response.text
            prompt += "\n"

        if peer_reviews:
            prompt += "\n\nPeer Review Summary:\n"
            for review in peer_reviews[:10]:  # Limit to avoid token overflow
                prompt += f"- {review.reviewer_id} reviewed {review.reviewed_response_id}: {review.score:.2f}/1.0\n"
                if review.critique:
                    prompt += f"  Critique: {review.critique[:200]}\n"

        prompt += """

Your Task:
1. Synthesize the best elements from all responses
2. Address any weaknesses identified in peer reviews
3. Resolve any contradictions or disagreements
4. Provide a comprehensive, accurate final answer

Focus on factual accuracy, logical coherence, and completeness.
Do NOT simply choose one response - synthesize the best of all perspectives.

Final Answer:"""

        return prompt

    def get_deliberation_stats(self) -> dict[str, Any]:
        """Get statistics about council performance."""
        if not self.deliberation_history:
            return {"total_deliberations": 0}

        total = len(self.deliberation_history)
        avg_confidence = sum(
            d["result"].confidence for d in self.deliberation_history
        ) / total

        avg_time = sum(
            d["result"].metadata.get("deliberation_time_seconds", 0)
            for d in self.deliberation_history
        ) / total

        return {
            "total_deliberations": total,
            "average_confidence": avg_confidence,
            "average_deliberation_time": avg_time,
            "member_participation": {
                member.model_id: len(member.response_history)
                for member in self.members
            }
        }


# Factory function for easy setup
def create_default_council(
    include_models: list[str] | None = None
) -> LLMCouncilOrchestrator:
    """Create a council with default configuration.

    Args:
        include_models: List of models to include.
                       Options: ['gpt4', 'gpt3.5', 'claude', 'gemini', 'groq']

    Returns:
        Configured LLMCouncilOrchestrator
    """
    include_models = include_models or ['gemini', 'groq']

    members = []

    def _is_member_configured(member: CouncilMember) -> bool:
        client = getattr(member, "client", None)
        if client is not None:
            return True
        model = getattr(member, "model", None)
        return model is not None

    if 'gpt4' in include_models:
        try:
            m = GPT4CouncilMember()
            if _is_member_configured(m):
                members.append(m)
            else:
                raise Exception("GPT-4 client not configured")
        except:
            logger.warning("GPT-4 not available")

    if 'gpt3.5' in include_models:
        try:
            m = GPT3_5CouncilMember()
            if _is_member_configured(m):
                members.append(m)
            else:
                raise Exception("GPT-3.5 client not configured")
        except:
            logger.warning("GPT-3.5 not available")

    if 'claude' in include_models:
        try:
            m = ClaudeCouncilMember()
            if _is_member_configured(m):
                members.append(m)
            else:
                raise Exception("Claude client not configured")
        except:
            logger.warning("Claude not available")

    if 'gemini' in include_models:
        try:
            m = GeminiCouncilMember()
            if _is_member_configured(m):
                members.append(m)
            else:
                raise Exception("Gemini client not configured")
        except:
            logger.warning("Gemini not available")

    if 'groq' in include_models:
        try:
            m = GroqCouncilMember()
            if _is_member_configured(m):
                members.append(m)
            else:
                raise Exception("Groq client not configured")
        except:
            logger.warning("Groq not available")

    # Always add Ops Sentinel for V25.0 system awareness
    try:
        from .models.ops_member import OpsCouncilMember
        members.append(OpsCouncilMember())
        logger.info("Ops Sentinel added to Council.")
    except Exception as e:
        logger.warning(f"Failed to add Ops Sentinel: {e}")

    if not members:
        raise Exception("No council members available. Check API keys.")

    # Use Gemini as chairman if available (highest quality of free ones)
    chairman = next((m for m in members if 'gemini' in m.model_id.lower()), members[0])

    return LLMCouncilOrchestrator(
        members=members,
        chairman=chairman,
        min_consensus=0.7
    )
