"""рацюй];
Multi-Agent Debate Protocol
Implements structured debate between AI agents for complex decision-making
Based on 2024 research on AI agent collaboration and consensus
"""
import json
from datetime import datetime
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
import logging

logger = logging.getLogger("agents.debate")


class DebateStance(Enum):
    """Agent's stance in debate"""
    SUPPORT = "support"
    OPPOSE = "oppose"
    NEUTRAL = "neutral"
    ABSTAIN = "abstain"


@dataclass
class DebatePosition:
    """A single position/argument in debate"""
    agent_id: str
    stance: DebateStance
    argument: str
    evidence: List[str] = field(default_factory=list)
    confidence: float = 0.5
    counter_to: Optional[str] = None  # ID of position this counters

    def to_dict(self) -> Dict:
        return {
            "agent_id": self.agent_id,
            "stance": self.stance.value,
            "argument": self.argument,
            "evidence": self.evidence,
            "confidence": self.confidence,
            "counter_to": self.counter_to
        }


@dataclass
class DebateRound:
    """A single round of debate"""
    round_number: int
    positions: List[DebatePosition]
    consensus_progress: float = 0.0

    def to_dict(self) -> Dict:
        return {
            "round_number": self.round_number,
            "positions": [p.to_dict() for p in self.positions],
            "consensus_progress": self.consensus_progress
        }


@dataclass
class DebateResult:
    """Final result of debate"""
    topic: str
    final_decision: str  # approve, reject, modify
    confidence: float
    rounds: List[DebateRound]
    winner_agent: Optional[str] = None
    key_arguments: List[str] = field(default_factory=list)
    compromises: List[str] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> Dict:
        return {
            "topic": self.topic,
            "final_decision": self.final_decision,
            "confidence": self.confidence,
            "rounds_count": len(self.rounds),
            "winner_agent": self.winner_agent,
            "key_arguments": self.key_arguments,
            "compromises": self.compromises,
            "timestamp": self.timestamp.isoformat()
        }


