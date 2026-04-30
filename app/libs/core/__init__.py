from __future__ import annotations

# ============================================================================
# 🏛️ LIBS.CORE - Lazy Loading Module
# ============================================================================
#
# This module uses lazy loading to avoid import issues with optional
# dependencies like numpy. Import specific modules directly when needed.
#
# Example:
#     from app.libs.core.merkle_ledger import get_truth_ledger
#     from app.libs.core.azr_unified import get_azr_organism
#
# ============================================================================
# Safe imports (no optional dependencies)
from app.libs.core.config import settings
from app.libs.core.database import get_db, get_db_ctx

# AZR v40 Core Modules - Import these directly when needed:
# - libs.core.merkle_ledger (Cryptographic Truth Ledger)
# - libs.core.event_sourcing (Event Sourcing Engine)
# - libs.core.formal_state_machine (Verified State Machines)
# - libs.core.graph_rag_memory (Knowledge Graph + RAG)
# - libs.core.mcp_integration (Model Context Protocol)
# - libs.core.red_team_agent (Adversarial Security Testing)
# - libs.core.azr_unified (Unified AZR Organism)


# Lazy imports for modules with optional dependencies
def __getattr__(name: str):
    """Lazy loading for modules with optional dependencies."""
    lazy_modules = {
        "MultiModelArbitrator": "libs.core.arbitrator",
        "AxiomRegistry": "libs.core.axioms",
        "ChaosTestingSuite": "libs.core.chaos",
        "EmergencyLevel": "libs.core.emergency",
        "RedButtonProtocol": "libs.core.emergency",
        "ETLSovereignArbiter": "libs.core.etl_arbiter",
        "ETLConstitutionalMonitor": "libs.core.etl_monitor",
        "ETLState": "libs.core.etl_state_machine_v45s",
        "ETLStateMachineV45S": "libs.core.etl_state_machine_v45s",
        "AgentCoordinationProtocol": "libs.core.proposals",
        "AgentRole": "libs.core.proposals",
        "ImprovementProposal": "libs.core.proposals",
        "som": "libs.core.som",
    }

    if name in lazy_modules:
        import importlib

        module = importlib.import_module(lazy_modules[name])
        return getattr(module, name)

    raise AttributeError(f"module 'libs.core' has no attribute '{name}'")


__all__ = [
    "get_db",
    "get_db_ctx",
    "settings",
]
