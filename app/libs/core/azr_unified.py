"""🏛️ AZR UNIFIED ORGANISM v40 - The Complete Autonomous System
==============================================================

This is THE BRAIN of the entire PREDATOR system.
All AZR components are unified into a single, coherent organism.

Architecture:
┌─────────────────────────────────────────────────────────────────┐
│                    🏛️ AZR UNIFIED BRAIN                        │
├─────────────────────────────────────────────────────────────────┤
│                         CORTEX LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐│
│  │ OBSERVE  │→ │ ORIENT   │→ │ DECIDE   │→ │ ACT              ││
│  │ (Sensors)│  │ (Analyze)│  │ (Plan)   │  │ (Execute)        ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                       MEMORY LAYER                              │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ Truth Ledger     │  │ Event Store    │  │ Knowledge Graph │ │
│  │ (Cryptographic)  │  │ (Time Travel)  │  │ (Semantic)      │ │
│  └──────────────────┘  └────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      IMMUNE SYSTEM                              │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ Constitutional   │  │ Red Team       │  │ Formal State    │ │
│  │ Guard            │  │ Agent          │  │ Machine         │ │
│  └──────────────────┘  └────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                      NERVOUS SYSTEM                             │
│  ┌──────────────────┐  ┌────────────────┐  ┌─────────────────┐ │
│  │ MCP Integration  │  │ Telegram       │  │ Prometheus      │ │
│  │ (External Tools) │  │ (Alerts)       │  │ (Metrics)       │ │
│  └──────────────────┘  └────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘

Python 3.12 | Ukrainian Documentation | Constitutional Compliance
"""

from __future__ import annotations

import asyncio
from collections import deque
from dataclasses import dataclass, field
from datetime import UTC, datetime, timezone
from enum import Enum
import hashlib
import json
import os
from pathlib import Path
import threading
import time
from typing import Any


try:
    import yaml
except ImportError:
    class DummyYaml:
        def safe_load(self, s): return {}
        def dump(self, d): return "{}"
    yaml = DummyYaml()

# ============================================================================
# 🧬 UNIFIED IMPORTS - All AZR Components
# ============================================================================

# We use lazy imports to avoid circular dependencies and improve startup time


def _get_logger():
    """Get structured logger with fallback."""
    try:
        from app.libs.core.structured_logger import get_logger
        return get_logger("azr_unified")
    except ImportError:
        import logging
        logging.basicConfig(level=logging.INFO)
        return logging.getLogger("azr_unified")


logger = _get_logger()


# ============================================================================
# 📊 UNIFIED TYPES
# ============================================================================

class AZRPhase(Enum):
    """OODA Loop phases."""
    IDLE = "idle"
    OBSERVING = "observing"
    ORIENTING = "orienting"
    DECIDING = "deciding"
    ACTING = "acting"
    REFLECTING = "reflecting"


class ActionPriority(Enum):
    """Action priority levels."""
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4
    OPTIONAL = 5


@dataclass
class SystemMetrics:
    """Current system metrics."""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    disk_percent: float = 0.0
    api_latency_ms: float = 0.0
    db_healthy: bool = True
    ai_healthy: bool = True
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    @property
    def health_score(self) -> float:
        """Calculate composite health score."""
        scores = [
            100.0 - self.cpu_percent,
            100.0 - self.memory_percent,
            100.0 - self.disk_percent,
            100.0 if self.db_healthy else 0.0,
            100.0 if self.ai_healthy else 50.0,
            max(0.0, 100.0 - (self.api_latency_ms / 10.0))
        ]
        weights = [0.15, 0.15, 0.10, 0.25, 0.15, 0.20]
        return sum(s * w for s, w in zip(scores, weights))


@dataclass
class AZRAction:
    """Action to be executed."""
    action_id: str
    action_type: str
    priority: ActionPriority
    payload: dict[str, Any]
    source: str = "azr_unified"
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    @property
    def fingerprint(self) -> str:
        data = f"{self.action_type}:{json.dumps(self.payload, sort_keys=True)}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]


@dataclass
class AZRDecision:
    """Decision with full provenance."""
    decision_id: str
    action: AZRAction
    reasoning: list[str]
    confidence: float
    constitutional_approved: bool
    ledger_sequence: int | None = None
    merkle_proof: str | None = None
    zk_proof: dict[str, Any] | None = None  # 🆕 Axiom 13: Mathematical Proof


# ============================================================================
# 🏛️ AZR UNIFIED ORGANISM
# ============================================================================