class DebateAgent:
    """
    A participant in the debate
    Each agent has a perspective and can generate arguments
    """

    def __init__(self, agent_id: str, llm_client=None, perspective: str = "neutral"):
        self.agent_id = agent_id
        self.llm = llm_client
        self.perspective = perspective
        self.temperature = 0.7  # More creative for debate

    async def state_initial_position(self, topic: str, proposal: Dict) -> DebatePosition:
        """State initial position on topic"""
        if self.llm:
            return await self._llm_position(topic, proposal, previous_positions=[])
        return self._rule_based_position(topic, proposal)

    async def respond_to_debate(
        self,
        topic: str,
        proposal: Dict,
        my_previous: DebatePosition,
        other_positions: List[DebatePosition]
    ) -> DebatePosition:
        """Respond to other agents' arguments"""
        if self.llm:
            return await self._llm_position(topic, proposal, other_positions, my_previous)
        return self._respond_rule_based(my_previous, other_positions)

    async def _llm_position(
        self,
        topic: str,
        proposal: Dict,
        previous_positions: List[DebatePosition],
        my_previous: Optional[DebatePosition] = None
    ) -> DebatePosition:
        """Generate position using LLM"""

        # Format previous positions
        prev_text = ""
        if previous_positions:
            prev_text = "\n".join([
                f"- {p.agent_id} ({p.stance.value}): {p.argument}"
                for p in previous_positions
            ])

        prompt = f"""You are {self.agent_id} with perspective: {self.perspective}

TOPIC: {topic}
PROPOSAL: {json.dumps(proposal, indent=2)[:500]}

PREVIOUS ARGUMENTS:
{prev_text or "None yet"}

{"YOUR PREVIOUS POSITION: " + my_previous.argument if my_previous else ""}

Based on your perspective, provide your position:
1. Do you SUPPORT, OPPOSE, or remain NEUTRAL?
2. What is your main argument?
3. What evidence supports your position?
4. Your confidence level (0-1)?

Respond with JSON:
{{
    "stance": "support|oppose|neutral",
    "argument": "your main argument",
    "evidence": ["evidence 1", "evidence 2"],
    "confidence": 0.7,
    "concede_points": ["any points you concede to opponents"]
}}"""

        try:
            response = await self.llm.generate(
                prompt=prompt,
                system=f"You are a debate participant. Be persuasive but fair. Perspective: {self.perspective}",
                temperature=self.temperature
            )

            data = self._parse_json(response)

            stance_map = {
                "support": DebateStance.SUPPORT,
                "oppose": DebateStance.OPPOSE,
                "neutral": DebateStance.NEUTRAL
            }

            return DebatePosition(
                agent_id=self.agent_id,
                stance=stance_map.get(data.get("stance", "neutral"), DebateStance.NEUTRAL),
                argument=data.get("argument", "No argument provided"),
                evidence=data.get("evidence", []),
                confidence=data.get("confidence", 0.5)
            )

        except Exception as e:
            logger.error(f"LLM debate position failed: {e}")
            return self._rule_based_position(topic, proposal)

    def _rule_based_position(self, topic: str, proposal: Dict) -> DebatePosition:
        """Fallback rule-based position"""

        # Different perspectives lead to different stances
        if self.perspective == "security":
            # Security-focused agent is cautious
            stance = DebateStance.OPPOSE if "security" not in str(proposal).lower() else DebateStance.SUPPORT
            argument = "Security considerations must be prioritized" if stance == DebateStance.OPPOSE else "Security requirements are met"

        elif self.perspective == "innovation":
            # Innovation-focused agent is supportive
            stance = DebateStance.SUPPORT
            argument = "This proposal advances our capabilities"

        elif self.perspective == "stability":
            # Stability-focused agent is conservative
            code = proposal.get("code", "")
            has_tests = "test" in code.lower() or "assert" in code
            stance = DebateStance.SUPPORT if has_tests else DebateStance.NEUTRAL
            argument = "Need to ensure stability and proper testing"

        else:
            stance = DebateStance.NEUTRAL
            argument = "Awaiting more information before taking a position"

        return DebatePosition(
            agent_id=self.agent_id,
            stance=stance,
            argument=argument,
            evidence=[],
            confidence=0.6
        )

    def _respond_rule_based(
        self,
        my_previous: DebatePosition,
        other_positions: List[DebatePosition]
    ) -> DebatePosition:
        """Rule-based response to debate"""

        # Count opposing and supporting positions
        supports = sum(1 for p in other_positions if p.stance == DebateStance.SUPPORT)
        opposes = sum(1 for p in other_positions if p.stance == DebateStance.OPPOSE)

        # Adjust position based on majority
        if my_previous.stance == DebateStance.NEUTRAL:
            # Move towards majority
            if supports > opposes:
                new_stance = DebateStance.SUPPORT
                argument = "After considering arguments, I support this proposal"
            elif opposes > supports:
                new_stance = DebateStance.OPPOSE
                argument = "After considering arguments, I have concerns"
            else:
                new_stance = DebateStance.NEUTRAL
                argument = my_previous.argument
        else:
            # Hold position but may adjust confidence
            new_stance = my_previous.stance
            argument = my_previous.argument

        # Calculate new confidence
        aligned_count = sum(1 for p in other_positions if p.stance == new_stance)
        new_confidence = 0.5 + (aligned_count * 0.1)

        return DebatePosition(
            agent_id=self.agent_id,
            stance=new_stance,
            argument=argument,
            evidence=my_previous.evidence,
            confidence=min(new_confidence, 0.95)
        )

    def _parse_json(self, text: str) -> Dict:
        """Parse JSON from text"""
        try:
            return json.loads(text)
        except:
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                try:
                    return json.loads(text[start:end])
                except:
                    pass
        return {}


