"""Module: artifact
Component: rtb-engine
Predator Analytics v45.1.
"""

from dataclasses import dataclass, field
from datetime import datetime
import uuid


@dataclass
class DecisionArtifact:
    """Immutable audit record for every RTB Engine decision (Spec Part 3.2.2).
    Stored in PostgreSQL for 365 days.
    """

    decision_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Triggering event info
    trigger_event_id: str = ""
    event_type: str = ""
    correlation_id: str = ""

    # Rule evaluation
    rule_id: str = ""
    rule_version: str = "1.0"
    rule_condition: str = ""

    # Decision details
    decision: str = ""  # APPROVE / REJECT / ESCALATE / OBSERVE
    reason: str = ""
    autonomy_level: str = "L0"  # L0 / L1 / L2 / L3

    # LLM advice (if consulted)
    llm_consulted: bool = False
    llm_trace_id: str | None = None
    llm_response: str | None = None

    # Resulting action
    action_type: str = "none"  # git_pr / k8s_job / notification / none
    action_artifact: str = ""  # Job ID, PR URL, etc.

    metadata: dict = field(default_factory=dict)
    tenant_id: str = "default"

    def to_dict(self) -> dict:
        return {
            "decision_id": self.decision_id,
            "timestamp": self.timestamp.isoformat() + "Z",
            "trigger_event_id": self.trigger_event_id,
            "event_type": self.event_type,
            "correlation_id": self.correlation_id,
            "rule_id": self.rule_id,
            "rule_version": self.rule_version,
            "decision": self.decision,
            "reason": self.reason,
            "autonomy_level": self.autonomy_level,
            "llm_consulted": self.llm_consulted,
            "action_type": self.action_type,
            "action_artifact": self.action_artifact,
            "metadata": self.metadata,
        }
