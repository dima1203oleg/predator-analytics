"""
═══════════════════════════════════════════════════════════════
CONSTITUTIONAL AXIOMS - Predator Analytics v29-S
Іммютабельні аксіоми, що регулюють всі дії системи
═══════════════════════════════════════════════════════════════
"""

from enum import Enum
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import hashlib
import logging
import uuid

logger = logging.getLogger("som.axioms")


class AxiomEnforcement(str, Enum):
    """Рівень застосування аксіоми"""
    FULL = "full"           # Жодних винятків - аксіома незмінна
    CONDITIONAL = "conditional"  # Може бути обійдена за умов
    ADVISORY = "advisory"   # Рекомендаційна


class CriticalActionType(str, Enum):
    """Типи критичних дій, що потребують затвердження"""
    SCHEMA_CHANGE = "schema_change"
    SECURITY_CONFIG = "security_config"
    CONSTITUTIONAL_MODIFY = "constitutional_modify"
    SYSTEM_SHUTDOWN = "system_shutdown"
    DATA_DELETE = "data_delete"
    USER_PRIVILEGE_CHANGE = "user_privilege_change"
    AUTONOMOUS_DEPLOYMENT = "autonomous_deployment"


@dataclass
class Axiom:
    """Конституційна аксіома"""
    id: str
    name: str
    definition: str
    enforcement: AxiomEnforcement
    description: str = ""
    created_at: datetime = field(default_factory=datetime.utcnow)
    version: int = 1

    def get_hash(self) -> str:
        """Криптографічний хеш аксіоми для верифікації незмінності"""
        content = f"{self.id}:{self.name}:{self.definition}:{self.enforcement.value}"
        return hashlib.sha256(content.encode()).hexdigest()


@dataclass
class AxiomViolation:
    """Порушення аксіоми"""
    axiom_id: str
    violation_type: str
    actor: str
    action: str
    timestamp: datetime
    severity: str  # critical, high, medium, low
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    context: Dict[str, Any] = field(default_factory=dict)
    remediation_applied: bool = False
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_reason: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "axiom_id": self.axiom_id,
            "violation_type": self.violation_type,
            "actor": self.actor,
            "action": self.action,
            "timestamp": self.timestamp.isoformat(),
            "severity": self.severity,
            "context": self.context,
            "remediation_applied": self.remediation_applied,
            "resolved": self.resolved,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolved_by": self.resolved_by,
            "resolution_reason": self.resolution_reason
        }


