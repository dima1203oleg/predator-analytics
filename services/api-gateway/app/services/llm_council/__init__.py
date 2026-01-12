
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from pydantic import BaseModel
import asyncio
from datetime import datetime


class CouncilResponse(BaseModel):
    """Response from a council member"""
    model_id: str
    text: str
    confidence: float
    reasoning: Optional[str] = None
    metadata: Dict[str, Any] = {}
    timestamp: datetime


class PeerReview(BaseModel):
    """Peer review of another model's response"""
    reviewer_id: str
    reviewed_response_id: str
    score: float  # 0.0 to 1.0
    critique: str
    strengths: List[str] = []
    weaknesses: List[str] = []


class ConsensusResult(BaseModel):
    """Final consensus from the council"""
    final_answer: str
    confidence: float
    contributing_models: List[str]
    peer_reviews: List[PeerReview]
    chairman_reasoning: str
    dissenting_opinions: List[Dict[str, Any]] = []
    individual_responses: List[Dict[str, Any]] = []
    metadata: Dict[str, Any] = {}


class CouncilMember(ABC):
    """Base class for a council member (LLM model)"""

    def __init__(self, model_id: str, provider: str, config: Dict[str, Any] = None):
        self.model_id = model_id
        self.provider = provider
        self.config = config or {}
        self.response_history: List[CouncilResponse] = []

    @abstractmethod
    async def generate_response(
        self,
        query: str,
        context: Optional[str] = None
    ) -> CouncilResponse:
        """Generate independent response to query"""
        pass

    @abstractmethod
    async def review_response(
        self,
        response: CouncilResponse,
        original_query: str
    ) -> PeerReview:
        """Review another model's response"""
        pass

    async def _format_review_prompt(
        self,
        response: CouncilResponse,
        original_query: str
    ) -> str:
        """Format prompt for peer review"""
        return f"""You are evaluating another AI model's response. Be critical but fair.

Original Query: {original_query}

Response to Review:
{response.text}

Provide:
1. Score (0.0 to 1.0): Overall quality rating
2. Strengths: What did this response do well?
3. Weaknesses: What could be improved?
4. Critique: Detailed analysis

Be specific about factual errors, logical inconsistencies, or missing information.
"""
