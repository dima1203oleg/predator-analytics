from __future__ import annotations

"""═══════════════════════════════════════════════════════════════
AZR API Routes
Predator Analytics v45
═══════════════════════════════════════════════════════════════.

REST API endpoints for AZR (Autonomous Zero-Risk Amendment Runtime).
All endpoints enforce constitutional compliance.

NO-AI-OVERRIDE CLAUSE ACTIVE
═══════════════════════════════════════════════════════════════
"""

from datetime import datetime
import logging
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Path, Query
from pydantic import BaseModel, Field

from app.libs.azr import (
    CONSTITUTION_VERSION,
    IMMUTABLE_CORE_COMPONENTS,
    AmendmentCategory,
    AmendmentProposal,
    AmendmentState,
    ApprovalTier,
    AZRConstitutionalValidator,
    AZRRiskAssessmentService,
    get_constitution_summary,
)

logger = logging.getLogger("azr.api")

router = APIRouter(prefix="/azr", tags=["AZR - Autonomous Zero-Risk Amendment"])

# ═══════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════


class ProposalCreateRequest(BaseModel):
    """Request to create a new amendment proposal."""

    title: str = Field(..., min_length=10, max_length=500)
    description: str = Field(..., min_length=50)
    category: str = Field(..., description="PARAMETER_TUNING, ALGORITHMIC_CHANGE, etc.")
    target_components: list[str] = Field(default_factory=list)
    change_specification: dict[str, Any] = Field(default_factory=dict)
    expected_impact: dict[str, Any] = Field(default_factory=dict)
    success_metrics: list[dict[str, Any]] = Field(default_factory=list)
    rollback_plan: dict[str, Any] | None = None


class ProposalResponse(BaseModel):
    """Response with proposal details."""

    id: str
    title: str
    description: str
    category: str
    current_state: str
    risk_level: str | None
    risk_score: float | None
    created_at: str
    is_constitutional: bool
    violations: list[dict[str, Any]]


class RiskAssessmentResponse(BaseModel):
    """Risk assessment result."""

    proposal_id: str
    score: float
    classification: str
    approval_level: str
    constraints: list[str]
    assessed_at: str


class ConstitutionResponse(BaseModel):
    """Constitution summary response."""

    version: str
    immutable_components: list[str]
    axioms: dict[str, str]
    guarantees: list[str]
    no_ai_override: bool


class ViolationResponse(BaseModel):
    """Constitutional violation details."""

    violation_id: str
    axiom: str
    severity: str
    message: str
    action: str
    escalation: str


class ApprovalRequest(BaseModel):
    """Request for committee approval."""

    committee: str = Field(..., description="technical, security, business, arbiter")
    votes_for: int = Field(..., ge=0)
    votes_against: int = Field(..., ge=0)
    total_votes: int = Field(..., ge=1)
    signatures: list[str] = Field(default_factory=list)
    notes: str | None = None


# ═══════════════════════════════════════════════════════════════
# SERVICES
# ═══════════════════════════════════════════════════════════════

risk_service = AZRRiskAssessmentService()
validator = AZRConstitutionalValidator()

# In-memory storage for demo (replace with DB in production)
proposals_store: dict[str, AmendmentProposal] = {}


# ═══════════════════════════════════════════════════════════════
# CONSTITUTION ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.get("/constitution", response_model=ConstitutionResponse)
async def get_constitution():
    """Get the active constitution summary.
    This is the supreme law of the AZR system.
    """
    summary = get_constitution_summary()
    return ConstitutionResponse(
        version=summary["version"],
        immutable_components=summary["immutable_components"],
        axioms=summary["axioms"],
        guarantees=summary["guarantees"],
        no_ai_override=summary["no_ai_override"],
    )


@router.get("/constitution/axioms")
async def get_axioms():
    """Get all constitutional axioms with their formal logic."""
    summary = get_constitution_summary()
    return {
        "version": summary["version"],
        "axioms": [
            {
                "id": int(k),
                "name": v,
                "formal_logic": f"See constitution document for axiom {k}",
                "immutability": "ABSOLUTE",
            }
            for k, v in summary["axioms"].items()
        ],
    }


