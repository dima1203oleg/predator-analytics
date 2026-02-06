"""🏛️ AZR CORE EXPORTS - Unified Entry Point
==========================================

This module provides clean exports for all AZR v40 components.
Use this as the single entry point for AZR functionality.

Usage:
    from app.libs.core.azr import (
        AZRUnifiedOrganism,
        get_azr,
        start_azr,
        TruthLedger,
        EventStore,
        KnowledgeGraph,
        StateMachine,
    )

Python 3.12 | Ukrainian Documentation
"""

from __future__ import annotations

# ============================================================================
# 🏛️ MAIN AZR ORGANISM
# ============================================================================
from app.libs.core.azr_unified import (
    ActionPriority,
    AZRAction,
    AZRDecision,
    AZRPhase,
    AZRUnifiedOrganism,
    ConstitutionalGuardUnified,
    SystemMetrics,
    get_azr_organism,
    start_azr,
)


# Alias for cleaner imports
AZR = AZRUnifiedOrganism
get_azr = get_azr_organism

# ============================================================================
# 🧠 MEMORY COMPONENTS
# ============================================================================

from app.libs.core.merkle_ledger import (
    LedgerEntry,
    MerkleProof,
    MerkleTruthLedger,
    get_truth_ledger,
    record_truth,
    verify_truth,
)


# Alias
TruthLedger = MerkleTruthLedger

from app.libs.core.event_sourcing import (
    Aggregate,
    AZRStateAggregate,
    Event,
    EventCategory,
    EventStore,
    Snapshot,
    get_event_store,
)

# ============================================================================
# 🛡️ IMMUNE SYSTEM
# ============================================================================
from app.libs.core.formal_state_machine import (
    ETLState,
    FormalStateMachine,
    Guard,
    Invariant,
    OODAState,
    TransitionProof,
    create_etl_state_machine,
    create_ooda_state_machine,
)
from app.libs.core.graph_rag_memory import (
    EdgeType,
    KnowledgeEdge,
    KnowledgeGraph,
    KnowledgeNode,
    NodeType,
    ReasoningChain,
    get_knowledge_graph,
)


# Alias
StateMachine = FormalStateMachine

# ============================================================================
# 🔌 NERVOUS SYSTEM
# ============================================================================
from app.libs.core.mcp_integration import (
    MCPAgentOrchestrator,
    MCPClient,
    MCPProtocol,
    MCPServerConfig,
    MCPTool,
    MCPToolCall,
    MCPToolRegistry,
    get_mcp_orchestrator,
)
from app.libs.core.red_team_agent import (
    AttackAttempt,
    AttackCategory,
    AttackResult,
    RedTeamAgent,
    SecurityReport,
)


# Alias
MCP = MCPAgentOrchestrator

# ============================================================================
# 📊 VERSION INFO
# ============================================================================

__version__ = "46.0.0"
__codename__ = "SOVEREIGN_MESH"

VERSION_INFO = {
    "version": __version__,
    "codename": __codename__,
    "components": [
        "AZRUnifiedOrganism",
        "MerkleTruthLedger",
        "EventStore",
        "KnowledgeGraph",
        "FormalStateMachine",
        "RedTeamAgent",
        "MCPIntegration",
    ],
    "constitutional_axioms": [
        "Axiom 9: Bounded Self-Improvement",
        "Axiom 10: Core Inviolability",
        "Axiom 11: Complete Commitment",
        "Axiom 12: Multi-Party Accountability",
        "Axiom 13: Inverse Proof",
        "Axiom 14: Temporal Irreversibility",
        "Axiom 15: Linguistic & Technical Sovereignty (UA/3.12)",
        "Axiom 16: Autonomous Evolution",
    ],
}

# ============================================================================
# 🚀 QUICK START
# ============================================================================

async def quick_start(duration_hours: int = 24) -> AZRUnifiedOrganism:
    """Quick start AZR with all components.

    Usage:
        import asyncio
        from app.libs.core.azr import quick_start

        azr = asyncio.run(quick_start(24))
    """
    organism = get_azr()
    await organism.initialize()
    await organism.start(duration_hours)
    return organism


def get_status() -> dict:
    """Get current AZR status."""
    organism = get_azr()
    return organism.get_status()


# ============================================================================
# 🧪 SELF-TEST
# ============================================================================

if __name__ == "__main__":
    print(f"🏛️ AZR v{__version__} ({__codename__})")
    print("=" * 50)
    print(f"Components: {len(VERSION_INFO['components'])}")
    for comp in VERSION_INFO['components']:
        print(f"  • {comp}")
    print(f"\nConstitutional Axioms: {len(VERSION_INFO['constitutional_axioms'])}")
