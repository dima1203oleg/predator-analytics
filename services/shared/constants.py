"""Constants: shared
Predator Analytics v45.1.
"""

# Versioning
SYSTEM_VERSION = "25.1"
PYTHON_VERSION = "3.12"

# Security
DEFAULT_TENANT = "default"
RETENTION_DAYS_AUDIT = 365

# Autonomy Levels
AUTONOMY_L0 = "L0"  # Observe Only
AUTONOMY_L1 = "L1"  # Auto-PR
AUTONOMY_L2 = "L2"  # Auto-Merge
AUTONOMY_L3 = "L3"  # Human Approval Required

# Decision Outcomes
DECISION_APPROVE = "APPROVE"
DECISION_REJECT = "REJECT"
DECISION_ESCALATE = "ESCALATE"
DECISION_OBSERVE = "OBSERVE"
DECISION_HALT = "HALT"

# Infrastructure
DEFAULT_MCP_ROUTER_PORT = 8080
DEFAULT_RTB_ENGINE_PORT = 8081