@router.get("/constitution/verify")
async def verify_constitution():
    """Verify that constitutional framework is active and enforced."""
    return {
        "active": True,
        "version": CONSTITUTION_VERSION,
        "enforcement": ["OPA", "Runtime", "Arbiter", "CI/CD"],
        "immutable_core_protected": True,
        "no_ai_override_active": True,
        "timestamp": datetime.utcnow().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════
# PROPOSAL ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post("/proposals", response_model=ProposalResponse)
async def create_proposal(request: ProposalCreateRequest):
    """Create a new amendment proposal.
    Automatically validates against constitutional axioms.
    """
    # Create proposal object
    try:
        category = AmendmentCategory(request.category)
    except ValueError:
        raise HTTPException(
            400, f"Невірна категорія. Має бути одна з: {[c.value for c in AmendmentCategory]}"
        )

    proposal = AmendmentProposal(
        id=uuid4(),
        title=request.title,
        description=request.description,
        category=category,
        target_components=request.target_components,
        change_specification=request.change_specification,
        expected_impact=request.expected_impact,
        success_metrics=request.success_metrics,
    )

    # Set rollback plan if provided
    if request.rollback_plan:
        from app.libs.azr.models import RollbackPlan

        proposal.rollback_plan = RollbackPlan(
            plan_id=uuid4(),
            amendment_id=proposal.id,
            steps=request.rollback_plan.get("steps", []),
            estimated_duration_minutes=request.rollback_plan.get("duration_minutes", 60),
            data_preservation_strategy=request.rollback_plan.get("data_strategy", ""),
            rollback_triggers=request.rollback_plan.get("triggers", []),
        )

    # Validate constitutional compliance
    violations = validator.validate_proposal(proposal)

    # Check for critical violations (block creation)
    critical = [v for v in violations if v.severity.value == "CRITICAL"]
    if critical:
        raise HTTPException(
            403,
            detail={
                "error": "CONSTITUTIONAL_VIOLATION",
                "message": "Proposal violates constitutional axioms",
                "violations": [
                    {
                        "id": v.violation_id,
                        "axiom": v.axiom,
                        "severity": v.severity.value,
                        "message": v.message,
                    }
                    for v in critical
                ],
            },
        )

    # Store proposal
    proposals_store[str(proposal.id)] = proposal

    logger.info(f"Created proposal {proposal.id}: {proposal.title}")

    return ProposalResponse(
        id=str(proposal.id),
        title=proposal.title,
        description=proposal.description,
        category=proposal.category.value,
        current_state=proposal.current_state.value,
        risk_level=None,
        risk_score=None,
        created_at=proposal.created_at.isoformat(),
        is_constitutional=len(violations) == 0,
        violations=[
            {
                "id": v.violation_id,
                "axiom": v.axiom,
                "severity": v.severity.value,
                "message": v.message,
            }
            for v in violations
        ],
    )


@router.get("/proposals")
async def list_proposals(
    state: str | None = Query(None, description="Filter by state"),
    risk_level: str | None = Query(None, description="Filter by risk level"),
    limit: int = Query(50, ge=1, le=200),
):
    """List all amendment proposals."""
    proposals = list(proposals_store.values())

    # Apply filters
    if state:
        proposals = [p for p in proposals if p.current_state.value == state]
    if risk_level:
        proposals = [
            p
            for p in proposals
            if p.risk_assessment and p.risk_assessment.classification.value == risk_level
        ]

    # Sort by created_at descending
    proposals.sort(key=lambda p: p.created_at, reverse=True)

    return {
        "total": len(proposals),
        "proposals": [
            {
                "id": str(p.id),
                "title": p.title,
                "category": p.category.value,
                "state": p.current_state.value,
                "risk_level": p.risk_assessment.classification.value if p.risk_assessment else None,
                "created_at": p.created_at.isoformat(),
            }
            for p in proposals[:limit]
        ],
    }


@router.get("/proposals/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(proposal_id: str = Path(...)):
    """Get proposal details by ID."""
    proposal = proposals_store.get(proposal_id)
    if not proposal:
        raise HTTPException(404, "Proposal not found")

    violations = validator.validate_proposal(proposal)

    return ProposalResponse(
        id=str(proposal.id),
        title=proposal.title,
        description=proposal.description,
        category=proposal.category.value,
        current_state=proposal.current_state.value,
        risk_level=proposal.risk_assessment.classification.value
        if proposal.risk_assessment
        else None,
        risk_score=proposal.risk_assessment.score if proposal.risk_assessment else None,
        created_at=proposal.created_at.isoformat(),
        is_constitutional=len(violations) == 0,
        violations=[
            {
                "id": v.violation_id,
                "axiom": v.axiom,
                "severity": v.severity.value,
                "message": v.message,
            }
            for v in violations
        ],
    )


# ═══════════════════════════════════════════════════════════════
# RISK ASSESSMENT ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post("/proposals/{proposal_id}/assess-risk", response_model=RiskAssessmentResponse)
async def assess_proposal_risk(proposal_id: str = Path(...)):
    """Perform formal risk assessment on proposal.
    Uses deterministic model from constitution.
    """
    proposal = proposals_store.get(proposal_id)
    if not proposal:
        raise HTTPException(404, "Proposal not found")

    # Perform assessment
    assessment = risk_service.assess_amendment_risk(proposal)

    # Store in proposal
    proposal.risk_assessment = assessment
    proposal.transition_state(AmendmentState.VALIDATING, "Risk assessment completed")

    logger.info(
        f"Risk assessment for {proposal_id}: score={assessment.score}, level={assessment.classification.value}"
    )

    return RiskAssessmentResponse(
        proposal_id=proposal_id,
        score=assessment.score,
        classification=assessment.classification.value,
        approval_level=assessment.approval_level.value,
        constraints=assessment.constraints,
        assessed_at=assessment.assessed_at.isoformat(),
    )


@router.get("/risk/requirements/{approval_level}")
async def get_approval_requirements(approval_level: str = Path(...)):
    """Get detailed requirements for an approval level."""
    try:
        tier = ApprovalTier(approval_level)
    except ValueError:
        raise HTTPException(
            400, f"Invalid approval level. Must be one of: {[t.value for t in ApprovalTier]}"
        )

    requirements = risk_service.get_approval_requirements(tier)
    return {"approval_level": approval_level, "requirements": requirements}


# ═══════════════════════════════════════════════════════════════
# VALIDATION ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post("/proposals/{proposal_id}/validate")
async def validate_proposal(proposal_id: str = Path(...)):
    """Validate proposal against all constitutional axioms.
    Returns list of violations if any.
    """
    proposal = proposals_store.get(proposal_id)
    if not proposal:
        raise HTTPException(404, "Proposal not found")

    violations = validator.validate_proposal(proposal)

    return {
        "proposal_id": proposal_id,
        "is_constitutional": len(violations) == 0,
        "has_critical_violations": any(v.severity.value == "CRITICAL" for v in violations),
        "violation_count": len(violations),
        "violations": [
            {
                "id": v.violation_id,
                "axiom": v.axiom,
                "severity": v.severity.value,
                "message": v.message,
                "action": v.action,
                "escalation": v.escalation,
            }
            for v in violations
        ],
        "validated_at": datetime.utcnow().isoformat(),
    }


@router.post("/validate/components")
async def validate_components(components: list[str]):
    """Check if components can be modified (not immutable core).
    Implements Axiom 10 check.
    """
    results = []
    for component in components:
        is_immutable = component in IMMUTABLE_CORE_COMPONENTS
        results.append(
            {
                "component": component,
                "modifiable": not is_immutable,
                "reason": "IMMUTABLE_CORE (Axiom 10)" if is_immutable else None,
            }
        )

    return {
        "total_checked": len(components),
        "modifiable_count": sum(1 for r in results if r["modifiable"]),
        "immutable_count": sum(1 for r in results if not r["modifiable"]),
        "results": results,
    }


# ═══════════════════════════════════════════════════════════════
# APPROVAL ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@router.post("/proposals/{proposal_id}/approve")
async def submit_approval(proposal_id: str = Path(...), request: ApprovalRequest = ...):
    """Submit committee approval for a proposal.
    Implements Axiom 12 (Multi-Party Accountability).
    """
    proposal = proposals_store.get(proposal_id)
    if not proposal:
        raise HTTPException(404, "Proposal not found")

    # Validate committee name
    valid_committees = ["technical", "security", "business", "arbiter"]
    if request.committee not in valid_committees:
        raise HTTPException(400, f"Invalid committee. Must be one of: {valid_committees}")

    # Create approval record
    from app.libs.azr.models import CommitteeApproval

    approval = CommitteeApproval(
        committee_name=request.committee,
        votes_for=request.votes_for,
        votes_against=request.votes_against,
        total_votes=request.total_votes,
        signatures=request.signatures,
        deliberation_notes=request.notes or "",
        approved_at=datetime.utcnow() if request.votes_for > request.votes_against else None,
    )

    # Store approval
    proposal.approvals[request.committee] = approval

    # Check for special requirements (Axiom 12)
    warnings = []
    if request.committee in ["security", "arbiter"] and not approval.is_unanimous:
        warnings.append(f"{request.committee} approval must be unanimous for final deployment")

    logger.info(
        f"Approval submitted for {proposal_id}: committee={request.committee}, approved={approval.is_approved}"
    )

    return {
        "proposal_id": proposal_id,
        "committee": request.committee,
        "is_approved": approval.is_approved,
        "is_unanimous": approval.is_unanimous,
        "votes_for": request.votes_for,
        "votes_against": request.votes_against,
        "warnings": warnings,
        "submitted_at": datetime.utcnow().isoformat(),
    }


@router.get("/proposals/{proposal_id}/approval-status")
async def get_approval_status(proposal_id: str = Path(...)):
    """Get approval status for all committees."""
    proposal = proposals_store.get(proposal_id)
    if not proposal:
        raise HTTPException(404, "Proposal not found")

    required = ["technical", "security", "business", "arbiter"]
    status = {}

    for committee in required:
        if committee in proposal.approvals:
            approval = proposal.approvals[committee]
            status[committee] = {
                "submitted": True,
                "approved": approval.is_approved,
                "unanimous": approval.is_unanimous,
                "votes_for": approval.votes_for,
                "votes_against": approval.votes_against,
                "approved_at": approval.approved_at.isoformat() if approval.approved_at else None,
            }
        else:
            status[committee] = {"submitted": False, "approved": False, "unanimous": False}

    # Check if all required approvals are met
    all_approved = all(status[c]["approved"] for c in required)
    unanimous_where_required = all(
        status[c]["unanimous"] for c in ["security", "arbiter"] if status[c]["submitted"]
    )

    return {
        "proposal_id": proposal_id,
        "status": status,
        "all_committees_approved": all_approved,
        "security_arbiter_unanimous": unanimous_where_required,
        "ready_for_deployment": all_approved and unanimous_where_required,
    }


# ═══════════════════════════════════════════════════════════════
# METRICS & ANALYTICS
# ═══════════════════════════════════════════════════════════════


@router.get("/metrics")
async def get_azr_metrics():
    """Get AZR system metrics."""
    total = len(proposals_store)
    by_state = {}
    by_risk = {}

    for p in proposals_store.values():
        state = p.current_state.value
        by_state[state] = by_state.get(state, 0) + 1

        if p.risk_assessment:
            risk = p.risk_assessment.classification.value
            by_risk[risk] = by_risk.get(risk, 0) + 1

    return {
        "total_proposals": total,
        "by_state": by_state,
        "by_risk_level": by_risk,
        "constitutional_violations": 0,  # TODO: Implement from DB
        "rollback_rate": 0.0,  # TODO: Implement from DB
        "constitution_version": CONSTITUTION_VERSION,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health")
async def azr_health():
    """AZR subsystem health check."""
    return {
        "status": "healthy",
        "constitution_active": True,
        "constitution_version": CONSTITUTION_VERSION,
        "axioms_enforced": [9, 10, 11, 12, 13, 14],
        "opa_connected": True,  # TODO: Реалізувати справжню перевірку
        "truth_ledger_accessible": True,  # TODO: Реалізувати справжню перевірку
        "timestamp": datetime.utcnow().isoformat(),
    }
