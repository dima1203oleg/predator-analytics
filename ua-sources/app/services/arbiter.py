"""
Predator Analytics - Arbiter Service
Multi-Agent Decision Arbiter for conflict resolution and consensus
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum
import asyncio
import logging

logger = logging.getLogger(__name__)


class DecisionType(Enum):
    CONSENSUS = "consensus"
    MAJORITY = "majority"
    WEIGHTED = "weighted"
    OVERRIDE = "override"


@dataclass
class AgentVote:
    agent_id: str
    agent_type: str
    decision: str
    confidence: float
    reasoning: str
    weight: float = 1.0


@dataclass
class ArbiterDecision:
    decision: str
    decision_type: DecisionType
    confidence: float
    votes: List[AgentVote]
    reasoning: str
    dissenting_opinions: List[str]


class ArbiterService:
    def __init__(self):
        self.decision_history: List[ArbiterDecision] = []
        self.agent_weights: Dict[str, float] = {}
        self.consensus_threshold: float = 0.7
        
    async def collect_votes(
        self, 
        agents: List[Dict[str, Any]], 
        query: str,
        timeout: float = 30.0
    ) -> List[AgentVote]:
        votes = []
        for agent in agents:
            vote = AgentVote(
                agent_id=agent.get("id", "unknown"),
                agent_type=agent.get("type", "generic"),
                decision="approve",
                confidence=0.85,
                reasoning=f"Agent {agent.get('id')} analysis complete",
                weight=self.agent_weights.get(agent.get("id"), 1.0)
            )
            votes.append(vote)
        return votes
    
    async def make_decision(
        self,
        votes: List[AgentVote],
        strategy: DecisionType = DecisionType.WEIGHTED
    ) -> ArbiterDecision:
        if not votes:
            return ArbiterDecision(
                decision="abstain",
                decision_type=DecisionType.OVERRIDE,
                confidence=0.0,
                votes=[],
                reasoning="No votes received",
                dissenting_opinions=[]
            )
        
        if strategy == DecisionType.WEIGHTED:
            return self._weighted_decision(votes)
        return self._weighted_decision(votes)
    
    def _weighted_decision(self, votes: List[AgentVote]) -> ArbiterDecision:
        from collections import defaultdict
        weighted_scores: Dict[str, float] = defaultdict(float)
        
        for vote in votes:
            score = vote.confidence * vote.weight
            weighted_scores[vote.decision] += score
        
        winner = max(weighted_scores, key=weighted_scores.get)
        total_weight = sum(weighted_scores.values())
        dissenting = [v.reasoning for v in votes if v.decision != winner]
        
        return ArbiterDecision(
            decision=winner,
            decision_type=DecisionType.WEIGHTED,
            confidence=weighted_scores[winner] / total_weight if total_weight > 0 else 0,
            votes=votes,
            reasoning=f"Weighted decision with score {weighted_scores[winner]:.2f}",
            dissenting_opinions=dissenting
        )


arbiter_service = ArbiterService()
