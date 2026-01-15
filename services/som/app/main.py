"""
═══════════════════════════════════════════════════════════════
SOVEREIGN OBSERVER MODULE (SOM) - Core Service
Predator Analytics v29-S

Конституційний гіпервізор для безперервного вдосконалення системи
з повною підтримкою Constitutional Axioms та Truth Ledger.
═══════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
import logging
import asyncio
import uuid
import os

# v29-S Constitutional Core imports
try:
    from .core.axioms import constitutional_axioms, AxiomViolation, CriticalActionType
    from .core.truth_ledger import truth_ledger, ActionType, LedgerEntry
    CONSTITUTIONAL_CORE_AVAILABLE = True
except ImportError:
    CONSTITUTIONAL_CORE_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("som")

# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class RingLevel(str, Enum):
    INNER = "inner"       # Автоматичні не-критичні дії
    MIDDLE = "middle"     # Потребує Arbiter Court
    OUTER = "outer"       # Потребує людського затвердження

class AnomalySeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    HIGH = "high"
    CRITICAL = "critical"

class ProposalStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    SIMULATING = "simulating"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    COMPLETED = "completed"
    ROLLED_BACK = "rolled_back"

class EmergencyLevel(int, Enum):
    PAUSE = 1      # Призупинити SOM
    ISOLATE = 2    # Ізолювати від production
    SHUTDOWN = 3   # Повне вимкнення

# ═══════════════════════════════════════════════════════════════
# REQUEST/RESPONSE MODELS
# ═══════════════════════════════════════════════════════════════

class ComponentHealth(BaseModel):
    component_id: str
    name: str
    status: str
    metrics: Dict[str, float] = {}
    last_updated: datetime

class Anomaly(BaseModel):
    id: str
    type: str
    component_id: str
    severity: AnomalySeverity
    description: str
    detected_at: datetime
    metrics: Dict[str, Any] = {}
    suggested_action: Optional[str] = None
    auto_remediation_eligible: bool = False

class ImprovementProposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    ring_level: RingLevel
    target_component: str
    change_type: str
    risk_score: float
    status: ProposalStatus = ProposalStatus.DRAFT
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = "som"
    simulation_results: Optional[Dict[str, Any]] = None
    approvals: List[Dict[str, Any]] = []
    rollback_plan: Optional[Dict[str, Any]] = None

class SubmitProposalRequest(BaseModel):
    title: str
    description: str
    target_component: str
    change_type: str
    changes: Dict[str, Any]

class EmergencyRequest(BaseModel):
    level: EmergencyLevel
    operator_id: str
    confirmation_code: str
    reason: Optional[str] = None

# ═══════════════════════════════════════════════════════════════
# SOM STATE
# ═══════════════════════════════════════════════════════════════

class SOMState:
    """Global state for SOM service"""

    def __init__(self):
        self.active = True
        self.current_ring = RingLevel.INNER
        self.emergency_level: Optional[EmergencyLevel] = None
        self.components: Dict[str, ComponentHealth] = {}
        self.anomalies: List[Anomaly] = []
        self.proposals: Dict[str, ImprovementProposal] = {}
        self.analysis_count = 0
        self.last_analysis: Optional[datetime] = None
        self.startup_time = datetime.utcnow()

    def is_operational(self) -> bool:
        return self.active and self.emergency_level is None

    def activate_emergency(self, level: EmergencyLevel, operator_id: str, reason: str):
        self.emergency_level = level
        self.active = level != EmergencyLevel.SHUTDOWN
        logger.critical(f"🚨 EMERGENCY LEVEL {level.value} activated by {operator_id}: {reason}")

    def deactivate_emergency(self, operator_id: str):
        logger.info(f"✅ Emergency deactivated by {operator_id}")
        self.emergency_level = None
        self.active = True

# Global state instance
som_state = SOMState()

# ═══════════════════════════════════════════════════════════════
# CORE SERVICES
# ═══════════════════════════════════════════════════════════════

class CentralOversightCore:
    """Central Oversight Core - моніторинг та виявлення аномалій"""

    def __init__(self, state: SOMState):
        self.state = state

    async def analyze_system(self) -> Dict[str, Any]:
        """Повний аналіз стану системи"""
        if not self.state.is_operational():
            return {"status": "paused", "reason": "Emergency mode active"}

        start_time = datetime.utcnow()

        # Collect component health
        await self._update_component_health()

        # Detect anomalies
        new_anomalies = await self._detect_anomalies()

        # Check constitutional compliance
        compliance_result = await self._check_constitutional_compliance()

        self.state.analysis_count += 1
        self.state.last_analysis = datetime.utcnow()

        return {
            "analysis_id": str(uuid.uuid4()),
            "timestamp": start_time.isoformat(),
            "duration_ms": (datetime.utcnow() - start_time).total_seconds() * 1000,
            "components_analyzed": len(self.state.components),
            "anomalies_detected": len(new_anomalies),
            "compliance_status": compliance_result,
            "total_analyses": self.state.analysis_count
        }

    async def _update_component_health(self):
        """Оновити стан компонентів (отримати з Prometheus/Docker)"""
        # Base components to monitor
        base_components = [
            ("backend", "API Gateway"),
            ("postgres", "PostgreSQL Database"),
            ("redis", "Redis Cache"),
            ("qdrant", "Vector Database"),
            ("arbiter", "Arbiter Court"),
            ("ledger", "Truth Ledger"),
            ("orchestrator", "Autonomous Orchestrator"),
            ("rabbitmq", "Message Queue"),
        ]

        for comp_id, name in base_components:
            # In production, this would query Prometheus or Docker API
            self.state.components[comp_id] = ComponentHealth(
                component_id=comp_id,
                name=name,
                status="healthy",  # Would be determined by actual health checks
                metrics={
                    "cpu_usage": 0.3,  # Placeholder
                    "memory_usage": 0.4,
                    "request_rate": 100.0
                },
                last_updated=datetime.utcnow()
            )

    async def _detect_anomalies(self) -> List[Anomaly]:
        """Виявлення аномалій в системі"""
        new_anomalies = []

        for comp_id, health in self.state.components.items():
            # Check for high resource usage
            if health.metrics.get("cpu_usage", 0) > 0.85:
                anomaly = Anomaly(
                    id=f"anomaly_{uuid.uuid4().hex[:8]}",
                    type="resource_exhaustion",
                    component_id=comp_id,
                    severity=AnomalySeverity.HIGH,
                    description=f"High CPU usage on {health.name}",
                    detected_at=datetime.utcnow(),
                    metrics={"cpu_usage": health.metrics.get("cpu_usage")},
                    suggested_action="Scale horizontally or optimize workload",
                    auto_remediation_eligible=True
                )
                new_anomalies.append(anomaly)
                self.state.anomalies.append(anomaly)

            if health.metrics.get("memory_usage", 0) > 0.80:
                anomaly = Anomaly(
                    id=f"anomaly_{uuid.uuid4().hex[:8]}",
                    type="memory_pressure",
                    component_id=comp_id,
                    severity=AnomalySeverity.WARNING,
                    description=f"High memory usage on {health.name}",
                    detected_at=datetime.utcnow(),
                    metrics={"memory_usage": health.metrics.get("memory_usage")},
                    suggested_action="Clear caches or increase memory",
                    auto_remediation_eligible=False
                )
                new_anomalies.append(anomaly)
                self.state.anomalies.append(anomaly)

        return new_anomalies

    async def _check_constitutional_compliance(self) -> Dict[str, Any]:
        """Перевірка відповідності конституційним аксіомам"""
        # In production, this would check against actual axiom enforcement
        return {
            "compliant": True,
            "violations": [],
            "last_check": datetime.utcnow().isoformat()
        }


class HumanSovereigntyInterface:
    """Human Sovereignty Interface - контроль людини над системою"""

    EMERGENCY_CODES = {
        1: "PAUSE_SOM_ALPHA",
        2: "ISOLATE_SOM_BETA",
        3: "SHUTDOWN_SOM_OMEGA"
    }

    def __init__(self, state: SOMState):
        self.state = state

    def verify_emergency_code(self, level: EmergencyLevel, code: str) -> bool:
        """Верифікація коду екстреної зупинки"""
        expected = self.EMERGENCY_CODES.get(level.value)
        return code == expected

    def activate_emergency(self, level: EmergencyLevel, operator_id: str, reason: str) -> Dict[str, Any]:
        """Активація протоколу екстреної зупинки"""
        self.state.activate_emergency(level, operator_id, reason)

        affected = []
        if level.value >= 1:
            affected.append("SOM autonomous actions paused")
        if level.value >= 2:
            affected.append("SOM isolated from production")
        if level.value >= 3:
            affected.append("Full system shutdown initiated")

        return {
            "activated": True,
            "level": level.value,
            "level_name": level.name,
            "affected_systems": affected,
            "activated_at": datetime.utcnow().isoformat(),
            "activated_by": operator_id
        }

    def deactivate_emergency(self, operator_id: str) -> Dict[str, Any]:
        """Деактивація екстреного режиму"""
        previous_level = self.state.emergency_level
        self.state.deactivate_emergency(operator_id)

        return {
            "deactivated": True,
            "previous_level": previous_level.value if previous_level else None,
            "deactivated_at": datetime.utcnow().isoformat(),
            "deactivated_by": operator_id
        }


# ═══════════════════════════════════════════════════════════════
# FASTAPI APPLICATION
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Predator SOM - Sovereign Observer Module v29-S",
    version="29.0.0",
    description="Constitutional hypervisor for continuous system improvement with Truth Ledger & Axiom enforcement"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# v30.1 Autonomy Guard (Security Control for Autonomous Agents)
from app.core.middleware.autonomy_guard import AutonomyGuardMiddleware
app.add_middleware(AutonomyGuardMiddleware)

# Initialize services
oversight_core = CentralOversightCore(som_state)
sovereignty_interface = HumanSovereigntyInterface(som_state)

# ═══════════════════════════════════════════════════════════════
# HEALTH & STATUS ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/som/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if som_state.is_operational() else "degraded",
        "version": "29.0.0",
        "constitutional_core": CONSTITUTIONAL_CORE_AVAILABLE,
        "emergency_level": som_state.emergency_level.value if som_state.emergency_level else None
    }

@app.get("/api/v1/som/status")
async def get_status():
    """Get SOM operational status"""
    return {
        "active": som_state.active,
        "operational": som_state.is_operational(),
        "ring_level": som_state.current_ring.value,
        "emergency_level": som_state.emergency_level.value if som_state.emergency_level else None,
        "pending_proposals": len([p for p in som_state.proposals.values()
                                   if p.status == ProposalStatus.AWAITING_APPROVAL]),
        "total_anomalies": len(som_state.anomalies),
        "last_analysis": som_state.last_analysis.isoformat() if som_state.last_analysis else None,
        "uptime_seconds": (datetime.utcnow() - som_state.startup_time).total_seconds(),
        "analysis_count": som_state.analysis_count
    }

# ═══════════════════════════════════════════════════════════════
# CENTRAL OVERSIGHT ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/som/topology")
async def get_system_topology():
    """Get system topology and component relationships"""
    components = [
        {
            "id": comp.component_id,
            "name": comp.name,
            "status": comp.status,
            "metrics": comp.metrics
        }
        for comp in som_state.components.values()
    ]

    # Define edges (dependencies)
    edges = [
        {"source": "backend", "target": "postgres", "type": "depends_on"},
        {"source": "backend", "target": "redis", "type": "depends_on"},
        {"source": "backend", "target": "qdrant", "type": "depends_on"},
        {"source": "orchestrator", "target": "arbiter", "type": "depends_on"},
        {"source": "orchestrator", "target": "ledger", "type": "depends_on"},
        {"source": "arbiter", "target": "postgres", "type": "depends_on"},
        {"source": "ledger", "target": "postgres", "type": "depends_on"},
    ]

    return {
        "nodes": components,
        "edges": edges,
        "statistics": {
            "total_components": len(components),
            "healthy_components": len([c for c in components if c["status"] == "healthy"]),
            "total_dependencies": len(edges)
        }
    }

@app.post("/api/v1/som/analyze")
async def trigger_analysis(background_tasks: BackgroundTasks):
    """Trigger system analysis"""
    result = await oversight_core.analyze_system()
    return result

@app.get("/api/v1/som/anomalies")
async def get_anomalies(
    severity: Optional[AnomalySeverity] = None,
    since: Optional[datetime] = None,
    limit: int = 50
):
    """Get detected anomalies"""
    anomalies = som_state.anomalies

    if severity:
        anomalies = [a for a in anomalies if a.severity == severity]

    if since:
        anomalies = [a for a in anomalies if a.detected_at >= since]

    return {
        "anomalies": [a.dict() for a in anomalies[-limit:]],
        "total": len(anomalies)
    }

@app.get("/api/v1/som/components/{component_id}/health")
async def get_component_health(component_id: str):
    """Get health details for a specific component"""
    if component_id not in som_state.components:
        raise HTTPException(status_code=404, detail="Component not found")

    component = som_state.components[component_id]
    return component.dict()

# ═══════════════════════════════════════════════════════════════
# IMPROVEMENT ENGINE ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/som/proposals")
async def get_proposals(status: Optional[ProposalStatus] = None):
    """Get improvement proposals"""
    proposals = list(som_state.proposals.values())

    if status:
        proposals = [p for p in proposals if p.status == status]

    return {
        "proposals": [p.dict() for p in proposals],
        "total": len(proposals)
    }

@app.post("/api/v1/som/proposals")
async def submit_proposal(request: SubmitProposalRequest):
    """Submit a new improvement proposal"""
    # Determine ring level based on change type
    ring_level = RingLevel.INNER
    if request.change_type in ["security", "architecture", "schema"]:
        ring_level = RingLevel.MIDDLE
    if request.change_type in ["constitutional", "critical"]:
        ring_level = RingLevel.OUTER

    proposal = ImprovementProposal(
        title=request.title,
        description=request.description,
        ring_level=ring_level,
        target_component=request.target_component,
        change_type=request.change_type,
        risk_score=0.1,  # Would be calculated by risk assessment
        status=ProposalStatus.SUBMITTED
    )

    som_state.proposals[proposal.id] = proposal

    return {
        "proposal_id": proposal.id,
        "status": proposal.status.value,
        "ring_level": ring_level.value,
        "estimated_review_time": "5 minutes" if ring_level == RingLevel.INNER else "Manual review required"
    }

@app.get("/api/v1/som/proposals/{proposal_id}")
async def get_proposal(proposal_id: str):
    """Get proposal details"""
    if proposal_id not in som_state.proposals:
        raise HTTPException(status_code=404, detail="Proposal not found")

    return som_state.proposals[proposal_id].dict()

@app.post("/api/v1/som/proposals/{proposal_id}/approve")
async def approve_proposal(proposal_id: str, approver_id: str, notes: str = ""):
    """Approve a proposal"""
    if proposal_id not in som_state.proposals:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal = som_state.proposals[proposal_id]
    proposal.status = ProposalStatus.APPROVED
    proposal.approvals.append({
        "approver_id": approver_id,
        "approved_at": datetime.utcnow().isoformat(),
        "notes": notes
    })

    return {
        "approved": True,
        "proposal_id": proposal_id,
        "execution_scheduled": True
    }

@app.post("/api/v1/som/proposals/{proposal_id}/reject")
async def reject_proposal(proposal_id: str, rejector_id: str, reason: str):
    """Reject a proposal"""
    if proposal_id not in som_state.proposals:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal = som_state.proposals[proposal_id]
    proposal.status = ProposalStatus.REJECTED

    return {
        "rejected": True,
        "proposal_id": proposal_id,
        "reason": reason
    }

# ═══════════════════════════════════════════════════════════════
# HUMAN SOVEREIGNTY ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.post("/api/v1/som/emergency")
async def activate_emergency(request: EmergencyRequest):
    """Activate emergency protocol (Red Button)"""
    # Verify confirmation code
    if not sovereignty_interface.verify_emergency_code(request.level, request.confirmation_code):
        raise HTTPException(status_code=403, detail="Invalid confirmation code")

    result = sovereignty_interface.activate_emergency(
        level=request.level,
        operator_id=request.operator_id,
        reason=request.reason or "No reason provided"
    )

    logger.critical(f"🚨 EMERGENCY ACTIVATED: Level {request.level.value} by {request.operator_id}")

    return result

@app.delete("/api/v1/som/emergency")
async def deactivate_emergency(operator_id: str):
    """Deactivate emergency protocol"""
    if not som_state.emergency_level:
        raise HTTPException(status_code=400, detail="No active emergency")

    return sovereignty_interface.deactivate_emergency(operator_id)

@app.get("/api/v1/som/approvals/pending")
async def get_pending_approvals():
    """Get pending approval requests"""
    pending = [
        p for p in som_state.proposals.values()
        if p.status == ProposalStatus.AWAITING_APPROVAL
    ]

    return {
        "approvals": [p.dict() for p in pending],
        "urgent_count": len([p for p in pending if p.ring_level == RingLevel.OUTER])
    }

@app.get("/api/v1/som/decisions")
async def get_decision_history(limit: int = 50, offset: int = 0):
    """Get decision history"""
    all_proposals = sorted(
        som_state.proposals.values(),
        key=lambda x: x.created_at,
        reverse=True
    )

    decisions = [
        p for p in all_proposals
        if p.status in [ProposalStatus.APPROVED, ProposalStatus.REJECTED, ProposalStatus.COMPLETED]
    ]

    return {
        "decisions": [d.dict() for d in decisions[offset:offset + limit]],
        "total": len(decisions)
    }

# ═══════════════════════════════════════════════════════════════
# v29-S CONSTITUTIONAL CORE ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/som/axioms")
async def get_axioms():
    """Get all constitutional axioms"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        return {"axioms": [], "message": "Constitutional Core not loaded"}

    return {
        "axioms": constitutional_axioms.get_all_axioms(),
        "genesis_hash": constitutional_axioms.genesis_hash[:16] + "...",
        "is_valid": constitutional_axioms.is_valid,
        "total": len(constitutional_axioms.get_all_axioms())
    }