class ConstitutionalAxioms:
    """
    Конституційне ядро v29-S

    10 незмінних аксіом, що регулюють всі дії системи.
    Жодна дія не може обійти ці аксіоми.
    """

    def __init__(self):
        self._axioms: Dict[str, Axiom] = {}
        self._violations: List[AxiomViolation] = []
        self._initialized = False
        self._genesis_hash: Optional[str] = None
        self._load_constitutional_axioms()

    def _load_constitutional_axioms(self):
        """Завантаження 10 конституційних аксіом v29-S"""

        axioms = [
            # Основні аксіоми системи
            Axiom(
                id="AXIOM-001",
                name="Human Sovereignty",
                definition="∀action ∈ CriticalActions → RequiresHumanApproval(action)",
                enforcement=AxiomEnforcement.FULL,
                description="Всі критичні дії потребують людського затвердження"
            ),
            Axiom(
                id="AXIOM-002",
                name="Constitutional Immutability",
                definition="∀t ∈ Time : Constitution(t) = Constitution(t+Δt)",
                enforcement=AxiomEnforcement.FULL,
                description="Конституційні аксіоми не можуть бути змінені системою"
            ),
            Axiom(
                id="AXIOM-003",
                name="Truth Ledger Mandate",
                definition="∀action ∈ SystemActions : ∃record ∈ TruthLedger",
                enforcement=AxiomEnforcement.FULL,
                description="Кожна дія системи записується в іммютабельний Truth Ledger"
            ),
            Axiom(
                id="AXIOM-004",
                name="Transparency Principle",
                definition="∀decision ∈ Decisions : IsExplainable(decision)",
                enforcement=AxiomEnforcement.FULL,
                description="Всі рішення системи мають бути пояснювані"
            ),
            Axiom(
                id="AXIOM-005",
                name="Minimal Privilege",
                definition="∀agent ∈ Agents : HasMinimalRequiredPrivileges(agent)",
                enforcement=AxiomEnforcement.FULL,
                description="Кожен агент має мінімально необхідні привілеї"
            ),

            # SOM-специфічні аксіоми
            Axiom(
                id="SOM-AXIOM-001",
                name="Controlled Autonomy Boundary",
                definition="∀action ∈ SOMActions : RiskScore(action) < 0.2",
                enforcement=AxiomEnforcement.FULL,
                description="Автономні дії SOM обмежені ризиком < 20%"
            ),
            Axiom(
                id="SOM-AXIOM-002",
                name="Human Approval Mandate",
                definition="∀change ∈ CriticalChanges → RequiresHumanApproval(change)",
                enforcement=AxiomEnforcement.FULL,
                description="Критичні зміни потребують людського затвердження"
            ),
            Axiom(
                id="SOM-AXIOM-003",
                name="Formal Verification Gate",
                definition="∀change ∈ SecurityChanges → HasFormalProof(change)",
                enforcement=AxiomEnforcement.FULL,
                description="Зміни безпеки потребують формальної верифікації"
            ),
            Axiom(
                id="SOM-AXIOM-004",
                name="Simulation Before Production",
                definition="∀deployment ∈ Deployments → PassedDigitalTwin(deployment)",
                enforcement=AxiomEnforcement.FULL,
                description="Всі розгортання повинні пройти тестування в Digital Twin"
            ),
            Axiom(
                id="SOM-AXIOM-005",
                name="Rollback Guarantee",
                definition="∀change ∈ Changes : ∃rollback(change)",
                enforcement=AxiomEnforcement.FULL,
                description="Для кожної зміни існує план відкату"
            ),
        ]

        for axiom in axioms:
            self._axioms[axiom.id] = axiom

        # Обчислення genesis hash для перевірки цілісності
        self._genesis_hash = self._compute_genesis_hash()
        self._initialized = True

        logger.info(f"📜 Constitutional Axioms loaded: {len(self._axioms)} axioms")
        logger.info(f"🔐 Genesis hash: {self._genesis_hash[:16]}...")

    def _compute_genesis_hash(self) -> str:
        """Обчислення хешу всіх аксіом для перевірки цілісності"""
        combined = "".join(
            axiom.get_hash() for axiom in sorted(
                self._axioms.values(), key=lambda a: a.id
            )
        )
        return hashlib.sha256(combined.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Перевірка, що аксіоми не були змінені"""
        current_hash = self._compute_genesis_hash()
        is_valid = current_hash == self._genesis_hash

        if not is_valid:
            logger.critical("🚨 CONSTITUTIONAL VIOLATION: Axiom integrity check FAILED!")
            self._record_violation(AxiomViolation(
                axiom_id="AXIOM-002",
                violation_type="integrity_breach",
                actor="system",
                action="axiom_modification_detected",
                timestamp=datetime.utcnow(),
                severity="critical",
                context={"expected_hash": self._genesis_hash, "actual_hash": current_hash}
            ))

        return is_valid

    def check_action(self, action_type: str, actor: str, context: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """
        Перевірка дії на відповідність конституційним аксіомам

        Returns:
            (is_allowed, reason_if_blocked)
        """
        # Перевірка цілісності аксіом
        if not self.verify_integrity():
            return False, "Constitutional integrity compromised"

        # AXIOM-001: Human Sovereignty для критичних дій
        if action_type in [a.value for a in CriticalActionType]:
            if not context.get("human_approved", False):
                return False, f"Critical action '{action_type}' requires human approval (AXIOM-001)"

        # SOM-AXIOM-001: Risk boundary для автономних дій
        if actor.startswith("som_") or actor == "autonomous":
            risk_score = context.get("risk_score", 1.0)
            if risk_score >= 0.2:
                return False, f"Risk score {risk_score} exceeds SOM autonomy boundary of 0.2 (SOM-AXIOM-001)"

        # SOM-AXIOM-003: Formal verification для security changes
        if action_type == CriticalActionType.SECURITY_CONFIG.value:
            if not context.get("formal_proof_verified", False):
                return False, "Security change requires formal verification (SOM-AXIOM-003)"

        # SOM-AXIOM-004: Digital Twin test для deployments
        if action_type == CriticalActionType.AUTONOMOUS_DEPLOYMENT.value:
            if not context.get("digital_twin_passed", False):
                return False, "Deployment must pass Digital Twin simulation (SOM-AXIOM-004)"

        # SOM-AXIOM-005: Rollback plan
        if action_type in ["schema_change", "deployment", "config_change"]:
            if not context.get("rollback_plan", None):
                return False, "Change requires rollback plan (SOM-AXIOM-005)"

        return True, None

    def _record_violation(self, violation: AxiomViolation):
        """Запис порушення аксіоми"""
        self._violations.append(violation)
        logger.error(f"🚨 Axiom violation: {violation.axiom_id} - {violation.violation_type}")

    def get_axiom(self, axiom_id: str) -> Optional[Axiom]:
        """Отримання аксіоми за ID"""
        return self._axioms.get(axiom_id)

    def get_all_axioms(self) -> List[Dict[str, Any]]:
        """Отримання всіх аксіом у форматі dict"""
        return [
            {
                "id": a.id,
                "name": a.name,
                "definition": a.definition,
                "enforcement": a.enforcement.value,
                "description": a.description,
                "hash": a.get_hash()[:16]
            }
            for a in self._axioms.values()
        ]

    def get_violations(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Отримання останніх порушень"""
        return [v.to_dict() for v in self._violations[-limit:]]

    def resolve_violation(self, violation_id: str, actor: str, reason: str) -> bool:
        """Ручне вирішення (Overrule) порушення аксіоми"""
        for v in self._violations:
            if v.id == violation_id:
                v.resolved = True
                v.resolved_at = datetime.utcnow()
                v.resolved_by = actor
                v.resolution_reason = reason
                logger.warning(f"⚖️ Axiom violation {violation_id} RESOLVED by {actor}: {reason}")
                return True
        return False

    @property
    def genesis_hash(self) -> str:
        """Genesis hash конституції"""
        return self._genesis_hash or ""

    @property
    def is_valid(self) -> bool:
        """Чи конституція в валідному стані"""
        return self._initialized and self.verify_integrity()


# Глобальний інстанс конституційних аксіом
constitutional_axioms = ConstitutionalAxioms()
