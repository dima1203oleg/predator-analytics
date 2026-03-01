from __future__ import annotations


"""═══════════════════════════════════════════════════════════════
AZR (Autonomous Zero-Risk Amendment Runtime) - Core Models
Predator Analytics v45
═══════════════════════════════════════════════════════════════.

CONSTITUTIONAL ENFORCEMENT:
These models implement the formal structures required by
constitutional axioms 9-14. No AI system may modify the
core invariants defined here.

NO-AI-OVERRIDE CLAUSE ACTIVE
═══════════════════════════════════════════════════════════════
"""


from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
import hashlib
import json
from typing import Any
from uuid import UUID, uuid4


# ═══════════════════════════════════════════════════════════════
# CONSTITUTIONAL CONSTANTS (IMMUTABLE)
# ═══════════════════════════════════════════════════════════════

CONSTITUTION_VERSION = "v45"
CONSTITUTION_HASH_ALGORITHM = "SHA3-512"

IMMUTABLE_CORE_COMPONENTS = frozenset({
    "ConstitutionalAxioms",
    "ArbiterAuthority",
    "TruthLedger",
    "GPUPolicy",
    "CLIFirstPrinciple",
})

RATE_LIMITS = {
    "LOW": {"amount": 10, "period_days": 1},
    "MEDIUM": {"amount": 3, "period_days": 7},
    "HIGH": {"amount": 1, "period_days": 30},
    "EXTREME": {"amount": 1, "period_days": 90},
}


# ═══════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════


