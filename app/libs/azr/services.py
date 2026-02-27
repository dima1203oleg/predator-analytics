from __future__ import annotations


"""═══════════════════════════════════════════════════════════════
AZR Risk Assessment Service
Predator Analytics v45
═══════════════════════════════════════════════════════════════.

Implements formal risk assessment model from Constitution.
All calculations are deterministic - no AI interpretation.

NO-AI-OVERRIDE CLAUSE ACTIVE
═══════════════════════════════════════════════════════════════
"""

from datetime import datetime, timedelta
import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from app.libs.azr.models import (
    IMMUTABLE_CORE_COMPONENTS,
    RATE_LIMITS,
    AmendmentCategory,
    AmendmentProposal,
    ApprovalTier,
    ConstitutionalViolation,
    ImpactScope,
    RiskAssessment,
    RiskLevel,
    RollbackTimeframe,
    ViolationSeverity,
)


logger = logging.getLogger("azr.risk")


class AZRRiskAssessmentService:
    """Formal risk assessment service for AZR amendments.
    Implements deterministic risk model from constitutional axioms.
    """

    def __init__(self, ledger_client=None):
        self.ledger_client = ledger_client

    def assess_amendment_risk(
        self,
        proposal: AmendmentProposal
    ) -> RiskAssessment:
        """Perform full risk assessment on amendment proposal.
        Returns deterministic risk score and classification.
        """
        # Determine amendment type
        amendment_type = self._classify_amendment_type(proposal)

        # Determine impact scope
        impact_scope = self._determine_impact_scope(proposal)

        # Calculate complexity score (0-10)
        complexity_score = self._calculate_complexity(proposal)

        # Determine rollback timeframe
        rollback_timeframe = self._estimate_rollback_timeframe(proposal)

        # Use formal model for calculation
        assessment = RiskAssessment.calculate(
            amendment_type=amendment_type,
            impact_scope=impact_scope,
            complexity_score=complexity_score,
            rollback_timeframe=rollback_timeframe
        )

        logger.info(
            f"Risk assessment for {proposal.id}: "
            f"score={assessment.score}, "
            f"level={assessment.classification.value}, "
            f"approval={assessment.approval_level.value}"
        )

        return assessment

    def _classify_amendment_type(self, proposal: AmendmentProposal) -> AmendmentCategory:
        """Classify amendment based on target components and changes."""
        # Check for constitutional changes first
        for component in proposal.target_components:
            if component in IMMUTABLE_CORE_COMPONENTS:
                return AmendmentCategory.CONSTITUTIONAL_CHANGE

        # Check for architectural changes
        architectural_keywords = [
            "schema", "migration", "database", "api_version",
            "protocol", "architecture", "service_split"
        ]
        for keyword in architectural_keywords:
            if keyword in str(proposal.change_specification).lower():
                return AmendmentCategory.ARCHITECTURAL_CHANGE

        # Check for algorithmic changes
        algorithmic_keywords = [
            "algorithm", "parser", "indexer", "processor",
            "analyzer", "calculator", "engine"
        ]
        for keyword in algorithmic_keywords:
            if keyword in str(proposal.change_specification).lower():
                return AmendmentCategory.ALGORITHMIC_CHANGE

        # Default to parameter tuning
        return AmendmentCategory.PARAMETER_TUNING

    def _determine_impact_scope(self, proposal: AmendmentProposal) -> ImpactScope:
        """Determine the scope of amendment impact."""
        component_count = len(proposal.target_components)

        if component_count in {0, 1}:
            return ImpactScope.SINGLE_COMPONENT
        if component_count <= 3:
            return ImpactScope.MULTIPLE_COMPONENTS
        if component_count <= 6:
            return ImpactScope.SYSTEM_WIDE
        return ImpactScope.CROSS_SYSTEM

    def _calculate_complexity(self, proposal: AmendmentProposal) -> float:
        """Calculate complexity score (0-10)."""
        score = 0.0

        # Lines of change estimate
        change_size = len(str(proposal.change_specification))
        if change_size > 10000:
            score += 3.0
        elif change_size > 5000:
            score += 2.0
        elif change_size > 1000:
            score += 1.0

        # Number of affected components
        component_count = len(proposal.target_components)
        score += min(component_count * 0.5, 3.0)

        # Has dependencies
        if proposal.expected_impact.get("dependencies", []):
            score += 1.0

        # Requires data migration
        if proposal.expected_impact.get("data_migration"):
            score += 2.0

        # Has breaking changes
        if proposal.expected_impact.get("breaking_changes"):
            score += 1.0

        return min(score, 10.0)

    def _estimate_rollback_timeframe(self, proposal: AmendmentProposal) -> RollbackTimeframe:
        """Estimate time required for rollback."""
        if not proposal.rollback_plan:
            return RollbackTimeframe.IMPOSSIBLE

        estimated_minutes = proposal.rollback_plan.estimated_duration_minutes

        if estimated_minutes <= 1:
            return RollbackTimeframe.INSTANT
        if estimated_minutes <= 30:
            return RollbackTimeframe.MINUTES
        if estimated_minutes <= 60 * 4:  # 4 hours
            return RollbackTimeframe.HOURS
        return RollbackTimeframe.DAYS

    async def check_rate_limits(
        self,
        proposal: AmendmentProposal,
        risk_level: RiskLevel
    ) -> ConstitutionalViolation | None:
        """Check if rate limit is exceeded for this risk level.
        Implements Axiom 9 rate limiting.
        """
        if not self.ledger_client:
            logger.warning("Ledger client not available for rate limit check")
            return None

        limit = RATE_LIMITS[risk_level.value]
        period_start = datetime.utcnow() - timedelta(days=limit["period_days"])

        # Query recent amendments of same risk level
        recent_count = await self.ledger_client.count_amendments(
            risk_level=risk_level.value,
            since=period_start
        )

        if recent_count >= limit["amount"]:
            return ConstitutionalViolation(
                violation_id="AZR-004",
                axiom="9",
                severity=ViolationSeverity.HIGH,
                message=f"Rate limit exceeded: {recent_count}/{limit['amount']} "
                        f"amendments in {limit['period_days']} days",
                action="QUEUE_FOR_NEXT_PERIOD",
                escalation="ARBITER_BASIC"
            )

        return None

    def generate_constraints(self, risk_score: float) -> list[str]:
        """Generate constraints based on risk score."""
        constraints = []

        if risk_score > 0.3:
            constraints.append("REQUIRES_CHAOS_TESTING")

        if risk_score > 0.5:
            constraints.append("REQUIRES_PERFORMANCE_BASELINE")
            constraints.append("CANARY_DEPLOYMENT_MANDATORY")

        if risk_score > 0.7:
            constraints.append("REQUIRES_EXTERNAL_SECURITY_AUDIT")
            constraints.append("HUMAN_APPROVAL_REQUIRED")

        return constraints

    def get_approval_requirements(
        self,
        approval_level: ApprovalTier
    ) -> dict[str, Any]:
        """Get detailed approval requirements for tier."""
        requirements = {
            ApprovalTier.BASIC: {
                "committees": ["technical"],
                "quorum": {"technical": 0.5},
                "unanimous_required": [],
                "witnesses": 1,
                "timeout_hours": 24
            },
            ApprovalTier.AUDIT: {
                "committees": ["technical", "security"],
                "quorum": {"technical": 0.6, "security": 0.8},
                "unanimous_required": [],
                "witnesses": 3,
                "timeout_hours": 48
            },
            ApprovalTier.COURT: {
                "committees": ["technical", "security", "business", "arbiter"],
                "quorum": {"technical": 0.8, "security": 1.0, "business": 0.8, "arbiter": 1.0},
                "unanimous_required": ["security", "arbiter"],
                "witnesses": 5,
                "timeout_hours": 72
            },
            ApprovalTier.SUPER_MAJORITY: {
                "committees": ["technical", "security", "business", "arbiter", "governance"],
                "quorum": {"technical": 1.0, "security": 1.0, "business": 1.0,
                          "arbiter": 1.0, "governance": 0.78},  # 7/9
                "unanimous_required": ["security", "arbiter"],
                "witnesses": 9,
                "timeout_hours": 168,  # 7 days
                "additional_requirements": [
                    "90_days_production",
                    "zero_major_incidents",
                    "external_audit",
                    "stakeholder_consensus"
                ]
            }
        }

        return requirements.get(approval_level, requirements[ApprovalTier.COURT])


