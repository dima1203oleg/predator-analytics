"""
Multi-Agent Coordination & Improvement Proposals - SOM v29
"""
import asyncio
import logging
import uuid
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

logger = logging.getLogger(__name__)

class AgentRole(Enum):
    ARCHITECT = "architect"
    ENGINEER = "engineer"
    AUDITOR = "auditor"
    NEGOTIATOR = "negotiator"
    ARBITER = "arbiter"  # legacy/core arbiter
    HUMAN = "human"

class ProposalPriority(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ImprovementProposal(BaseModel):
    """Пропозиція вдосконалення від SOM"""
    id: str = str(uuid.uuid4())
    title: str
    description: str
    priority: ProposalPriority
    proposed_by: AgentRole
    meta: Dict[str, Any] = {}
    requires_human_approval: bool = False
    digital_twin_test_required: bool = True
    formal_verification_required: bool = False
    created_at: str = datetime.utcnow().isoformat()
    status: str = "PENDING"  # PENDING, TESTING, APPROVED, REJECTED, APPLIED

class AgentCoordinationProtocol:
    def __init__(self, axiom_registry: Any):
        self.axioms = axiom_registry
        self.active_proposals: Dict[str, ImprovementProposal] = {}

    async def submit_proposal(self, proposal: ImprovementProposal) -> Dict[str, Any]:
        """Подання та валідація пропозиції"""
        logger.info(f"SOM: New proposal submitted: {proposal.title} ({proposal.id})")

        # 1. Конституційна перевірка (Axiom Check)
        compliance = await self._check_compliance(proposal)
        if not compliance["passed"]:
            proposal.status = "REJECTED"
            return {"status": "REJECTED", "reason": "CONSTITUTIONAL_VIOLATION", "violations": compliance["violations"]}

        # 2. Реєстрація
        self.active_proposals[proposal.id] = proposal

        # 3. Визначення Workflow
        workflow = self._determine_workflow(proposal)
        proposal.status = "VALIDATED"

        return {
            "status": "ACCEPTED",
            "proposal_id": proposal.id,
            "workflow": workflow
        }

    async def _check_compliance(self, proposal: ImprovementProposal) -> Dict:
        """Перевірка на відповідність аксіомам"""
        violations = []
        # Axiom-001: Human Sovereignty
        if proposal.priority == ProposalPriority.CRITICAL and not proposal.requires_human_approval:
            violations.append("AXIOM-001: Critical proposals MUST require human approval.")

        # Axiom-002: Constitutional Immutability
        if "axiom" in proposal.description.lower() or "constitution" in proposal.description.lower():
            if proposal.proposed_by != AgentRole.HUMAN:
                violations.append("AXIOM-002: Only humans can propose constitutional changes.")

        return {"passed": len(violations) == 0, "violations": violations}

    def _determine_workflow(self, proposal: ImprovementProposal) -> List[Dict]:
        steps = []
        steps.append({"step": 1, "agent": AgentRole.ARCHITECT, "action": "analysis"})

        if proposal.formal_verification_required:
            steps.append({"step": 2, "agent": AgentRole.AUDITOR, "action": "formal_verification"})

        if proposal.digital_twin_test_required:
            steps.append({"step": 3, "agent": AgentRole.ENGINEER, "action": "sandbox_test"})

        if proposal.requires_human_approval:
            steps.append({"step": 4, "agent": AgentRole.HUMAN, "action": "sign_off"})

        steps.append({"step": 5, "agent": AgentRole.ENGINEER, "action": "deploy"})
        return steps