class RiskLevel(StrEnum):
    """Amendment risk classification (Axiom 9)."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class AmendmentState(StrEnum):
    """Amendment lifecycle states."""

    PROPOSED = "PROPOSED"
    VALIDATING = "VALIDATING"
    SIMULATING = "SIMULATING"
    CHAOS_TESTING = "CHAOS_TESTING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPROVED = "APPROVED"
    DEPLOYING = "DEPLOYING"
    ACTIVE = "ACTIVE"
    ROLLING_BACK = "ROLLING_BACK"
    ROLLED_BACK = "ROLLED_BACK"
    REJECTED = "REJECTED"


class AmendmentCategory(StrEnum):
    """Categories of amendments."""

    PARAMETER_TUNING = "PARAMETER_TUNING"
    ALGORITHMIC_CHANGE = "ALGORITHMIC_CHANGE"
    ARCHITECTURAL_CHANGE = "ARCHITECTURAL_CHANGE"
    CONSTITUTIONAL_CHANGE = "CONSTITUTIONAL_CHANGE"


class ImpactScope(StrEnum):
    """Scope of amendment impact."""

    SINGLE_COMPONENT = "SINGLE_COMPONENT"
    MULTIPLE_COMPONENTS = "MULTIPLE_COMPONENTS"
    SYSTEM_WIDE = "SYSTEM_WIDE"
    CROSS_SYSTEM = "CROSS_SYSTEM"


class RollbackTimeframe(StrEnum):
    """Time required for rollback."""

    INSTANT = "INSTANT"
    MINUTES = "MINUTES"
    HOURS = "HOURS"
    DAYS = "DAYS"
    IMPOSSIBLE = "IMPOSSIBLE"


class ApprovalTier(StrEnum):
    """Arbiter approval tiers (Axiom 12)."""

    BASIC = "ARBITER_BASIC"
    AUDIT = "ARBITER_AUDIT"
    COURT = "ARBITER_COURT"
    SUPER_MAJORITY = "SUPER_MAJORITY"


class ViolationSeverity(StrEnum):
    """Constitutional violation severity."""

    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ═══════════════════════════════════════════════════════════════
# DATA MODELS
# ═══════════════════════════════════════════════════════════════


@dataclass
class CryptographicCommitment:
    """Cryptographic commitment for amendment (Axiom 11)
    Every proposal must have a binding commitment.
    """

    commitment_id: UUID
    proposal_id: UUID
    merkle_root: str
    signature: str
    timestamp: datetime
    binding: bool = True
    fulfilled: bool = False

    def compute_hash(self) -> str:
        """Compute SHA3-512 hash of commitment."""
        content = json.dumps(
            {
                "commitment_id": str(self.commitment_id),
                "proposal_id": str(self.proposal_id),
                "merkle_root": self.merkle_root,
                "signature": self.signature,
                "timestamp": self.timestamp.isoformat(),
                "binding": self.binding,
            },
            sort_keys=True,
        )
        return hashlib.sha3_512(content.encode()).hexdigest()


@dataclass
class RollbackPlan:
    """Required rollback plan for amendments (Axiom 9)."""

    plan_id: UUID
    amendment_id: UUID
    steps: list[dict[str, Any]]
    estimated_duration_minutes: int
    tested: bool = False
    test_results: dict[str, Any] | None = None
    data_preservation_strategy: str = ""
    rollback_triggers: list[str] = field(default_factory=list)

    def is_valid(self) -> bool:
        """Check if rollback plan meets requirements."""
        return (
            len(self.steps) > 0
            and self.estimated_duration_minutes > 0
            and len(self.data_preservation_strategy) > 0
            and len(self.rollback_triggers) > 0
        )


@dataclass
class CommitteeApproval:
    """Multi-party approval record (Axiom 12)."""

    committee_name: str
    votes_for: int
    votes_against: int
    total_votes: int
    approved_at: datetime | None = None
    signatures: list[str] = field(default_factory=list)
    deliberation_notes: str = ""

    @property
    def is_approved(self) -> bool:
        return self.votes_for > self.votes_against

    @property
    def is_unanimous(self) -> bool:
        return self.votes_for == self.total_votes


@dataclass
class VerifiableProof:
    """Verifiable proof for claims (Axiom 13)."""

    proof_id: UUID
    claim_id: UUID
    proof_type: str  # merkle, zk, signature, etc.
    proof_data: str
    verification_method: str
    verified: bool = False
    verified_at: datetime | None = None
    verifier_id: str | None = None


@dataclass
class ConstitutionalViolation:
    """Record of constitutional violation."""

    violation_id: str
    axiom: str
    severity: ViolationSeverity
    message: str
    action: str
    escalation: str
    detected_at: datetime = field(default_factory=datetime.utcnow)
    resolved: bool = False
    resolution_notes: str = ""


@dataclass
class RiskAssessment:
    """Formal risk assessment for amendments."""

    score: float
    classification: RiskLevel
    approval_level: ApprovalTier
    constraints: list[str]
    assessed_at: datetime = field(default_factory=datetime.utcnow)
    assessor: str = "azr_risk_model"

    @classmethod
    def calculate(
        cls,
        amendment_type: AmendmentCategory,
        impact_scope: ImpactScope,
        complexity_score: float,
        rollback_timeframe: RollbackTimeframe,
    ) -> RiskAssessment:
        """Calculate risk score using formal model.
        Deterministic - no AI interpretation allowed.
        """
        # Base risk by type
        base_risks = {
            AmendmentCategory.PARAMETER_TUNING: 0.1,
            AmendmentCategory.ALGORITHMIC_CHANGE: 0.3,
            AmendmentCategory.ARCHITECTURAL_CHANGE: 0.6,
            AmendmentCategory.CONSTITUTIONAL_CHANGE: 0.9,
        }
        base_risk = base_risks[amendment_type]

        # Scope multiplier
        scope_multipliers = {
            ImpactScope.SINGLE_COMPONENT: 1.0,
            ImpactScope.MULTIPLE_COMPONENTS: 1.5,
            ImpactScope.SYSTEM_WIDE: 2.0,
            ImpactScope.CROSS_SYSTEM: 3.0,
        }
        scope_mult = scope_multipliers[impact_scope]

        # Complexity multiplier (1.0 - 2.0 based on 0-10 score)
        complexity_mult = 1 + (complexity_score / 10)

        # Rollback factor
        rollback_factors = {
            RollbackTimeframe.INSTANT: 0.5,
            RollbackTimeframe.MINUTES: 0.7,
            RollbackTimeframe.HOURS: 0.9,
            RollbackTimeframe.DAYS: 1.2,
            RollbackTimeframe.IMPOSSIBLE: 2.0,
        }
        rollback_factor = rollback_factors[rollback_timeframe]

        # Final score
        score = base_risk * scope_mult * complexity_mult * rollback_factor
        score = round(min(score, 1.0), 3)  # Cap at 1.0

        # Deterministic classification
        if score <= 0.2:
            risk_class = RiskLevel.LOW
            approval = ApprovalTier.BASIC
        elif score <= 0.4:
            risk_class = RiskLevel.MEDIUM
            approval = ApprovalTier.AUDIT
        elif score <= 0.7:
            risk_class = RiskLevel.HIGH
            approval = ApprovalTier.COURT
        else:
            risk_class = RiskLevel.EXTREME
            approval = ApprovalTier.SUPER_MAJORITY

        # Generate constraints
        constraints = []
        if score > 0.3:
            constraints.append("REQUIRES_CHAOS_TESTING")
        if score > 0.5:
            constraints.append("REQUIRES_PERFORMANCE_BASELINE")
            constraints.append("CANARY_DEPLOYMENT_MANDATORY")
        if score > 0.7:
            constraints.append("REQUIRES_EXTERNAL_SECURITY_AUDIT")
            constraints.append("HUMAN_APPROVAL_REQUIRED")

        return cls(score=score, classification=risk_class, approval_level=approval, constraints=constraints)


@dataclass
class AmendmentProposal:
    """Formal amendment proposal structure.
    Implements requirements from Axiom 9 (bounded self-improvement).
    """

    # Identity
    id: UUID = field(default_factory=uuid4)
    version: str = "1.0"
    created_at: datetime = field(default_factory=datetime.utcnow)
    created_by: str = "azr_observation_engine"

    # Content
    title: str = ""
    description: str = ""
    category: AmendmentCategory = AmendmentCategory.PARAMETER_TUNING

    # Technical details
    target_components: list[str] = field(default_factory=list)
    change_specification: dict[str, Any] = field(default_factory=dict)
    expected_impact: dict[str, Any] = field(default_factory=dict)
    success_metrics: list[dict[str, Any]] = field(default_factory=list)

    # State
    current_state: AmendmentState = AmendmentState.PROPOSED
    states_history: list[dict[str, Any]] = field(default_factory=list)

    # Risk & Safety
    risk_assessment: RiskAssessment | None = None
    rollback_plan: RollbackPlan | None = None

    # Approvals (Axiom 12)
    approvals: dict[str, CommitteeApproval] = field(default_factory=dict)

    # Cryptographic commitment (Axiom 11)
    commitment: CryptographicCommitment | None = None

    # Testing
    simulation_results: dict[str, Any] | None = None
    chaos_testing_completed: bool = False
    chaos_testing_score: float = 0.0

    # Chain integrity (Axiom 14)
    previous_hash: str | None = None
    current_hash: str | None = None

    def compute_hash(self) -> str:
        """Compute hash for chain integrity."""
        content = json.dumps(
            {
                "id": str(self.id),
                "title": self.title,
                "category": self.category.value,
                "target_components": self.target_components,
                "change_specification": self.change_specification,
                "previous_hash": self.previous_hash,
                "timestamp": self.created_at.isoformat(),
            },
            sort_keys=True,
        )
        return hashlib.sha3_512(content.encode()).hexdigest()

    def transition_state(self, new_state: AmendmentState, reason: str = "") -> None:
        """Record state transition with timestamp."""
        self.states_history.append({
            "from_state": self.current_state.value,
            "to_state": new_state.value,
            "timestamp": datetime.utcnow().isoformat(),
            "reason": reason,
        })
        self.current_state = new_state

    def validate_constitutional_compliance(self) -> list[ConstitutionalViolation]:
        """Check if proposal complies with constitutional axioms.
        Returns list of violations.
        """
        violations = []

        # Axiom 10: Check immutable core
        for component in self.target_components:
            if component in IMMUTABLE_CORE_COMPONENTS:
                violations.append(
                    ConstitutionalViolation(
                        violation_id="AZR-001",
                        axiom="10",
                        severity=ViolationSeverity.CRITICAL,
                        message=f"Cannot modify immutable core: {component}",
                        action="BLOCK_IMMEDIATELY",
                        escalation="EMERGENCY_GOVERNANCE",
                    )
                )

        # Axiom 9: Check rollback plan for high risk
        if self.risk_assessment and self.risk_assessment.classification in [RiskLevel.HIGH, RiskLevel.EXTREME]:
            if not self.rollback_plan or not self.rollback_plan.is_valid():
                violations.append(
                    ConstitutionalViolation(
                        violation_id="AZR-005",
                        axiom="9",
                        severity=ViolationSeverity.HIGH,
                        message="High-risk amendment requires valid rollback plan",
                        action="BLOCK_UNTIL_ROLLBACK_PLAN",
                        escalation="TECHNICAL_COMMITTEE",
                    )
                )

        # Axiom 11: Check cryptographic commitment
        if self.current_state != AmendmentState.PROPOSED and not self.commitment:
            violations.append(
                ConstitutionalViolation(
                    violation_id="AZR-003",
                    axiom="11",
                    severity=ViolationSeverity.HIGH,
                    message="Amendment lacks cryptographic commitment",
                    action="BLOCK_UNTIL_COMMITMENT",
                    escalation="TECHNICAL_REVIEW",
                )
            )

        return violations

    def is_constitutional(self) -> bool:
        """Quick check if proposal is constitutional."""
        return len(self.validate_constitutional_compliance()) == 0


@dataclass
class AZRAmendmentRecord:
    """Immutable record for Truth Ledger.
    Implements Axiom 14 (temporal irreversibility).
    """

    amendment_id: UUID
    proposal: AmendmentProposal

    # Metadata
    title: str
    category: str
    risk_level: str

    # State
    current_state: str
    states_history: list[dict[str, Any]]

    # Approvals
    arbiter_decision: dict[str, Any] | None
    witness_signatures: list[str]
    approved_at: datetime | None

    # Deployment
    deployment_strategy: dict[str, Any] | None
    rollout_percentage: float
    deployed_at: datetime | None

    # Rollback
    rollback_triggered: bool
    rollback_reason: str | None
    rolled_back_at: datetime | None

    # Cryptography (Axiom 14)
    evidence_hash: str
    decision_hash: str
    previous_hash: str | None

    # Audit
    created_at: datetime
    updated_at: datetime

    def verify_chain_integrity(self, previous_record: AZRAmendmentRecord | None) -> bool:
        """Verify hash chain integrity (Axiom 14)."""
        if previous_record is None:
            return self.previous_hash is None
        return self.previous_hash == previous_record.decision_hash


# ═══════════════════════════════════════════════════════════════
# ROLLBACK TRIGGER DEFINITIONS
# ═══════════════════════════════════════════════════════════════


@dataclass
class RollbackTrigger:
    """Automatic rollback trigger definition."""

    trigger_type: str
    severity: ViolationSeverity
    threshold: float
    actual_value: float
    description: str
    detected_at: datetime = field(default_factory=datetime.utcnow)

    @property
    def is_critical(self) -> bool:
        return self.severity == ViolationSeverity.CRITICAL


# Default rollback triggers
DEFAULT_ROLLBACK_TRIGGERS = [
    {
        "type": "CONSTITUTIONAL_VIOLATION",
        "threshold": 0,
        "severity": "CRITICAL",
        "description": "Any constitutional violation triggers immediate rollback",
    },
    {
        "type": "PERFORMANCE_DEGRADATION",
        "threshold": 5.0,  # percent
        "severity": "HIGH",
        "description": "Performance degradation above 5%",
    },
    {
        "type": "ERROR_RATE_INCREASE",
        "threshold": 1.0,  # percent
        "severity": "HIGH",
        "description": "Error rate increase above 1%",
    },
    {
        "type": "USER_COMPLAINTS",
        "threshold": 10,  # count
        "severity": "MEDIUM",
        "description": "User complaints threshold exceeded",
    },
    {
        "type": "RESOURCE_ANOMALY",
        "threshold": 0,
        "severity": "MEDIUM",
        "description": "Resource usage anomalies detected",
    },
]
