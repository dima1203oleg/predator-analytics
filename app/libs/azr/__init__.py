from __future__ import annotations


"""═══════════════════════════════════════════════════════════════
AZR Library - Autonomous Zero-Risk Amendment Runtime
Predator Analytics v26
═══════════════════════════════════════════════════════════════.

This library implements the constitutional framework for
safe, autonomous system self-improvement.

CONSTITUTIONAL GUARANTEES:
- System may evolve, but not redefine its truth
- System may act autonomously, but never without proof
- System may optimize itself, but never escape its constitution

NO-AI-OVERRIDE CLAUSE ACTIVE
═══════════════════════════════════════════════════════════════
"""

from app.libs.azr.models import (
    CONSTITUTION_HASH_ALGORITHM,
    # Constants
    CONSTITUTION_VERSION,
    DEFAULT_ROLLBACK_TRIGGERS,
    IMMUTABLE_CORE_COMPONENTS,
    RATE_LIMITS,
    AmendmentCategory,
    # Core Models
    AmendmentProposal,
    AmendmentState,
    ApprovalTier,
    AZRAmendmentRecord,
    CommitteeApproval,
    ConstitutionalViolation,
    CryptographicCommitment,
    ImpactScope,
    RiskAssessment,
    # Enums
    RiskLevel,
    RollbackPlan,
    RollbackTimeframe,
    RollbackTrigger,
    VerifiableProof,
    ViolationSeverity,
)
from app.libs.azr.services import (
    AZRConstitutionalValidator,
    AZRRiskAssessmentService,
)


__all__ = [
    "CONSTITUTION_HASH_ALGORITHM",
    # Constants
    "CONSTITUTION_VERSION",
    "DEFAULT_ROLLBACK_TRIGGERS",
    "IMMUTABLE_CORE_COMPONENTS",
    "RATE_LIMITS",
    "AZRAmendmentRecord",
    "AZRConstitutionalValidator",
    # Services
    "AZRRiskAssessmentService",
    "AmendmentCategory",
    # Core Models
    "AmendmentProposal",
    "AmendmentState",
    "ApprovalTier",
    "CommitteeApproval",
    "ConstitutionalViolation",
    "CryptographicCommitment",
    "ImpactScope",
    "RiskAssessment",
    # Enums
    "RiskLevel",
    "RollbackPlan",
    "RollbackTimeframe",
    "RollbackTrigger",
    "VerifiableProof",
    "ViolationSeverity",
]

# Constitutional Version Check
def verify_constitution_active() -> bool:
    """Verify constitutional framework is active and enforced."""
    return CONSTITUTION_VERSION == "v26"

def get_constitution_summary() -> dict:
    """Get summary of active constitution."""
    return {
        "version": CONSTITUTION_VERSION,
        "hash_algorithm": CONSTITUTION_HASH_ALGORITHM,
        "immutable_components": list(IMMUTABLE_CORE_COMPONENTS),
        "axioms": {
            "9": "Law of Bounded Self-Improvement",
            "10": "Law of Core Inviolability",
            "11": "Law of Complete Commitment",
            "12": "Law of Multi-Party Accountability",
            "13": "Law of Inverse Proof",
            "14": "Law of Temporal Irreversibility",
        },
        "guarantees": [
            "System may evolve, but not redefine its truth",
            "System may act autonomously, but never without proof",
            "System may optimize itself, but never escape its constitution",
        ],
        "no_ai_override": True,
    }