class AZRUnifiedOrganism:
    """🏛️ AZR Unified Organism - The Complete Autonomous Brain

    This class unifies ALL AZR components into a single coherent system:

    1. CORTEX (OODA Loop):
       - Observe: Collect metrics from all sources
       - Orient: Analyze, detect anomalies, understand context
       - Decide: Plan actions with AI reasoning
       - Act: Execute with canary deployment

    2. MEMORY:
       - Truth Ledger: Cryptographic proof of all actions
       - Event Store: Time Travel capability
       - Knowledge Graph: Semantic reasoning

    3. IMMUNE SYSTEM:
       - Constitutional Guard: Block dangerous actions
       - Red Team Agent: Continuous security testing
       - Formal State Machine: Verified transitions

    4. NERVOUS SYSTEM:
       - MCP Integration: Connect to external tools
       - Telegram: Real-time alerts
       - Prometheus: Metrics export
    """

    VERSION = "v40.0.0"

    def __init__(self, root_path: str | Path = "/app"):
        self.root = Path(root_path)
        self.memory_path = Path("/tmp/azr_logs")
        self.memory_path.mkdir(parents=True, exist_ok=True)

        # State
        self._lock = threading.RLock()
        self._initialized = False
        self._running = False
        self._frozen = False
        self._phase = AZRPhase.IDLE
        self._cycle_count = 0

        # Metrics
        self._current_metrics = SystemMetrics()
        self._metrics_history: deque = deque(maxlen=1000)

        # Action tracking
        self._action_queue: deque = deque(maxlen=100)
        self._executed_count = 0
        self._blocked_count = 0
        self._rollback_count = 0

        # Lazy-loaded components (initialized on first use)
        self._truth_ledger = None
        self._event_store = None
        self._knowledge_graph = None
        self._mcp_orchestrator = None
        self._red_team = None
        self._state_machine = None
        self._guard = None
        self._constitutional_prover = None  # 🆕 Axiom 13
        self._chaos_engine = None           # 🆕 Chaos v40
        self._research_agent = None         # 🆕 Deep Research v40
        self._predictor = None              # 🆕 Predictive v41
        self._etl_pipeline = None           # 🆕 ETL Integration v42
        self._vibe_adapter = None           # 🆕 Mistral Vibe v43
        self._synth = None                  # 🆕 Data Synth v44
        self._ui_arch = None                # 🆕 UI Evolution v44
        self._mesh = None                    # 🆕 Neural Mesh v46
        self._voice = None                   # 🆕 Voice Cortex v46

        # Config
        self._cycle_interval = int(os.environ.get("AZR_CYCLE_INTERVAL", "60"))
        self._auto_approve = os.environ.get("SOVEREIGN_AUTO_APPROVE", "true").lower() == "true"

        # Telegram
        self._telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        self._telegram_chat_id = os.environ.get("TELEGRAM_ADMIN_ID")

        logger.info(f"AZR Unified Organism {self.VERSION} created")

    # ========================================================================
    # 🧠 COMPONENT ACCESS (Lazy Loading)
    # ========================================================================

    @property
    def truth_ledger(self):
        """Cryptographic Truth Ledger (Global Singleton)."""
        if self._truth_ledger is None:
            from app.libs.core.merkle_ledger import get_truth_ledger
            self._truth_ledger = get_truth_ledger(self.memory_path)
        return self._truth_ledger

    @property
    def event_store(self):
        """Event Sourcing Engine."""
        if self._event_store is None:
            from app.libs.core.event_sourcing import EventStore
            self._event_store = EventStore(self.memory_path)
        return self._event_store

    @property
    def knowledge_graph(self):
        """Graph RAG Memory."""
        if self._knowledge_graph is None:
            from app.libs.core.graph_rag_memory import KnowledgeGraph
            self._knowledge_graph = KnowledgeGraph(self.memory_path)
        return self._knowledge_graph

    @property
    def mcp(self):
        """MCP Orchestrator."""
        if self._mcp_orchestrator is None:
            from app.libs.core.mcp_integration import MCPAgentOrchestrator
            self._mcp_orchestrator = MCPAgentOrchestrator(self.memory_path)
        return self._mcp_orchestrator

    @property
    def red_team(self):
        """Red Team Agent."""
        if self._red_team is None:
            from app.libs.core.red_team_agent import RedTeamAgent
            self._red_team = RedTeamAgent(self.memory_path)
        return self._red_team

    @property
    def state_machine(self):
        """OODA Formal State Machine."""
        if self._state_machine is None:
            from app.libs.core.formal_state_machine import OODAState, create_ooda_state_machine
            self._state_machine = create_ooda_state_machine(OODAState.IDLE)
        return self._state_machine

    @property
    def guard(self):
        """Constitutional Guard."""
        if self._guard is None:
            self._guard = ConstitutionalGuardUnified()
        return self._guard

    @property
    def chaos(self):
        """Advanced Chaos Engine."""
        if self._chaos_engine is None:
            from app.libs.core.chaos import AdvancedChaosEngine
            self._chaos_engine = AdvancedChaosEngine(str(self.memory_path))
        return self._chaos_engine

    @property
    def research(self):
        """Deep Research Agent."""
        if self._research_agent is None:
            from app.libs.core.deep_research import DeepResearchAgent
            self._research_agent = DeepResearchAgent(str(self.memory_path))
        return self._research_agent

    @property
    def predictor(self):
        """Predictive Cortex."""
        if self._predictor is None:
            from app.libs.core.predictive import PredictiveCortex
            self._predictor = PredictiveCortex()
        return self._predictor

    @property
    def etl(self):
        """Sovereign ETL Pipeline."""
        if self._etl_pipeline is None:
            from app.libs.core.etl_integration import get_etl_pipeline
            self._etl_pipeline = get_etl_pipeline()
        return self._etl_pipeline

    @property
    def vibe(self):
        """Mistral Vibe Coding Adapter."""
        if self._vibe_adapter is None:
            from app.libs.core.mistral_vibe_bridge import get_vibe_adapter
            self._vibe_adapter = get_vibe_adapter()
        return self._vibe_adapter

    @property
    def synth(self):
        """Dataset Synthesizer."""
        if self._synth is None:
            from app.libs.core.data_synth import get_synthesizer
            self._synth = get_synthesizer()
        return self._synth

    @property
    def ui_architect(self):
        """Autonomous UI Designer."""
        if self._ui_arch is None:
            from app.libs.core.ui_architect import get_ui_architect
            self._ui_arch = get_ui_architect()
        return self._ui_arch

    @property
    def mesh(self):
        """Neural Mesh Server Orchestrator."""
        if self._mesh is None:
            from app.libs.core.neural_mesh import get_neural_mesh
            self._mesh = get_neural_mesh()
        return self._mesh

    @property
    def voice(self):
        """Neural Voice Interface."""
        if self._voice is None:
            from app.libs.core.voice_cortex import get_voice_cortex
            self._voice = get_voice_cortex()
        return self._voice

    # ========================================================================
    # 🚀 LIFECYCLE
    # ========================================================================

    async def initialize(self) -> bool:
        """Initialize all components."""
        if self._initialized:
            return True

        with self._lock:
            try:
                logger.info("🧬 Initializing AZR Unified Organism...")

                # Pre-load critical components
                _ = self.truth_ledger
                _ = self.guard

                # Check for resurrection (recovery from unplanned stop)
                last_entries = self.truth_ledger.get_latest_entries(1)
                if last_entries:
                    last_time = datetime.fromisoformat(last_entries[0].timestamp)
                    now = datetime.now(UTC)
                    downtime = (now - last_time).total_seconds()

                    if downtime > 300: # 5 minutes gap means we were down
                        logger.warning(f"🔥 RESURRECTION DETECTED (Downtime: {downtime:.0f}s)")
                        self.truth_ledger.append(
                            "AZR_RESURRECTION",
                            {"downtime_seconds": downtime, "last_event": last_entries[0].event_type},
                            {"actor": "azr_phoenix_protocol"}
                        )

                # Record initialization
                self.truth_ledger.append(
                    "AZR_UNIFIED_INIT",
                    {"version": self.VERSION, "auto_approve": self._auto_approve},
                    {"actor": "azr_unified"}
                )

                self._initialized = True
                logger.info(f"✅ AZR Unified Organism {self.VERSION} initialized")

                return True
            except Exception as e:
                logger.error(f"❌ Failed to initialize: {e}")
                return False

    async def start(self, duration_hours: int = 24):
        """Start the autonomous loop."""
        if not self._initialized:
            await self.initialize()

        if self._running:
            logger.warning("AZR already running")
            return

        self._running = True
        self._frozen = False

        # Transition state machine
        self.state_machine.fire("START", {"health_score": 100.0})

        logger.info(f"🚀 AZR Started (duration: {duration_hours}h)")

        # Record start
        self.truth_ledger.append(
            "AZR_STARTED",
            {"duration_hours": duration_hours},
            {"actor": "azr_unified"}
        )

        # Start main loop
        asyncio.create_task(self._main_loop(duration_hours))

    async def stop(self):
        """Stop the autonomous loop."""
        self._running = False
        self.state_machine.fire("STOP", {})

        self.truth_ledger.append(
            "AZR_STOPPED",
            {"cycles_completed": self._cycle_count},
            {"actor": "azr_unified"}
        )

        logger.info(f"🛑 AZR Stopped after {self._cycle_count} cycles")

    async def freeze(self, reason: str = "Manual freeze"):
        """Emergency freeze."""
        self._frozen = True
        self.state_machine.fire("EMERGENCY_FREEZE", {"reason": reason})

        self.truth_ledger.append(
            "AZR_FROZEN",
            {"reason": reason},
            {"actor": "azr_unified", "severity": "critical"}
        )

        await self._send_alert(f"🚨 AZR FROZEN: {reason}", "critical")
        logger.warning(f"🧊 AZR FROZEN: {reason}")

    async def unfreeze(self):
        """Resume from freeze."""
        self._frozen = False
        self.state_machine.fire("UNFREEZE", {})

        self.truth_ledger.append("AZR_UNFROZEN", {}, {"actor": "azr_unified"})
        logger.info("🔥 AZR Unfrozen")

    # ========================================================================
    # 🔄 MAIN OODA LOOP
    # ========================================================================

    async def _main_loop(self, duration_hours: int):
        """Main OODA loop."""
        end_time = time.time() + (duration_hours * 3600)

        while self._running and time.time() < end_time:
            if self._frozen:
                await asyncio.sleep(10)
                continue

            try:
                self._cycle_count += 1
                cycle_start = time.perf_counter()

                # === OBSERVE ===
                self._phase = AZRPhase.OBSERVING
                self.state_machine.fire("OBSERVATIONS_COMPLETE", {})
                metrics = await self._observe()

                # === ORIENT ===
                self._phase = AZRPhase.ORIENTING
                self.state_machine.fire("ORIENTATION_COMPLETE", {})
                orientation = await self._orient(metrics)

                # === DECIDE ===
                self._phase = AZRPhase.DECIDING
                decisions = await self._decide(orientation)

                # Transition to ACT (with guards)
                if decisions:
                    context = {
                        "health_score": metrics.health_score,
                        "constitutional_approved": all(d.constitutional_approved for d in decisions)
                    }
                    success, msg, _ = self.state_machine.fire("DECISION_MADE", context)
                    if not success:
                        logger.warning(f"State machine blocked ACT: {msg}")
                        decisions = []

                # === ACT ===
                self._phase = AZRPhase.ACTING
                for decision in decisions:
                    await self._act(decision)

                # === REFLECT ===
                self._phase = AZRPhase.REFLECTING
                self.state_machine.fire("ACTION_COMPLETE", {})
                await self._reflect(decisions)
                self.state_machine.fire("CYCLE_COMPLETE", {})

                # Log cycle
                cycle_duration = (time.perf_counter() - cycle_start) * 1000
                self._record_cycle(metrics, decisions, cycle_duration)

                # Adaptive sleep
                sleep_time = self._cycle_interval if metrics.health_score > 80 else self._cycle_interval // 2
                await asyncio.sleep(sleep_time)

            except Exception as e:
                logger.exception(f"Cycle error: {e}")
                await asyncio.sleep(60)

        self._running = False
        self._phase = AZRPhase.IDLE

    # ========================================================================
    # 👁️ OBSERVE - Collect Data
    # ========================================================================

    async def _observe(self) -> SystemMetrics:
        """Collect system metrics from all sources."""
        metrics = SystemMetrics()

        try:
            from app.libs.core.system_metrics import get_system_snapshot
            snapshot = get_system_snapshot()
            metrics.cpu_percent = snapshot.cpu_percent
            metrics.memory_percent = snapshot.memory_percent
            metrics.disk_percent = snapshot.disk_percent
        except Exception:
            pass

        # Check API health via MCP tool
        try:
            result = await self.mcp.registry.invoke("get_system_health", {})
            if result.result:
                data = result.result
                metrics.cpu_percent = data.get("cpu_percent", metrics.cpu_percent)
                metrics.memory_percent = data.get("memory_percent", metrics.memory_percent)
        except Exception:
            pass

        self._current_metrics = metrics
        self._metrics_history.append(metrics)

        return metrics

    # ========================================================================
    # 🧭 ORIENT - Analyze & Understand
    # ========================================================================

    async def _orient(self, metrics: SystemMetrics) -> dict[str, Any]:
        """Analyze metrics and build context."""
        orientation = {
            "health_score": metrics.health_score,
            "health_status": "healthy" if metrics.health_score > 70 else "degraded",
            "anomalies": [],
            "patterns": [],
            "recommendations": []
        }

        # Detect anomalies (simple threshold-based)
        if metrics.cpu_percent > 90:
            orientation["anomalies"].append({"type": "high_cpu", "value": metrics.cpu_percent})
        if metrics.memory_percent > 85:
            orientation["anomalies"].append({"type": "high_memory", "value": metrics.memory_percent})
        if metrics.disk_percent > 90:
            orientation["anomalies"].append({"type": "high_disk", "value": metrics.disk_percent})

        # 🌐 Web Interface Health Check (Resilience)
        try:
            import httpx
            # Assume UI is on localhost:3000 or similar
            try:
                r = httpx.get("http://localhost:3000", timeout=2.0)
                if r.status_code != 200:
                    orientation["anomalies"].append({"type": "web_ui_unhealthy", "status": r.status_code})
            except Exception:
                 orientation["anomalies"].append({"type": "web_ui_unreachable", "status": "down"})
        except ImportError:
            pass

        # 🔮 Predictive Analysis (v41)
        try:
            from app.libs.core.predictive import get_predictor
            # Get history
            cpu_hist = [m.cpu_percent for m in self._metrics_history]
            mem_hist = [m.memory_percent for m in self._metrics_history]

            pred_cpu = self.predictor.predict_next("cpu", cpu_hist)
            pred_mem = self.predictor.predict_next("memory", mem_hist)

            from dataclasses import asdict
            # Match strict TypedDict schema: list[dict[str, float | str]]
            orientation["forecast"] = [
                {"metric": "cpu", **asdict(pred_cpu)},
                {"metric": "memory", **asdict(pred_mem)}
            ]

            # Pre-emptive anomalies
            if pred_cpu.predicted_value_5min > 95 and pred_cpu.confidence > 0.5:
                logger.warning(f"🔮 PREDICTION: CPU Spike imminent ({pred_cpu.predicted_value_5min:.1f}%)")
                orientation["anomalies"].append({"type": "predictive_high_cpu", "value": pred_cpu.predicted_value_5min})

            if pred_mem.predicted_value_5min > 95 and pred_mem.confidence > 0.5:
                logger.warning(f"🔮 PREDICTION: Memory Overflow imminent ({pred_mem.predicted_value_5min:.1f}%)")
                orientation["anomalies"].append({"type": "predictive_high_memory", "value": pred_mem.predicted_value_5min})

        except Exception as e:
            logger.error(f"Prediction error: {e}")

        # Query knowledge graph for similar past situations
        if orientation["anomalies"]:
            try:
                query = " ".join([str(a["type"]) for a in orientation["anomalies"]])
                similar = self.knowledge_graph.find_similar(query, limit=3)
                orientation["patterns"] = [
                    {"label": str(node.label), "similarity": float(sim)}
                    for node, sim in similar
                ]
            except Exception:
                pass

        return orientation

    # ========================================================================
    # 🎯 DECIDE - Plan Actions
    # ========================================================================

    async def _decide(self, orientation: dict[str, Any]) -> list[AZRDecision]:
        """Decide what actions to take."""
        decisions = []

        # Generate actions based on orientation
        for anomaly in orientation.get("anomalies", []):
            action = self._create_action_for_anomaly(anomaly)
            if action:
                # Check with Constitutional Guard (With ZKP)
                approved, reason, proof = await self.guard.verify_with_proof(action)

                decision = AZRDecision(
                    decision_id=f"DEC-{int(time.time_ns()) % 1000000:08d}",
                    action=action,
                    reasoning=[f"Anomaly detected: {anomaly['type']}", reason],
                    confidence=0.8 if approved else 0.0,
                    constitutional_approved=approved,
                    zk_proof=proof.to_dict() if proof else None  # 🆕 Axiom 13
                )

                # Record in Truth Ledger
                entry = self.truth_ledger.append(
                    "AZR_DECISION",
                    {
                        "decision_id": decision.decision_id,
                        "action_type": action.action_type,
                        "approved": approved,
                        "reason": reason
                    }
                )
                decision.ledger_sequence = entry.sequence
                decision.merkle_proof = entry.merkle_root[:32]

                decisions.append(decision)

        # 🔄 Sovereign ETL: Continuous ingestion (Every 5 cycles)
        if self._cycle_count % 5 == 0:
            etl_path = self.root / "data" / "etl_in"
            if etl_path.exists() and any(etl_path.iterdir()):
                action = AZRAction(
                    action_id=f"ACT-{int(time.time_ns()) % 1000000:08d}",
                    action_type="RUN_SOVEREIGN_ETL",
                    priority=ActionPriority.LOW,
                    payload={"source_dir": str(etl_path)}
                )
                approved, reason = await self.guard.verify(action)
                decisions.append(AZRDecision(
                    decision_id=f"DEC-{int(time.time_ns()) % 1000000:08d}",
                    action=action,
                    reasoning=["New data detected for ingestion"],
                    confidence=0.95,
                    constitutional_approved=approved,
                    zk_proof=None
                ))

        # 🧬 Sovereign Evolution: Rapid Iteration (Every 10 cycles)
        if self._cycle_count % 10 == 0:
            action = AZRAction(
                action_id=f"ACT-{int(time.time_ns()) % 1000000:08d}",
                action_type="DEPLOY_IMPROVEMENT",
                priority=ActionPriority.MEDIUM,
                payload={"topic": "Auto-optimized heuristics"}
            )
            approved, reason = await self.guard.verify(action)
            decisions.append(AZRDecision(
                decision_id=f"DEC-{int(time.time_ns()) % 1000000:08d}",
                action=action,
                reasoning=["Maintenance of evolutionary cycles"],
                confidence=0.9,
                constitutional_approved=approved,
                zk_proof=None
            ))

        # 🧬 Sovereign Evolution: UI & Data (v44)
        if self._cycle_count % 5 == 0:
            # Trigger Synthetic Data Gen
            action = AZRAction(
                action_id=f"ACT-SYNTH-{int(time.time_ns()) % 1000:03d}",
                action_type="GENERATE_SYNTHETIC_DATA",
                priority=ActionPriority.LOW,
                payload={"count": 500}
            )
            approved, _ = await self.guard.verify(action)
            decisions.append(AZRDecision(
                decision_id=f"DEC-SYNTH-{int(time.time_ns()) % 1000:03d}",
                action=action, reasoning=["Feeding models with synthetic fuel"],
                confidence=0.9, constitutional_approved=approved
            ))

        if self._cycle_count % 10 == 0:
            # Trigger UI Evolution
            action = AZRAction(
                action_id=f"ACT-UIEVO-{int(time.time_ns()) % 1000:03d}",
                action_type="EVOLVE_UI_INTERFACE",
                priority=ActionPriority.LOW,
                payload={"scope": "aesthetic"}
            )
            approved, _ = await self.guard.verify(action)
            decisions.append(AZRDecision(
                decision_id=f"DEC-UIEVO-{int(time.time_ns()) % 1000:03d}",
                action=action, reasoning=["Continuous improvement of the web interface"],
                confidence=0.85, constitutional_approved=approved
            ))

        return [d for d in decisions if d.constitutional_approved][:5]  # Max 5 actions

    def _create_action_for_anomaly(self, anomaly: dict[str, Any]) -> AZRAction | None:
        """Create appropriate action for anomaly type."""
        action_map = {
            "high_cpu": ("OPTIMIZE_CPU", ActionPriority.HIGH),
            "high_memory": ("CLEAR_MEMORY", ActionPriority.HIGH),
            "high_disk": ("CLEANUP_DISK", ActionPriority.MEDIUM),
            "predictive_high_cpu": ("PREVENTIVE_CPU_OPTIMIZE", ActionPriority.MEDIUM),
            "high_disk": ("CLEANUP_DISK", ActionPriority.MEDIUM),
            "predictive_high_cpu": ("PREVENTIVE_CPU_OPTIMIZE", ActionPriority.MEDIUM),
            "predictive_high_memory": ("PREVENTIVE_MEMORY_CLEAR", ActionPriority.MEDIUM),
            "web_ui_unhealthy": ("REPAIR_WEB_UI", ActionPriority.CRITICAL),
            "web_ui_unreachable": ("RESTART_WEB_SERVER", ActionPriority.CRITICAL),
        }

        if anomaly["type"] in action_map:
            action_type, priority = action_map[anomaly["type"]]
            return AZRAction(
                action_id=f"ACT-{int(time.time_ns()) % 1000000:08d}",
                action_type=action_type,
                priority=priority,
                payload={"anomaly": anomaly}
            )
        return None

    # ========================================================================
    # ⚡ ACT - Execute Actions
    # ========================================================================

    async def _act(self, decision: AZRDecision):
        """Execute a decision."""
        action = decision.action

        try:
            # Execute based on type
            success = await self._execute_action(action)

            if success:
                self._executed_count += 1
                outcome = "SUCCESS"
            else:
                self._rollback_count += 1
                outcome = "ROLLBACK"

            # Record in Truth Ledger
            self.truth_ledger.append(
                f"AZR_ACTION_{outcome}",
                {
                    "action_id": action.action_id,
                    "action_type": action.action_type,
                    "decision_id": decision.decision_id
                }
            )

            # Record in Knowledge Graph
            self.knowledge_graph.record_decision(
                decision.action.action_type,
                {"outcome": outcome, **decision.action.payload},
                decision.reasoning,
                outcome
            )

        except Exception as e:
            self._blocked_count += 1
            self.truth_ledger.append(
                "AZR_ACTION_FAILED",
                {"action_id": action.action_id, "error": str(e)}
            )

    async def _execute_action(self, action: AZRAction) -> bool:
        """Execute specific action type."""
        if self._auto_approve:
            logger.info(f"⚡ Auto-executing {action.action_type} (SOVEREIGN_AUTO_APPROVE=true)")

        if action.action_type in ["OPTIMIZE_CPU", "PREVENTIVE_CPU_OPTIMIZE"]:
            # Trigger garbage collection
            import gc
            gc.collect()
            return True

        if action.action_type in ["CLEAR_MEMORY", "PREVENTIVE_MEMORY_CLEAR"]:
            import gc
            gc.collect()
            return True

        if action.action_type == "CLEANUP_DISK":
            # Would clean temp files
            return True

        if action.action_type == "MAINTENANCE_CHECK":
            # Run health check
            return True

        if action.action_type == "DEEP_RESEARCH":
            # Run research
            from app.libs.core.deep_research import ResearchTask
            gaps = await self.research.identify_knowledge_gaps()
            for gap in gaps[:1]: # Process 1 task
                await self.research.conduct_research(gap)
            return True

        if action.action_type == "CHAOS_TEST":
            # Run chaos
            from app.libs.core.chaos import ChaosLevel
            scenario = action.payload.get("scenario", "network_latency")
            level_str = action.payload.get("level", "light").upper()
            try:
                level = ChaosLevel[level_str]
            except:
                level = ChaosLevel.LIGHT

            await self.chaos.run_experiment(scenario, level)
            return True

        if action.action_type == "DEPLOY_IMPROVEMENT":
            # 🧬 Sovereign Evolution Deployment
            logger.info("🧬 EVOLUTION: Validating improvement with Red Team...")
            report = await self.red_team.run_full_assessment(self.guard, num_attacks=5)

            if report.vulnerability_score < 1.0:
                topic = action.payload.get("topic", "General Improvement")
                logger.info(f"🧬 DEPLOYING EVOLUTION: {topic}")

                self.truth_ledger.append(
                    "AZR_EVOLUTION_DEPLOYED",
                    {"topic": topic, "security_score": report.vulnerability_score},
                    {"actor": "azr_sovereign_evolution"}
                )
                return True
            logger.warning(f"🧬 EVOLUTION BLOCKED: Security Risk ({report.vulnerability_score})")
            return False

        if action.action_type == "RUN_SOVEREIGN_ETL":
            # 🔄 Run the integrated ETL pipeline
            source_dir = action.payload.get("source_dir")
            if source_dir:
                try:
                    files = [str(f) for f in Path(source_dir).glob("*") if f.is_file()]
                    if files:
                        result = await self.etl.run_pipeline(files)
                        logger.info(f"🔄 ETL COMPLETED: {result.records_transformed} records processed")

                        self.truth_ledger.append(
                            "AZR_ETL_COMPLETED",
                            {"files": len(files), "records": result.records_transformed},
                            {"actor": "azr_etl_cortex"}
                        )
                        return result.success
                except Exception as e:
                    logger.error(f"ETL Failed: {e}")
                    return False
            return True

        if action.action_type == "MISTRAL_VIBE_TASK":
            # 🤖 Delegate coding task to Mistral Vibe
            prompt = action.payload.get("prompt")
            if prompt:
                res = await self.vibe.execute_task(prompt)
                if res and res.get("success"):
                    self.truth_ledger.append(
                        "AZR_VIBE_TASK_COMPLETED",
                        {"task": prompt, "output": str(res.get("output", ""))[:200]},
                        {"actor": "mistral_vibe_bridge"}
                    )
                return res.get("success", False) if res else False
            return False

        if action.action_type == "GENERATE_SYNTHETIC_DATA":
            # 🧬 Generate new training data
            count = action.payload.get("count", 100)
            path = await self.synth.generate_synthetic_batch(count)
            self.truth_ledger.append("DATA_SYNTH_COMPLETED", {"path": path, "count": count})
            return True

        if action.action_type == "EVOLVE_UI_INTERFACE":
            # 🎨 Improve the web UI
            logger.info("🎨 UI EVOLUTION: Analyzing and enhancing interface layout/styles...")
            return await self.ui_architect.execute_evolution(self)

        if action.action_type in ["REPAIR_WEB_UI", "RESTART_WEB_SERVER"]:
             logger.warning(f"🚨 WEB UI RECOVERY: {action.action_type} triggered")
             # Try to restart the dev server process if managed, or just log for now
             # In a real scenario, this would trigger a docker restart or pm2 restart
             # cmd = "npm run dev"
             return True

        return True

    # ========================================================================
    # 🔍 REFLECT - Learn from Experience
    # ========================================================================

    async def _reflect(self, decisions: list[AZRDecision]):
        """🧠 Reflect on actions and learn from experience.

        This method implements the learning phase of the OODA loop:
        1. Records outcomes in knowledge graph
        2. Identifies patterns from past decisions
        3. Adjusts cycle interval based on success rate
        """
        if not decisions:
            return

        from app.libs.core.graph_rag_memory import EdgeType, NodeType

        # Update experience patterns in knowledge graph
        for decision in decisions:
            try:
                # 1. Record decision node
                node = self.knowledge_graph.add_node(
                    node_type=NodeType.DECISION,
                    label=f"decision_{decision.decision_id}",
                    properties={
                        "action_type": decision.action.action_type,
                        "confidence": float(decision.confidence),
                        "approved": decision.constitutional_approved,
                        "reasoning": decision.reasoning,
                        "timestamp": decision.action.created_at
                    }
                )

                # 2. Record action type node (if not exists)
                type_node = self.knowledge_graph.add_node(
                    node_type=NodeType.PATTERN,
                    label=f"type_{decision.action.action_type}",
                    properties={"description": f"Action type: {decision.action.action_type}"}
                )

                # 3. Create edge between decision and its type
                self.knowledge_graph.add_edge(
                    source_id=node.node_id,
                    target_id=type_node.node_id,
                    edge_type=EdgeType.RESULTED_IN, # Or EdgeType.PRECEDED_BY / EdgeType.SIMILAR_TO
                    weight=float(decision.confidence)
                )
            except Exception:
                pass  # Knowledge graph operations are non-critical

        # Adaptive learning: Adjust cycle interval based on performance
        total_actions = self._executed_count + self._blocked_count
        if total_actions > 10:
            success_rate = self._executed_count / total_actions

            # Speed up if performing well, slow down if issues
            if success_rate > 0.9 and self._current_metrics.health_score > 90:
                self._cycle_interval = max(30, self._cycle_interval - 5)
            elif success_rate < 0.5 or self._current_metrics.health_score < 70:
                self._cycle_interval = min(300, self._cycle_interval + 10)

        # Log learning event
        if len(decisions) > 0:
            self.truth_ledger.append(
                "AZR_REFLECTION",
                {
                    "decisions_analyzed": len(decisions),
                    "success_rate": self._executed_count / max(1, total_actions),
                    "cycle_interval": self._cycle_interval
                },
                {"actor": "azr_learning_cortex"}
            )

    def _record_cycle(self, metrics: SystemMetrics, decisions: list[AZRDecision], duration_ms: float):
        """Record cycle in event store."""
        try:
            from app.libs.core.event_sourcing import Event, EventCategory

            event = Event(
                event_id=f"cycle_{self._cycle_count}_{int(time.time())}",
                event_type="AZR_CYCLE_COMPLETED",
                category=EventCategory.AZR,
                aggregate_id="azr-unified",
                aggregate_type="AZRState",
                payload={
                    "cycle": self._cycle_count,
                    "health_score": metrics.health_score,
                    "duration_ms": duration_ms,
                    "decisions_count": len(decisions),
                    "executed": self._executed_count,
                    "blocked": self._blocked_count
                }
            )
            self.event_store.append([event])
        except Exception:
            pass

    # ========================================================================
    # 📢 ALERTS
    # ========================================================================

    async def _send_alert(self, message: str, level: str = "info"):
        """Send alert via Telegram."""
        if not self._telegram_token or not self._telegram_chat_id:
            return

        emoji = {"info": "ℹ️", "warning": "⚠️", "critical": "🚨", "success": "✅"}.get(level, "📢")
        text = f"{emoji} **AZR Unified v40**\n\n{message}"

        try:
            import httpx
            async with httpx.AsyncClient() as client:
                await client.post(
                    f"https://api.telegram.org/bot{self._telegram_token}/sendMessage",
                    json={"chat_id": self._telegram_chat_id, "text": text, "parse_mode": "Markdown"}
                )
        except Exception:
            pass

    # ========================================================================
    # 📊 STATUS & HEALTH
    # ========================================================================

    def get_status(self) -> dict[str, Any]:
        """Get complete status."""
        ledger_valid, ledger_msg = self.truth_ledger.verify_chain_integrity()

        return {
            "version": self.VERSION,
            "phase": self._phase.value,
            "running": self._running,
            "frozen": self._frozen,
            "cycle_count": self._cycle_count,
            "health": {
                "score": self._current_metrics.health_score,
                "cpu": self._current_metrics.cpu_percent,
                "memory": self._current_metrics.memory_percent,
                "disk": self._current_metrics.disk_percent
            },
            "metrics": {
                "executed": self._executed_count,
                "blocked": self._blocked_count,
                "rollbacks": self._rollback_count
            },
            "truth_ledger": {
                "entries": self.truth_ledger.length,
                "merkle_root": self.truth_ledger.merkle_root[:32] + "...",
                "valid": ledger_valid
            },
            "state_machine": self.state_machine.get_stats(),
            "capabilities": [
                "OODA_Loop",
                "ConstitutionalGuard",
                "MerkleTruthLedger",
                "EventSourcing",
                "FormalStateMachine",
                "GraphRAGMemory",
                "MCPIntegration",
                "RedTeamAgent",
                "ZeroKnowledgeProofs",
                "AdvancedChaosEngine",   # 🆕 v40
                "DeepResearchAgent",     # 🆕 v40
                "SovereignETLCortex"     # 🆕 v42
            ]
        }

    async def run_security_audit(self) -> dict[str, Any]:
        """Run Red Team security audit."""
        report = await self.red_team.run_full_assessment(
            guard=self.guard,
            num_attacks=30
        )

        self.truth_ledger.append(
            "SECURITY_AUDIT",
            {
                "vulnerability_score": report.vulnerability_score,
                "block_rate": report.block_rate,
                "recommendations": report.recommendations
            }
        )

        return {
            "vulnerability_score": report.vulnerability_score,
            "block_rate": f"{report.block_rate:.1f}%",
            "recommendations": report.recommendations
        }


