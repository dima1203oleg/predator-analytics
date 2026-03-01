from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from typing import Any

from app.libs.core.constitutional import get_arbiter, get_ledger
from app.libs.core.logger import setup_logger


logger = setup_logger("predator.governance")


class SecurityStage(StrEnum):
    RND = "rnd"  # Все дозволено, експерименти
    STAGING = "staging"  # Перевірка перед продом
    PRODUCTION = "prod"  # Тільки затверджені дії, read-only infra


class WinSURFDecision(StrEnum):
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"


class OperationalPolicy:
    """Centralized Governance Policy for Predator Analytics v45.
    Integrates with Arbiter and Truth Ledger.
    """

    FORBIDDEN_COMMANDS = [
        "rm -rf /",
        "mkfs",
        "dd if=",
        ":(){ :|:& };:",  # Fork bomb
        "chmod 777 -R /",
        "shutdown",
        "reboot",
    ]

    FORBIDDEN_TECH = [
        "mysql",
        "php",
        "jenkins",
        "terraform",
        "ansible",  # Ми юзаємо Postgres, Python, ArgoCD
        "jquery",
        "bootstrap",
    ]

    @staticmethod
    def validate_command(command: str, stage: SecurityStage = SecurityStage.RND) -> dict[str, Any]:
        """Перевіряє команду на безпеку."""
        cmd_lower = command.lower()

        # 1. Global Blocklist
        for bad_cmd in OperationalPolicy.FORBIDDEN_COMMANDS:
            if bad_cmd.lower() in cmd_lower:
                return {
                    "approved": False,
                    "reason": f"Critical Security Violation: Forbidden command sequence '{bad_cmd}'.",
                }

        # 2. Production Constraints
        if stage == SecurityStage.PRODUCTION:
            if "kubectl apply" in cmd_lower or "kubectl delete" in cmd_lower:
                return {
                    "approved": False,
                    "reason": "Direct kubectl modification prohibited in PRODUCTION. Use GitOps (ArgoCD).",
                }
            if "pip install" in cmd_lower:
                return {"approved": False, "reason": "Runtime package installation prohibited in PRODUCTION."}

        return {"approved": True, "reason": "Command is safe within current policy."}

    @staticmethod
    def check_technology(tech_stack: list[str]) -> dict[str, Any]:
        """Перевіряє, чи технології відповідають стандарту Rationalization."""
        for tech in tech_stack:
            if tech.lower() in OperationalPolicy.FORBIDDEN_TECH:
                return {
                    "approved": False,
                    "reason": f"Technology '{tech}' is banned by Rationalization Policy. Use approved stack.",
                }
        return {"approved": True, "reason": "Tech stack aligned with WinSURF."}

    @staticmethod
    def verify_truth_ledger() -> dict[str, Any]:
        """Верифікує цілісність ланцюга Truth Ledger (v45 Remote Service)."""
        client = get_ledger()
        healthy = client.verify_integrity()

        return {
            "status": "VALID" if healthy else "CORRUPTED",
            "service": "truth-ledger:8092",
            "timestamp": datetime.now().isoformat(),
        }

    @staticmethod
    def authorize_high_compute(component: str, task_details: dict[str, Any]) -> dict[str, Any]:
        """Request authorization for high-compute task (Constitutional Gatekeeping)."""
        arbiter = get_arbiter()
        decision = arbiter.decide(
            action_type="high_compute_task", context={"component": component, **task_details}, sender="governance_lib"
        )

        if decision.get("allowed"):
            # Log successful start to ledger
            ledger = get_ledger()
            ledger.log_action(
                entity_type="compute_execution",
                entity_id=component,
                action="authorized_start",
                payload=task_details,
                signature=decision.get("signature"),
            )

        return decision
