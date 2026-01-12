"""
═══════════════════════════════════════════════════════════════
AZR Library - Autonomous Zero-Risk Amendment Runtime
Predator Analytics v26
═══════════════════════════════════════════════════════════════

This library implements the constitutional framework for
safe, autonomous system self-improvement.

CONSTITUTIONAL GUARANTEES:
- System may evolve, but not redefine its truth
- System may act autonomously, but never without proof
- System may optimize itself, but never escape its constitution

NO-AI-OVERRIDE CLAUSE ACTIVE
═══════════════════════════════════════════════════════════════
"""

from libs.azr.models import (
    # Enums
    RiskLevel,
    AmendmentState,
    AmendmentCategory,
    ImpactScope,
    RollbackTimeframe,
    ApprovalTier,
    ViolationSeverity,

    # Core Models
    AmendmentProposal,
    RiskAssessment,
    RollbackPlan,
    CryptographicCommitment,
    CommitteeApproval,
    VerifiableProof,
    ConstitutionalViolation,
    RollbackTrigger,
    AZRAmendmentRecord,

    # Constants
    CONSTITUTION_VERSION,
    CONSTITUTION_HASH_ALGORITHM,
    IMMUTABLE_CORE_COMPONENTS,
    RATE_LIMITS,
    DEFAULT_ROLLBACK_TRIGGERS,
)

from libs.azr.services import (
    AZRRiskAssessmentService,
    AZRConstitutionalValidator,
)

__all__ = [
    # Enums
    "RiskLevel",
    "AmendmentState",
    "AmendmentCategory",
    "ImpactScope",
    "RollbackTimeframe",
    "ApprovalTier",
    "ViolationSeverity",

    # Core Models
    "AmendmentProposal",
    "RiskAssessment",
    "RollbackPlan",
    "CryptographicCommitment",
    "CommitteeApproval",
    "VerifiableProof",
    "ConstitutionalViolation",
    "RollbackTrigger",
    "AZRAmendmentRecord",

    # Constants
    "CONSTITUTION_VERSION",
    "CONSTITUTION_HASH_ALGORITHM",
    "IMMUTABLE_CORE_COMPONENTS",
    "RATE_LIMITS",
    "DEFAULT_ROLLBACK_TRIGGERS",

    # Services
    "AZRRiskAssessmentService",
    "AZRConstitutionalValidator",
]

# Constitutional Version Check
def verify_constitution_active() -> bool:
    """Verify constitutional framework is active and enforced"""
    return CONSTITUTION_VERSION == "v26"

def get_constitution_summary() -> dict:
    """Get summary of active constitution"""
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
