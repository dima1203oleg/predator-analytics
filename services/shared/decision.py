
"""
Module: decision
Component: shared
Predator Analytics v25.1
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
import uuid
from .events import PredatorEvent

@dataclass
class DecisionArtifact:
    """
    Immutable artifact of an RTB Engine decision.
    Part 3.2.2 of Technical Specification.
    """
    decision_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Triggering event
    trigger_event: Optional[PredatorEvent] = None
    correlation_id: str = ""

    # Rule Information
    rule_id: str = ""
    rule_version: str = ""
    rule_condition: str = ""

    # Context snapshot
    context_snapshot: Dict = field(default_factory=dict)
    context_hash: str = ""  # SHA256 for lineage

    # LLM consultation (if any)
    llm_consulted: bool = False
    llm_prompt: Optional[str] = None
    llm_response: Optional[str] = None
    llm_provider: Optional[str] = None
    llm_model: Optional[str] = None
    llm_trace_id: Optional[str] = None

    # Decision details
    decision: str = ""       # APPROVE / REJECT / ESCALATE / OBSERVE
    reason: str = ""
    autonomy_level: str = "" # L0 / L1 / L2 / L3
    human_approval_required: bool = False
    human_approved_by: Optional[str] = None
    human_approved_at: Optional[datetime] = None

    # Resulting action
    action_type: str = ""    # git_pr / k8s_job / notification / none
    action_artifact: str = ""  # PR URL, Job ID, etc.

    # Lineage information
    data_hash: Optional[str] = None   # SHA256 of data used
    model_hash: Optional[str] = None  # SHA256 of model

    # Multi-tenancy
    tenant_id: str = "default"

    def to_dict(self) -> dict:
        return {
            "decision_id": self.decision_id,
            "timestamp": self.timestamp.isoformat() + "Z",
            "trigger_event": self.trigger_event.to_dict() if self.trigger_event else None,
            "correlation_id": self.correlation_id,
            "rule_id": self.rule_id,
            "rule_version": self.rule_version,
            "rule_condition": self.rule_condition,
            "context_snapshot": self.context_snapshot,
            "context_hash": self.context_hash,
            "llm_consulted": self.llm_consulted,
            "llm_prompt": self.llm_prompt,
            "llm_response": self.llm_response,
            "llm_provider": self.llm_provider,
            "llm_model": self.llm_model,
            "llm_trace_id": self.llm_trace_id,
            "decision": self.decision,
            "reason": self.reason,
            "autonomy_level": self.autonomy_level,
            "human_approval_required": self.human_approval_required,
            "human_approved_by": self.human_approved_by,
            "human_approved_at": self.human_approved_at.isoformat() + "Z" if self.human_approved_at else None,
            "action_type": self.action_type,
            "action_artifact": self.action_artifact,
            "data_hash": self.data_hash,
            "model_hash": self.model_hash,
            "tenant_id": self.tenant_id
        }