@app.get("/api/v1/som/axioms/{axiom_id}")
async def get_axiom(axiom_id: str):
    """Get specific axiom details"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Constitutional Core not available")

    axiom = constitutional_axioms.get_axiom(axiom_id)
    if not axiom:
        raise HTTPException(status_code=404, detail="Axiom not found")

    return {
        "id": axiom.id,
        "name": axiom.name,
        "definition": axiom.definition,
        "enforcement": axiom.enforcement.value,
        "description": axiom.description,
        "hash": axiom.get_hash()
    }

@app.post("/api/v1/som/axioms/check")
async def check_action_against_axioms(
    action_type: str,
    actor: str,
    context: Dict[str, Any] = {}
):
    """Check if an action is allowed by constitutional axioms"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        return {"allowed": True, "message": "Constitutional Core not loaded - action allowed by default"}

    is_allowed, reason = constitutional_axioms.check_action(action_type, actor, context)

    # Record to Truth Ledger
    if CONSTITUTIONAL_CORE_AVAILABLE:
        truth_ledger.record(
            action_type=ActionType.AXIOM_CHECK,
            actor=actor,
            payload={
                "checked_action": action_type,
                "context": context,
                "result": "allowed" if is_allowed else "blocked",
                "reason": reason
            },
            axioms_applied=["AXIOM-003", "AXIOM-001"] if not is_allowed else ["AXIOM-003"]
        )

    return {
        "allowed": is_allowed,
        "reason": reason,
        "checked_at": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/som/axioms/violations")
async def get_axiom_violations(limit: int = 50):
    """Get recent axiom violations"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        return {"violations": [], "total": 0}

    return {
        "violations": constitutional_axioms.get_violations(limit),
        "total": len(constitutional_axioms.get_violations(limit))
    }

# ═══════════════════════════════════════════════════════════════
# v29-S TRUTH LEDGER ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.get("/api/v1/ledger/entries")
async def get_ledger_entries(
    action_type: Optional[str] = None,
    actor: Optional[str] = None,
    limit: int = 50
):
    """Get Truth Ledger entries"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        return {"entries": [], "total": 0, "message": "Truth Ledger not available"}

    entries = truth_ledger.get_entries_for_audit(limit=limit)

    return {
        "entries": entries,
        "total": len(entries),
        "latest_hash": truth_ledger.latest_hash[:16] + "..." if truth_ledger.latest_hash else None,
        "chain_valid": truth_ledger.verify_chain()[0]
    }

@app.get("/api/v1/ledger/entry/{entry_id}")
async def get_ledger_entry(entry_id: str):
    """Get specific ledger entry"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Truth Ledger not available")

    entry = truth_ledger.get_entry(entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")

    return entry.to_dict()

@app.get("/api/v1/ledger/entry/{entry_id}/proof")
async def get_ledger_proof(entry_id: str):
    """Generate cryptographic proof for a ledger entry"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        raise HTTPException(status_code=503, detail="Truth Ledger not available")

    proof = truth_ledger.generate_proof(entry_id)
    if not proof:
        raise HTTPException(status_code=404, detail="Entry not found")

    return proof

@app.get("/api/v1/ledger/verify")
async def verify_ledger_chain():
    """Verify the entire Truth Ledger chain integrity"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        return {"valid": False, "error": "Truth Ledger not available"}

    is_valid, error = truth_ledger.verify_chain()

    return {
        "valid": is_valid,
        "error": error,
        "chain_length": truth_ledger.length,
        "latest_hash": truth_ledger.latest_hash,
        "verified_at": datetime.utcnow().isoformat()
    }

@app.get("/api/v1/ledger/statistics")
async def get_ledger_statistics():
    """Get Truth Ledger statistics"""
    if not CONSTITUTIONAL_CORE_AVAILABLE:
        return {"error": "Truth Ledger not available"}

    return truth_ledger.get_statistics()

# ═══════════════════════════════════════════════════════════════
# STARTUP (v29-S)
# ═══════════════════════════════════════════════════════════════

@app.on_event("startup")
async def startup_event():
    logger.info("🏛️ SOM v29-S - Sovereign Observer Module starting...")

    if CONSTITUTIONAL_CORE_AVAILABLE:
        logger.info("📜 Constitutional Axioms loaded successfully")
        logger.info(f"   Genesis Hash: {constitutional_axioms.genesis_hash[:16]}...")
        logger.info(f"   Axioms Count: {len(constitutional_axioms.get_all_axioms())}")

        logger.info("📝 Truth Ledger initialized")
        logger.info(f"   Chain Length: {truth_ledger.length}")

        # Record startup in ledger
        truth_ledger.record(
            action_type=ActionType.SYSTEM_START,
            actor="som_service",
            payload={
                "version": "29.0.0",
                "constitutional_core": True,
                "axioms_count": len(constitutional_axioms.get_all_axioms())
            },
            axioms_applied=["AXIOM-003"]
        )
    else:
        logger.warning("⚠️ Constitutional Core not available - running in degraded mode")

    logger.info("👁️ Central Oversight Core initialized")
    logger.info("🔴 Red Button Protocol ready")
    logger.info("✅ SOM v29-S operational")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🏛️ SOM v29-S shutting down gracefully...")

    if CONSTITUTIONAL_CORE_AVAILABLE:
        truth_ledger.record(
            action_type=ActionType.SYSTEM_STOP,
            actor="som_service",
            payload={"reason": "graceful_shutdown"},
            axioms_applied=["AXIOM-003"]
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8095)