class AZRConstitutionalValidator:
    """Constitutional compliance validator for AZR system.
    Implements checks for all axioms (9-14).
    """

    def validate_proposal(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Validate proposal against all constitutional axioms.
        Returns list of violations (empty if compliant).
        """
        violations = []

        # Axiom 10: Immutable core check
        violations.extend(self._check_immutable_core(proposal))

        # Axiom 9: Rollback plan check
        violations.extend(self._check_rollback_plan(proposal))

        # Axiom 11: Cryptographic commitment check
        violations.extend(self._check_commitment(proposal))

        # Axiom 12: Multi-party approval check
        violations.extend(self._check_approvals(proposal))

        # Axiom 13: Proof requirements check
        violations.extend(self._check_proofs(proposal))

        # Axiom 14: Temporal integrity check
        violations.extend(self._check_temporal_integrity(proposal))

        return violations

    def _check_immutable_core(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Check Axiom 10: No modification of immutable core."""
        violations = []

        for component in proposal.target_components:
            if component in IMMUTABLE_CORE_COMPONENTS:
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-001",
                    axiom="10",
                    severity=ViolationSeverity.CRITICAL,
                    message=f"Attempt to modify immutable core: {component}",
                    action="BLOCK_IMMEDIATELY",
                    escalation="EMERGENCY_GOVERNANCE"
                ))

        return violations

    def _check_rollback_plan(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Check Axiom 9: Rollback plan requirements."""
        violations = []

        if not proposal.risk_assessment:
            return violations

        if proposal.risk_assessment.classification in [RiskLevel.HIGH, RiskLevel.EXTREME]:
            if not proposal.rollback_plan:
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-005",
                    axiom="9",
                    severity=ViolationSeverity.HIGH,
                    message="High-risk amendment requires rollback plan",
                    action="BLOCK_UNTIL_ROLLBACK_PLAN",
                    escalation="TECHNICAL_COMMITTEE"
                ))
            elif not proposal.rollback_plan.tested:
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-006",
                    axiom="9",
                    severity=ViolationSeverity.MEDIUM,
                    message="Rollback plan must be tested before approval",
                    action="REQUIRE_ROLLBACK_TEST",
                    escalation="TECHNICAL_COMMITTEE"
                ))

        return violations

    def _check_commitment(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Check Axiom 11: Cryptographic commitment."""
        violations = []

        # Commitment required after proposal stage
        if proposal.current_state.value not in ["PROPOSED"]:
            if not proposal.commitment:
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-003",
                    axiom="11",
                    severity=ViolationSeverity.HIGH,
                    message="Amendment lacks cryptographic commitment",
                    action="BLOCK_UNTIL_COMMITMENT",
                    escalation="TECHNICAL_REVIEW"
                ))
            elif not proposal.commitment.binding:
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-003b",
                    axiom="11",
                    severity=ViolationSeverity.HIGH,
                    message="Commitment must be binding",
                    action="MAKE_COMMITMENT_BINDING",
                    escalation="TECHNICAL_REVIEW"
                ))

        return violations

    def _check_approvals(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Check Axiom 12: Multi-party approval."""
        violations = []

        # Only check if awaiting deployment
        if proposal.current_state.value != "AWAITING_DEPLOYMENT":
            return violations

        required_committees = ["technical", "security", "business", "arbiter"]

        for committee in required_committees:
            if committee not in proposal.approvals:
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-007",
                    axiom="12",
                    severity=ViolationSeverity.HIGH,
                    message=f"Missing approval from {committee} committee",
                    action="BLOCK_UNTIL_ALL_APPROVALS",
                    escalation="GOVERNANCE_BOARD"
                ))
            else:
                approval = proposal.approvals[committee]

                # Security must be unanimous
                if committee == "security" and not approval.is_unanimous:
                    violations.append(ConstitutionalViolation(
                        violation_id="AZR-008",
                        axiom="12",
                        severity=ViolationSeverity.CRITICAL,
                        message="Security approval must be unanimous",
                        action="REJECT_AMENDMENT",
                        escalation="SECURITY_COUNCIL"
                    ))

                # Arbiter must be unanimous
                if committee == "arbiter" and not approval.is_unanimous:
                    violations.append(ConstitutionalViolation(
                        violation_id="AZR-009",
                        axiom="12",
                        severity=ViolationSeverity.CRITICAL,
                        message="Arbiter approval must be unanimous",
                        action="REJECT_AMENDMENT",
                        escalation="ARBITER_COURT"
                    ))

        return violations

    def _check_proofs(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Check Axiom 13: Proof requirements."""
        violations = []

        claims = proposal.expected_impact.get("claims", [])

        for claim in claims:
            if not claim.get("proof"):
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-010",
                    axiom="13",
                    severity=ViolationSeverity.MEDIUM,
                    message=f"Claim '{claim.get('statement', 'unknown')}' lacks proof",
                    action="REQUIRE_PROOF",
                    escalation="TECHNICAL_COMMITTEE"
                ))
            elif not claim.get("proof", {}).get("verification_method"):
                violations.append(ConstitutionalViolation(
                    violation_id="AZR-011",
                    axiom="13",
                    severity=ViolationSeverity.MEDIUM,
                    message="Proof not independently verifiable",
                    action="ADD_VERIFICATION_METHOD",
                    escalation="AUDIT_TEAM"
                ))

        return violations

    def _check_temporal_integrity(
        self,
        proposal: AmendmentProposal
    ) -> list[ConstitutionalViolation]:
        """Check Axiom 14: Temporal integrity."""
        violations = []

        # Check state history is monotonic
        if len(proposal.states_history) >= 2:
            for i in range(1, len(proposal.states_history)):
                prev_ts = proposal.states_history[i-1].get("timestamp", "")
                curr_ts = proposal.states_history[i].get("timestamp", "")

                if curr_ts < prev_ts:
                    violations.append(ConstitutionalViolation(
                        violation_id="AZR-012",
                        axiom="14",
                        severity=ViolationSeverity.CRITICAL,
                        message="Non-monotonic timestamp detected in state history",
                        action="FORENSIC_INVESTIGATION",
                        escalation="SECURITY_COUNCIL"
                    ))
                    break

        return violations

    def is_constitutional(self, proposal: AmendmentProposal) -> bool:
        """Quick check if proposal passes all constitutional checks."""
        return len(self.validate_proposal(proposal)) == 0

    def has_critical_violations(self, proposal: AmendmentProposal) -> bool:
        """Check if proposal has any critical violations."""
        violations = self.validate_proposal(proposal)
        return any(v.severity == ViolationSeverity.CRITICAL for v in violations)
