"""PREDATOR Knowledge Engineering Core
Система формування знання з відповідальністю.

9 КРИТИЧНИХ ШАРІВ:
1. Workflow / State Machine (FSM)
2. Data Quality Engine (DQ)
3. Entity Resolution Engine
4. Data Versioning & Reprocessing
5. Data Observability Layer
6. Rules / Policy Engine
7. Explainability & Audit Trail
8. Human-in-the-loop
9. Load / Cost Governor
"""

from .engine import (
    AuditEntry,
    DataMetrics,
    # Observability
    DataObservabilityLayer,
    # Data Quality
    DataQualityEngine,
    DataVersion,
    EntityMatch,
    # Entity Resolution
    EntityResolutionEngine,
    # Explainability
    ExplainabilityEngine,
    Explanation,
    # Human-in-the-loop
    HumanInTheLoopController,
    # Cost Governor
    LoadCostGovernor,
    # State Machine
    PipelineState,
    QualityReport,
    QualityRule,
    ResourceBudget,
    ReviewTask,
    Rule,
    # Rules Engine
    RuleEngine,
    StateTransition,
    # Versioning
    VersioningEngine,
    WorkflowEvent,
    WorkflowOrchestrator,
)

__all__ = [
    "AuditEntry",
    "DataMetrics",
    "DataObservabilityLayer",
    "DataQualityEngine",
    "DataVersion",
    "EntityMatch",
    "EntityResolutionEngine",
    "ExplainabilityEngine",
    "Explanation",
    "HumanInTheLoopController",
    "LoadCostGovernor",
    "PipelineState",
    "QualityReport",
    "QualityRule",
    "ResourceBudget",
    "ReviewTask",
    "Rule",
    "RuleEngine",
    "StateTransition",
    "VersioningEngine",
    "WorkflowEvent",
    "WorkflowOrchestrator",
]

__version__ = "31.0.0"