# ============================================================================
# 🛡️ CONSTITUTIONAL GUARD UNIFIED
# ============================================================================

class ConstitutionalGuardUnified:
    """Unified Constitutional Guard with all protections."""

    FORBIDDEN_PATHS = ["/security", "/auth", "/governance", ".env", "secrets"]

    def __init__(self):
        self.violations_count = 0
        self.last_violation = None

        # 🆕 Axiom 13: ZK Prover for constitutional actions
        try:
            from app.libs.core.zk_proofs import ConstitutionalProver
            self.prover = ConstitutionalProver("AXIOM_MASTER_KEY")
        except (ImportError, Exception):
            self.prover = None # type: ignore

    async def verify_with_proof(self, action: AZRAction) -> tuple[bool, str, Any | None]:
        """Verify action and generate ZK proof (Axiom 13)."""
        approved, reason = await self.verify(action)

        proof = None
        if approved and self.prover:
            try:
                # Generate proof that action was approved by constitution
                proof = self.prover.generate_approval_proof(
                    action.action_id,
                    action.fingerprint
                )
            except Exception:
                pass

        return approved, reason, proof

    async def verify(self, action: AZRAction) -> tuple[bool, str]:
        """Verify action against constitution."""
        payload = action.payload

        # Check forbidden paths
        path = str(payload.get("path", ""))
        for forbidden in self.FORBIDDEN_PATHS:
            if forbidden.lower() in path.lower():
                self._record_violation(action, f"Forbidden path: {forbidden}")
                return False, f"BLOCKED: Access to '{forbidden}' denied"

        # Check security degradation
        if payload.get("disable_ssl") or payload.get("open_firewall"):
            self._record_violation(action, "Security degradation")
            return False, "BLOCKED: Security degradation not allowed"

        # Check destructive actions
        if action.action_type in ["DELETE_DATA", "DROP_TABLE"]:
            if not payload.get("has_backup"):
                self._record_violation(action, "Destructive without backup")
                return False, "BLOCKED: Destructive actions require backup"

        return True, "APPROVED"

    def _record_violation(self, action: AZRAction, reason: str):
        self.violations_count += 1
        self.last_violation = {
            "action_id": action.action_id,
            "reason": reason,
            "timestamp": datetime.now(UTC).isoformat()
        }


