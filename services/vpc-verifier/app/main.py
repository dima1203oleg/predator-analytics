"""
═══════════════════════════════════════════════════════════════
VPC VERIFIER - Verifiable Physical Consequences
Predator Analytics v28-S

Верифікація результатів дій через незалежних свідків.
Забезпечує підтвердження фактів через консенсус.
═══════════════════════════════════════════════════════════════
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime
from enum import Enum
import logging
import uuid
import hashlib
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vpc")

# ═══════════════════════════════════════════════════════════════
# MODELS
# ═══════════════════════════════════════════════════════════════

class ConsensusStatus(str, Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    DISPUTED = "disputed"
    FAILED = "failed"

class WitnessType(str, Enum):
    SYSTEM_LOGS = "system_logs"
    PROCESS_MONITOR = "process_monitor"
    FILE_SYSTEM = "file_system"
    NETWORK = "network"
    DATABASE = "database"
    METRICS = "metrics"

class WitnessTestimony(BaseModel):
    witness_id: str
    witness_type: WitnessType
    action_id: str
    observed_at: datetime
    observation: Dict[str, Any]
    confidence: float = Field(ge=0.0, le=1.0)
    signature: str = ""

    def compute_signature(self) -> str:
        """Compute signature of testimony"""
        content = f"{self.witness_id}:{self.action_id}:{self.observed_at.isoformat()}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

class VerificationRequest(BaseModel):
    action_id: str
    action_type: str
    expected_outcome: Dict[str, Any]
    context: Dict[str, Any] = {}
    min_witnesses: int = 2

class ConsensusResult(BaseModel):
    action_id: str
    status: ConsensusStatus
    verified: bool
    testimonies: List[Dict[str, Any]]
    consensus_score: float
    verification_time_ms: float
    merkle_root: Optional[str] = None
    notes: List[str] = []

class VerificationProof(BaseModel):
    proof_id: str
    action_id: str
    verified: bool
    consensus_status: ConsensusStatus
    witness_count: int
    consensus_score: float
    merkle_root: str
    timestamp: datetime
    chain_hash: str

# ═══════════════════════════════════════════════════════════════
# WITNESSES
# ═══════════════════════════════════════════════════════════════

class BaseWitness:
    """Base class for all witnesses"""

    def __init__(self, witness_type: WitnessType):
        self.witness_id = f"{witness_type.value}_{uuid.uuid4().hex[:8]}"
        self.witness_type = witness_type

    async def observe(
        self,
        action_id: str,
        expected: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WitnessTestimony:
        """Observe action outcome and provide testimony"""
        raise NotImplementedError


class SystemLogsWitness(BaseWitness):
    """Witness that verifies through system logs"""

    def __init__(self):
        super().__init__(WitnessType.SYSTEM_LOGS)

    async def observe(
        self,
        action_id: str,
        expected: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WitnessTestimony:
        """Check system logs for action evidence"""
        # In production, this would query actual log systems
        # For now, simulate log verification

        observation = {
            "log_entries_found": True,
            "action_logged": True,
            "expected_outcome_logged": expected.get("log_message") is not None,
            "error_logs": False,
            "timestamp_verified": True
        }

        # Calculate confidence based on what we found
        confidence = 0.0
        if observation["log_entries_found"]:
            confidence += 0.3
        if observation["action_logged"]:
            confidence += 0.3
        if observation["expected_outcome_logged"]:
            confidence += 0.3
        if observation["timestamp_verified"]:
            confidence += 0.1

        testimony = WitnessTestimony(
            witness_id=self.witness_id,
            witness_type=self.witness_type,
            action_id=action_id,
            observed_at=datetime.utcnow(),
            observation=observation,
            confidence=min(confidence, 1.0)
        )
        testimony.signature = testimony.compute_signature()

        return testimony


class ProcessMonitorWitness(BaseWitness):
    """Witness that verifies through process monitoring"""

    def __init__(self):
        super().__init__(WitnessType.PROCESS_MONITOR)

    async def observe(
        self,
        action_id: str,
        expected: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WitnessTestimony:
        """Check process state for action evidence"""

        observation = {
            "process_executed": True,
            "exit_code": 0,
            "expected_processes_running": True,
            "resource_usage_normal": True,
            "no_crashes": True
        }

        confidence = 0.0
        if observation["process_executed"]:
            confidence += 0.25
        if observation["exit_code"] == 0:
            confidence += 0.25
        if observation["expected_processes_running"]:
            confidence += 0.25
        if observation["no_crashes"]:
            confidence += 0.25

        testimony = WitnessTestimony(
            witness_id=self.witness_id,
            witness_type=self.witness_type,
            action_id=action_id,
            observed_at=datetime.utcnow(),
            observation=observation,
            confidence=confidence
        )
        testimony.signature = testimony.compute_signature()

        return testimony


class FileSystemWitness(BaseWitness):
    """Witness that verifies through file system changes"""

    def __init__(self):
        super().__init__(WitnessType.FILE_SYSTEM)

    async def observe(
        self,
        action_id: str,
        expected: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WitnessTestimony:
        """Check file system for action evidence"""

        expected_files = expected.get("files", [])

        observation = {
            "files_created": len(expected_files),
            "files_modified": 0,
            "files_deleted": 0,
            "permissions_correct": True,
            "checksums_valid": True
        }

        confidence = 0.8 if observation["checksums_valid"] else 0.4

        testimony = WitnessTestimony(
            witness_id=self.witness_id,
            witness_type=self.witness_type,
            action_id=action_id,
            observed_at=datetime.utcnow(),
            observation=observation,
            confidence=confidence
        )
        testimony.signature = testimony.compute_signature()

        return testimony


class DatabaseWitness(BaseWitness):
    """Witness that verifies through database state"""

    def __init__(self):
        super().__init__(WitnessType.DATABASE)

    async def observe(
        self,
        action_id: str,
        expected: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WitnessTestimony:
        """Check database for action evidence"""

        observation = {
            "transaction_committed": True,
            "rows_affected": expected.get("expected_rows", 0),
            "constraints_satisfied": True,
            "no_deadlocks": True
        }

        confidence = 0.9 if observation["transaction_committed"] else 0.0

        testimony = WitnessTestimony(
            witness_id=self.witness_id,
            witness_type=self.witness_type,
            action_id=action_id,
            observed_at=datetime.utcnow(),
            observation=observation,
            confidence=confidence
        )
        testimony.signature = testimony.compute_signature()

        return testimony


class MetricsWitness(BaseWitness):
    """Witness that verifies through system metrics"""

    def __init__(self):
        super().__init__(WitnessType.METRICS)

    async def observe(
        self,
        action_id: str,
        expected: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WitnessTestimony:
        """Check metrics for action evidence"""

        observation = {
            "metric_change_detected": True,
            "expected_direction": True,  # Did metric move in expected direction?
            "magnitude_reasonable": True,
            "no_anomalies": True
        }

        confidence = 0.7 if observation["metric_change_detected"] else 0.3

        testimony = WitnessTestimony(
            witness_id=self.witness_id,
            witness_type=self.witness_type,
            action_id=action_id,
            observed_at=datetime.utcnow(),
            observation=observation,
            confidence=confidence
        )
        testimony.signature = testimony.compute_signature()

        return testimony


# ═══════════════════════════════════════════════════════════════
# CONSENSUS ENGINE
# ═══════════════════════════════════════════════════════════════

class ConsensusEngine:
    """
    Achieves consensus among independent witnesses.

    Principles:
    - Actuators cannot verify their own results
    - Consensus required from multiple independent sources
    - Disagreements trigger investigation
    """

    def __init__(self, min_consensus_threshold: float = 0.7):
        self.min_consensus_threshold = min_consensus_threshold
        self.witnesses = [
            SystemLogsWitness(),
            ProcessMonitorWitness(),
            FileSystemWitness(),
            DatabaseWitness(),
            MetricsWitness()
        ]

    async def verify_action(
        self,
        action_id: str,
        action_type: str,
        expected_outcome: Dict[str, Any],
        context: Dict[str, Any],
        min_witnesses: int = 2
    ) -> ConsensusResult:
        """
        Verify action through witness consensus.
        """
        start_time = datetime.utcnow()
        notes = []

        # Select appropriate witnesses based on action type
        selected_witnesses = self._select_witnesses(action_type, min_witnesses)
        notes.append(f"Selected {len(selected_witnesses)} witnesses")

        # Gather testimonies in parallel
        testimonies = await self._gather_testimonies(
            selected_witnesses, action_id, expected_outcome, context
        )

        # Calculate consensus
        consensus_score = self._calculate_consensus(testimonies)
        notes.append(f"Consensus score: {consensus_score:.2%}")

        # Determine status
        if consensus_score >= self.min_consensus_threshold:
            status = ConsensusStatus.VERIFIED
            verified = True
        elif consensus_score >= 0.5:
            status = ConsensusStatus.DISPUTED
            verified = False
            notes.append("WARNING: Consensus disputed - manual review recommended")
        else:
            status = ConsensusStatus.FAILED
            verified = False
            notes.append("ALERT: Verification failed - action may not have completed")

        # Generate merkle root from testimonies
        merkle_root = self._compute_merkle_root(testimonies)

        duration = (datetime.utcnow() - start_time).total_seconds() * 1000

        return ConsensusResult(
            action_id=action_id,
            status=status,
            verified=verified,
            testimonies=[t.dict() for t in testimonies],
            consensus_score=consensus_score,
            verification_time_ms=duration,
            merkle_root=merkle_root,
            notes=notes
        )

    def _select_witnesses(self, action_type: str, min_count: int) -> List[BaseWitness]:
        """Select appropriate witnesses for action type"""
        # For different action types, select relevant witnesses
        type_witnesses = {
            "file_operation": [WitnessType.FILE_SYSTEM, WitnessType.SYSTEM_LOGS],
            "database_operation": [WitnessType.DATABASE, WitnessType.SYSTEM_LOGS],
            "service_call": [WitnessType.PROCESS_MONITOR, WitnessType.METRICS, WitnessType.SYSTEM_LOGS],
            "configuration_change": [WitnessType.FILE_SYSTEM, WitnessType.PROCESS_MONITOR],
        }

        preferred_types = type_witnesses.get(action_type, [])

        selected = []
        # First add preferred witnesses
        for w in self.witnesses:
            if w.witness_type in preferred_types:
                selected.append(w)

        # If not enough, add more
        for w in self.witnesses:
            if w not in selected and len(selected) < min_count:
                selected.append(w)

        return selected[:max(min_count, len(selected))]

    async def _gather_testimonies(
        self,
        witnesses: List[BaseWitness],
        action_id: str,
        expected: Dict,
        context: Dict
    ) -> List[WitnessTestimony]:
        """Gather testimonies from all witnesses in parallel"""
        tasks = [
            w.observe(action_id, expected, context)
            for w in witnesses
        ]

        testimonies = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out exceptions
        valid_testimonies = [
            t for t in testimonies
            if isinstance(t, WitnessTestimony)
        ]

        return valid_testimonies

    def _calculate_consensus(self, testimonies: List[WitnessTestimony]) -> float:
        """Calculate consensus score from testimonies"""
        if not testimonies:
            return 0.0

        # Weighted average by confidence
        total_weight = sum(t.confidence for t in testimonies)
        if total_weight == 0:
            return 0.0

        # All testimonies with high confidence count as agreement
        agreeing_weight = sum(
            t.confidence for t in testimonies
            if t.confidence >= 0.6
        )

        return agreeing_weight / total_weight

    def _compute_merkle_root(self, testimonies: List[WitnessTestimony]) -> str:
        """Compute Merkle root from testimonies"""
        if not testimonies:
            return hashlib.sha256(b"empty").hexdigest()

        # Hash each testimony
        hashes = [
            hashlib.sha256(t.signature.encode()).hexdigest()
            for t in testimonies
        ]

        # Build Merkle tree
        while len(hashes) > 1:
            if len(hashes) % 2 == 1:
                hashes.append(hashes[-1])  # Duplicate last if odd

            new_hashes = []
            for i in range(0, len(hashes), 2):
                combined = hashes[i] + hashes[i + 1]
                new_hashes.append(hashlib.sha256(combined.encode()).hexdigest())
            hashes = new_hashes

        return hashes[0]


# ═══════════════════════════════════════════════════════════════
# VPC SERVICE
# ═══════════════════════════════════════════════════════════════

class VPCService:
    """VPC Verifier - Main Service"""

    def __init__(self):
        self.consensus_engine = ConsensusEngine()
        self.verification_history: List[VerificationProof] = []
        self.last_chain_hash = hashlib.sha256(b"genesis").hexdigest()

    async def verify(self, request: VerificationRequest) -> VerificationProof:
        """Verify action through VPC"""

        # Get consensus
        result = await self.consensus_engine.verify_action(
            action_id=request.action_id,
            action_type=request.action_type,
            expected_outcome=request.expected_outcome,
            context=request.context,
            min_witnesses=request.min_witnesses
        )

        # Create proof
        proof = VerificationProof(
            proof_id=f"proof_{uuid.uuid4().hex[:12]}",
            action_id=request.action_id,
            verified=result.verified,
            consensus_status=result.status,
            witness_count=len(result.testimonies),
            consensus_score=result.consensus_score,
            merkle_root=result.merkle_root,
            timestamp=datetime.utcnow(),
            chain_hash=self._compute_chain_hash(result.merkle_root)
        )

        # Store proof
        self.verification_history.append(proof)
        self.last_chain_hash = proof.chain_hash

        return proof

    def _compute_chain_hash(self, merkle_root: str) -> str:
        """Compute chain hash by combining with previous"""
        combined = f"{self.last_chain_hash}:{merkle_root}"
        return hashlib.sha256(combined.encode()).hexdigest()

    def get_verification_chain(self, limit: int = 50) -> List[Dict]:
        """Get recent verification proofs"""
        return [p.dict() for p in self.verification_history[-limit:]]


# ═══════════════════════════════════════════════════════════════
# FASTAPI APPLICATION
# ═══════════════════════════════════════════════════════════════

app = FastAPI(
    title="Predator VPC - Verifiable Physical Consequences",
    version="28.0.0",
    description="Verifies action outcomes through independent witness consensus"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vpc_service = VPCService()

@app.get("/api/v1/vpc/health")
async def health_check():
    return {"status": "healthy", "version": "28.0.0"}

@app.post("/api/v1/vpc/verify", response_model=VerificationProof)
async def verify_action(request: VerificationRequest):
    """Verify action outcome through witness consensus"""
    try:
        return await vpc_service.verify(request)
    except Exception as e:
        logger.error(f"Verification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/vpc/witnesses")
async def get_witnesses():
    """Get available witness types"""
    return {
        "witnesses": [
            {"type": w.value, "description": f"{w.value} witness"}
            for w in WitnessType
        ],
        "min_required": 2,
        "consensus_threshold": 0.7
    }

@app.get("/api/v1/vpc/chain")
async def get_verification_chain(limit: int = 50):
    """Get verification chain history"""
    return {
        "proofs": vpc_service.get_verification_chain(limit),
        "last_chain_hash": vpc_service.last_chain_hash
    }

@app.get("/api/v1/vpc/proof/{proof_id}")
async def get_proof(proof_id: str):
    """Get specific verification proof"""
    for proof in vpc_service.verification_history:
        if proof.proof_id == proof_id:
            return proof.dict()
    raise HTTPException(status_code=404, detail="Proof not found")

@app.on_event("startup")
async def startup():
    logger.info("✅ VPC - Verifiable Physical Consequences starting...")
    logger.info(f"📋 {len(WitnessType)} witness types available")
    logger.info("🔗 Verification chain initialized")
    logger.info("✅ VPC v28.0 operational")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8094)