class MultiAgentDebate:
    """
    Orchestrates structured debate between multiple AI agents

    Features:
    - Multiple rounds of debate
    - Counter-argument generation
    - Consensus detection
    - Compromise identification
    """

    def __init__(self, agents: List[DebateAgent], max_rounds: int = 3):
        self.agents = agents
        self.max_rounds = max_rounds
        self.consensus_threshold = 0.7  # 70% agreement for consensus

    async def debate(self, topic: str, proposal: Dict) -> DebateResult:
        """
        Run full debate process
        Returns final decision after all rounds
        """
        logger.info(f"⚖️ Starting debate: {topic[:50]}...")

        rounds: List[DebateRound] = []
        all_positions: List[List[DebatePosition]] = []

        # Round 1: Initial positions
        initial_positions = []
        for agent in self.agents:
            position = await agent.state_initial_position(topic, proposal)
            initial_positions.append(position)
            logger.info(f"  └─ {agent.agent_id}: {position.stance.value} ({position.confidence:.2f})")

        all_positions.append(initial_positions)
        rounds.append(DebateRound(
            round_number=1,
            positions=initial_positions,
            consensus_progress=self._calculate_consensus(initial_positions)
        ))

        # Check for immediate consensus
        if self._consensus_reached(initial_positions):
            logger.info("⚖️ Immediate consensus reached!")
            return self._create_result(topic, rounds, all_positions)

        # Subsequent rounds: Debate
        for round_num in range(2, self.max_rounds + 1):
            logger.info(f"⚖️ Debate round {round_num}")

            round_positions = []
            for i, agent in enumerate(self.agents):
                # Agent sees all other positions from previous round
                other_positions = [p for j, p in enumerate(all_positions[-1]) if j != i]
                my_previous = all_positions[-1][i]

                position = await agent.respond_to_debate(
                    topic, proposal, my_previous, other_positions
                )
                round_positions.append(position)
                logger.info(f"  └─ {agent.agent_id}: {position.stance.value} ({position.confidence:.2f})")

            all_positions.append(round_positions)
            consensus_progress = self._calculate_consensus(round_positions)
            rounds.append(DebateRound(
                round_number=round_num,
                positions=round_positions,
                consensus_progress=consensus_progress
            ))

            # Check for consensus
            if self._consensus_reached(round_positions):
                logger.info(f"⚖️ Consensus reached in round {round_num}!")
                break

        return self._create_result(topic, rounds, all_positions)

    def _calculate_consensus(self, positions: List[DebatePosition]) -> float:
        """Calculate consensus level (0-1)"""
        if not positions:
            return 0.0

        # Count stances
        stance_counts = {}
        for p in positions:
            stance_counts[p.stance] = stance_counts.get(p.stance, 0) + 1

        # Find majority stance
        max_count = max(stance_counts.values())
        return max_count / len(positions)

    def _consensus_reached(self, positions: List[DebatePosition]) -> bool:
        """Check if consensus threshold is met"""
        return self._calculate_consensus(positions) >= self.consensus_threshold

    def _get_majority_stance(self, positions: List[DebatePosition]) -> DebateStance:
        """Get the majority stance"""
        stance_counts = {}
        for p in positions:
            stance_counts[p.stance] = stance_counts.get(p.stance, 0) + 1

        return max(stance_counts.keys(), key=lambda s: stance_counts[s])

    def _create_result(
        self,
        topic: str,
        rounds: List[DebateRound],
        all_positions: List[List[DebatePosition]]
    ) -> DebateResult:
        """Create final debate result"""

        final_positions = all_positions[-1]
        majority_stance = self._get_majority_stance(final_positions)
        consensus = self._calculate_consensus(final_positions)

        # Map stance to decision
        decision_map = {
            DebateStance.SUPPORT: "approve",
            DebateStance.OPPOSE: "reject",
            DebateStance.NEUTRAL: "modify",
            DebateStance.ABSTAIN: "modify"
        }

        # Find winner (highest confidence in winning stance)
        winning_positions = [p for p in final_positions if p.stance == majority_stance]
        winner = max(winning_positions, key=lambda p: p.confidence) if winning_positions else None

        # Extract key arguments
        key_arguments = []
        for p in final_positions:
            if p.stance == majority_stance and p.argument:
                key_arguments.append(f"{p.agent_id}: {p.argument[:100]}")

        # Identify compromises (changed positions)
        compromises = []
        if len(all_positions) > 1:
            for i, agent in enumerate(self.agents):
                initial_stance = all_positions[0][i].stance
                final_stance = final_positions[i].stance
                if initial_stance != final_stance:
                    compromises.append(
                        f"{agent.agent_id} moved from {initial_stance.value} to {final_stance.value}"
                    )

        return DebateResult(
            topic=topic,
            final_decision=decision_map.get(majority_stance, "modify"),
            confidence=consensus,
            rounds=rounds,
            winner_agent=winner.agent_id if winner else None,
            key_arguments=key_arguments,
            compromises=compromises
        )


# Factory function for creating debate with default agents
def create_council_debate(llm_fallback=None) -> MultiAgentDebate:
    """Create debate with standard council perspectives"""
    agents = [
        DebateAgent("Innovator", llm_fallback, "innovation"),
        DebateAgent("Guardian", llm_fallback, "security"),
        DebateAgent("Pragmatist", llm_fallback, "stability"),
    ]
    return MultiAgentDebate(agents, max_rounds=3)