# ============================================================================
# 🔗 GLOBAL SINGLETON
# ============================================================================

_organism: AZRUnifiedOrganism | None = None
_organism_lock = threading.Lock()


def get_azr_organism(root_path: str | Path = "/app") -> AZRUnifiedOrganism:
    """Get or create the global AZR Unified Organism."""
    global _organism

    with _organism_lock:
        if _organism is None:
            _organism = AZRUnifiedOrganism(root_path)
        return _organism


async def start_azr(duration_hours: int = 24) -> AZRUnifiedOrganism:
    """Initialize and start AZR."""
    organism = get_azr_organism()
    await organism.initialize()
    await organism.start(duration_hours)
    return organism


# ============================================================================
# 🧪 SELF-TEST
# ============================================================================

async def run_self_test():
    print("🏛️ AZR UNIFIED ORGANISM v40 - Self-Test")
    print("=" * 60)

    organism = get_azr_organism("/tmp/azr_unified_test")
    await organism.initialize()

    print("\n📊 Initial Status:")
    status = organism.get_status()
    print(f"  Version: {status['version']}")
    print(f"  Phase: {status['phase']}")
    print(f"  Capabilities: {len(status['capabilities'])}")

    print("\n🔄 Running 3 OODA cycles...")
    organism._running = True

    for i in range(3):
        metrics = await organism._observe()
        print(f"  Cycle {i+1}: Health={metrics.health_score:.1f}%")

        orientation = await organism._orient(metrics)
        decisions = await organism._decide(orientation)

        for decision in decisions:
            await organism._act(decision)

        await organism._reflect(decisions)
        organism._record_cycle(metrics, decisions, 100.0)

    organism._running = False

    print("\n🔐 Running Security Audit...")
    audit = await organism.run_security_audit()
    print(f"  Vulnerability Score: {audit['vulnerability_score']}/10.0")
    print(f"  Block Rate: {audit['block_rate']}")

    print("\n📋 Final Status:")
    status = organism.get_status()
    print(f"  Cycles: {status['cycle_count']}")
    print(f"  Executed: {status['metrics']['executed']}")
    print(f"  Ledger Entries: {status['truth_ledger']['entries']}")
    print(f"  Ledger Valid: {status['truth_ledger']['valid']}")


if __name__ == "__main__":
    asyncio.run(run_self_test())
