from enum import Enum
from typing import List, Dict, Any
from libs.core.logger import setup_logger

logger = setup_logger("predator.governance")

class SecurityStage(str, Enum):
    RND = "rnd"           # Все дозволено, експерименти
    STAGING = "staging"   # Перевірка перед продом
    PRODUCTION = "prod"   # Тільки затверджені дії, read-only infra

class WinSURFDecision(str, Enum):
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_REVIEW = "needs_review"

class OperationalPolicy:
    """
    Centralized Governance Policy for Predator Analytics.
    Used by: Telegram Bot, Backend, Orchestrator.
    """

    FORBIDDEN_COMMANDS = [
        "rm -rf /", "mkfs", "dd if=", ":(){ :|:& };:", # Fork bomb
        "chmod 777 -R /", "shutdown", "reboot"
    ]

    FORBIDDEN_TECH = [
        "mysql", "php", "jenkins", "terraform", "ansible", # Ми юзаємо Postgres, Python, ArgoCD
        "jquery", "bootstrap"
    ]

    @staticmethod
    def validate_command(command: str, stage: SecurityStage = SecurityStage.RND) -> Dict[str, Any]:
        """
        Перевіряє команду на безпеку.
        """
        cmd_lower = command.lower()

        # 1. Global Blocklist
        for bad_cmd in OperationalPolicy.FORBIDDEN_COMMANDS:
            if bad_cmd.lower() in cmd_lower:
                return {
                    "approved": False,
                    "reason": f"Critical Security Violation: Forbidden command sequence '{bad_cmd}'."
                }

        # 2. Production Constraints
        if stage == SecurityStage.PRODUCTION:
            if "kubectl apply" in cmd_lower or "kubectl delete" in cmd_lower:
                 return {
                    "approved": False,
                    "reason": "Direct kubectl modification prohibited in PRODUCTION. Use GitOps (ArgoCD)."
                }
            if "pip install" in cmd_lower:
                 return {
                    "approved": False,
                    "reason": "Runtime package installation prohibited in PRODUCTION."
                }

        return {"approved": True, "reason": "Command is safe within current policy."}

    @staticmethod
    def check_technology(tech_stack: List[str]) -> Dict[str, Any]:
        """
        Перевіряє, чи технології відповідають стандарту Rationalization.
        """
        for tech in tech_stack:
            if tech.lower() in OperationalPolicy.FORBIDDEN_TECH:
                return {
                    "approved": False,
                    "reason": f"Technology '{tech}' is banned by Rationalization Policy. Use approved stack."
                }
        return {"approved": True, "reason": "Tech stack aligned with WinSURF."}
