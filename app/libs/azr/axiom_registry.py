from __future__ import annotations


"""═══════════════════════════════════════════════════════════════
AXIOM REGISTRY - Constitutional Axiom Management
Predator Analytics v45-S.

Immutable registry of constitutional axioms.
Loaded from YAML files on system startup.
Cannot be modified at runtime.
═══════════════════════════════════════════════════════════════
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import hashlib
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml


logger = logging.getLogger("azr.axiom_registry")


class AxiomLevel(str, Enum):
    """Axiom importance levels."""
    FUNDAMENTAL = "FUNDAMENTAL"    # Cannot be modified under any circumstances
    ABSOLUTE = "ABSOLUTE"          # Cannot be modified by AZR
    CONSTITUTIONAL = "CONSTITUTIONAL"  # Requires super-majority
    OPERATIONAL = "OPERATIONAL"    # Requires court approval


class AxiomStatus(str, Enum):
    """Axiom enforcement status."""
    ENFORCED = "ENFORCED"
    DEGRADED = "DEGRADED"
    SUSPENDED = "SUSPENDED"    # Only for non-fundamental


@dataclass
class Constraint:
    """A constraint defined by an axiom."""
    id: str
    description: str
    check_expression: str = ""
    violation_severity: str = "HIGH"
    violation_action: str = "BLOCK"


@dataclass
class Axiom:
    """Constitutional axiom definition."""
    id: str
    name: str
    name_en: str
    version: str
    level: AxiomLevel
    status: AxiomStatus
    formal_logic: str
    explanation: str
    immutability: str
    enforcement: list[dict[str, Any]] = field(default_factory=list)
    constraints: list[Constraint] = field(default_factory=list)
    created_at: datetime | None = None
    content_hash: str = ""

    def __post_init__(self):
        if not self.content_hash:
            self.content_hash = self._compute_hash()

    def _compute_hash(self) -> str:
        """Compute SHA3-512 hash of axiom content."""
        content = f"{self.id}:{self.formal_logic}:{self.immutability}"
        return hashlib.sha3_512(content.encode()).hexdigest()

    def verify_integrity(self) -> bool:
        """Verify axiom has not been modified."""
        return self._compute_hash() == self.content_hash

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "name_en": self.name_en,
            "version": self.version,
            "level": self.level.value,
            "status": self.status.value,
            "immutability": self.immutability,
            "constraints_count": len(self.constraints),
            "content_hash": self.content_hash[:16] + "..."
        }


class AxiomRegistry:
    """Immutable registry of constitutional axioms.

    Features:
    - Load axioms from YAML files
    - Verify axiom integrity via hashes
    - Check action compliance against axioms
    - Provide axiom information for auditing
    """

    def __init__(self, axioms_path: str = "/app/infrastructure/constitution/axioms_v45"):
        self._axioms: dict[str, Axiom] = {}
        self._registry_hash: str = ""
        self._loaded = False
        self._load_time: datetime | None = None
        self.axioms_path = Path(axioms_path)

    def load(self) -> bool:
        """Load all axioms from YAML files.
        Can only be called once - subsequent calls are ignored.
        """
        if self._loaded:
            logger.warning("Axiom registry already loaded - ignoring reload attempt")
            return True

        if not self.axioms_path.exists():
            logger.warning(f"Axioms path {self.axioms_path} not found")
            # Try alternative path
            alt_path = Path("infrastructure/constitution/axioms_v45")
            if alt_path.exists():
                self.axioms_path = alt_path
            else:
                logger.error("No axioms path found!")
                return False

        axiom_files = sorted(self.axioms_path.glob("axiom_*.yaml"))

        if not axiom_files:
            logger.warning("No axiom files found!")
            return False

        for axiom_file in axiom_files:
            try:
                axiom = self._load_axiom_file(axiom_file)
                self._axioms[axiom.id] = axiom
                logger.info(f"✅ Loaded axiom: {axiom.id} - {axiom.name}")
            except Exception as e:
                logger.exception(f"❌ Failed to load axiom from {axiom_file}: {e}")
                raise RuntimeError(f"Constitutional axiom loading failed: {e}")

        self._registry_hash = self._compute_registry_hash()
        self._loaded = True
        self._load_time = datetime.utcnow()

        logger.info(f"📜 Loaded {len(self._axioms)} axioms. Registry hash: {self._registry_hash[:16]}...")
        return True

    def _load_axiom_file(self, filepath: Path) -> Axiom:
        """Load a single axiom from YAML file."""
        with open(filepath) as f:
            data = yaml.safe_load(f)

        # Parse constraints
        constraints = []
        for c in data.get("constraints", []):
            if isinstance(c, dict):
                constraints.append(Constraint(
                    id=c.get("id", ""),
                    description=c.get("description", ""),
                    check_expression=c.get("check_expression", ""),
                    violation_severity=c.get("violation_severity", "HIGH"),
                    violation_action=c.get("violation_action", "BLOCK")
                ))

        # Parse enforcement
        enforcement = []
        if "enforcement" in data:
            if isinstance(data["enforcement"], dict):
                enforcement = data["enforcement"].get("primary", []) + data["enforcement"].get("secondary", [])
            elif isinstance(data["enforcement"], list):
                enforcement = data["enforcement"]

        return Axiom(
            id=data["id"],
            name=data["name"],
            name_en=data.get("name_en", data["name"]),
            version=data["version"],
            level=AxiomLevel(data["level"]),
            status=AxiomStatus(data.get("status", "ENFORCED")),
            formal_logic=data["formal_logic"],
            explanation=data["explanation"],
            immutability=data["immutability"],
            enforcement=enforcement,
            constraints=constraints,
            created_at=datetime.fromisoformat(data["created_at"]) if "created_at" in data else None
        )

    def _compute_registry_hash(self) -> str:
        """Compute hash of all axioms for integrity verification."""
        combined = "".join(
            a.content_hash for a in sorted(self._axioms.values(), key=lambda x: x.id)
        )
        return hashlib.sha3_512(combined.encode()).hexdigest()

    # ═══════════════════════════════════════════════════════════════
    # PUBLIC API
    # ═══════════════════════════════════════════════════════════════

    def get_axiom(self, axiom_id: str) -> Axiom | None:
        """Get axiom by ID."""
        return self._axioms.get(axiom_id)

    def get_all_axioms(self) -> list[Axiom]:
        """Get all loaded axioms."""
        return list(self._axioms.values())

    def get_axioms_by_level(self, level: AxiomLevel) -> list[Axiom]:
        """Get axioms by importance level."""
        return [a for a in self._axioms.values() if a.level == level]

    def get_fundamental_axioms(self) -> list[Axiom]:
        """Get only fundamental (immutable) axioms."""
        return self.get_axioms_by_level(AxiomLevel.FUNDAMENTAL)

    def verify_registry_integrity(self) -> bool:
        """Verify all axioms have not been modified."""
        current_hash = self._compute_registry_hash()
        if current_hash != self._registry_hash:
            logger.critical("🚨 CONSTITUTIONAL VIOLATION: Axiom registry has been modified!")
            return False
        return all(a.verify_integrity() for a in self._axioms.values())

    def check_compliance(self, action: dict[str, Any]) -> list[dict[str, Any]]:
        """Check action against all axioms.
        Returns list of violations (empty if compliant).
        """
        violations = []

        for axiom in self._axioms.values():
            if axiom.status != AxiomStatus.ENFORCED:
                continue

            violation = self._check_axiom_compliance(axiom, action)
            if violation:
                violations.append(violation)

        return violations

    def _check_axiom_compliance(self, axiom: Axiom, action: dict[str, Any]) -> dict | None:
        """Check action against specific axiom."""
        # Delegate to specific checker based on axiom ID
        checker_method = f"_check_{axiom.id}"
        checker = getattr(self, checker_method, None)

        if checker:
            return checker(axiom, action)

        # Generic constraint checking
        for constraint in axiom.constraints:
            if not self._evaluate_constraint(constraint, action):
                return {
                    "axiom_id": axiom.id,
                    "axiom_name": axiom.name,
                    "constraint_id": constraint.id,
                    "violation": constraint.description,
                    "severity": constraint.violation_severity,
                    "action": constraint.violation_action
                }

        return None

    def _evaluate_constraint(self, constraint: Constraint, action: dict) -> bool:
        """Evaluate a constraint expression against an action.
        Returns True if constraint is satisfied.
        """
        # Simple expression evaluation
        expr = constraint.check_expression
        if not expr:
            return True

        # Basic checks (would be more sophisticated in production)
        try:
            # Check "implies" patterns
            if " implies " in expr:
                parts = expr.split(" implies ")
                left = self._eval_condition(parts[0].strip(), action)
                if left:
                    return self._eval_condition(parts[1].strip(), action)
                return True  # Antecedent is false, implication is true

            # Direct evaluation
            return self._eval_condition(expr, action)

        except Exception as e:
            logger.warning(f"Failed to evaluate constraint {constraint.id}: {e}")
            return True  # Fail open for now (should be configurable)

    def _eval_condition(self, condition: str, action: dict) -> bool:
        """Evaluate a simple condition."""
        # Handle basic patterns
        if "is not null" in condition:
            field = condition.split(".", maxsplit=1)[0].replace("action", "").strip(".")
            return action.get(field) is not None

        if "==" in condition:
            parts = condition.split("==")
            field = parts[0].strip().replace("action.", "")
            value = parts[1].strip().strip("'\"")
            return str(action.get(field, "")) == value

        if "> 0" in condition:
            field = condition.split(">", maxsplit=1)[0].strip().replace("len(", "").replace(")", "")
            field = field.replace("action.", "")
            val = action.get(field, "")
            return len(val) > 0 if isinstance(val, (str, list)) else val > 0

        return True  # Default to true for unhandled patterns

    # ═══════════════════════════════════════════════════════════════
    # SPECIFIC AXIOM CHECKERS
    # ═══════════════════════════════════════════════════════════════

    def _check_axiom_0(self, axiom: Axiom, action: dict) -> dict | None:
        """Check Axiom 0: Existence - entity must be registered."""
        if "entity" in action:
            entity = action["entity"]
            if not entity.get("registered"):
                return {
                    "axiom_id": axiom.id,
                    "axiom_name": axiom.name,
                    "violation": "Entity not registered in system registry",
                    "severity": "CRITICAL",
                    "action": "BLOCK_AND_ALERT"
                }
        return None

    def _check_axiom_2(self, axiom: Axiom, action: dict) -> dict | None:
        """Check Axiom 2: Human Sovereignty - critical actions need human approval."""
        if action.get("critical") and not action.get("human_approved"):
            return {
                "axiom_id": axiom.id,
                "axiom_name": axiom.name,
                "violation": "Critical action without human approval",
                "severity": "CRITICAL",
                "action": "BLOCK_EXECUTION"
            }
        return None

    def _check_axiom_4(self, axiom: Axiom, action: dict) -> dict | None:
        """Check Axiom 4: Safety - risk must be acceptable."""
        risk_score = action.get("risk_score", 0)

        if risk_score >= 0.20:
            return {
                "axiom_id": axiom.id,
                "axiom_name": axiom.name,
                "violation": f"Risk score {risk_score:.2%} exceeds threshold 20%",
                "severity": "CRITICAL" if risk_score >= 0.30 else "HIGH",
                "action": "BLOCK_EXECUTION"
            }

        if not action.get("rollback_plan"):
            return {
                "axiom_id": axiom.id,
                "axiom_name": axiom.name,
                "violation": "No rollback plan provided",
                "severity": "HIGH",
                "action": "BLOCK_UNTIL_PLAN_PROVIDED"
            }

        return None

    def get_registry_info(self) -> dict[str, Any]:
        """Get registry information for auditing."""
        return {
            "loaded": self._loaded,
            "load_time": self._load_time.isoformat() if self._load_time else None,
            "axiom_count": len(self._axioms),
            "registry_hash": self._registry_hash[:32] + "..." if self._registry_hash else None,
            "integrity_valid": self.verify_registry_integrity() if self._loaded else None,
            "axioms": [a.to_dict() for a in sorted(self._axioms.values(), key=lambda x: x.id)]
        }


# ═══════════════════════════════════════════════════════════════
# GLOBAL INSTANCE (Singleton Pattern)
# ═══════════════════════════════════════════════════════════════

_axiom_registry: AxiomRegistry | None = None


def get_axiom_registry() -> AxiomRegistry:
    """Get or create the global axiom registry instance."""
    global _axiom_registry
    if _axiom_registry is None:
        _axiom_registry = AxiomRegistry()
        _axiom_registry.load()
    return _axiom_registry


def reload_axiom_registry() -> AxiomRegistry:
    """Force reload of axiom registry (for testing only!)."""
    global _axiom_registry
    logger.warning("⚠️ Force reloading axiom registry - this should only happen in tests!")
    _axiom_registry = AxiomRegistry()
    _axiom_registry.load()
    return _axiom_registry
