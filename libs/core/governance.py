import hashlib
import json
from enum import Enum
from typing import List, Dict, Any
from libs.core.logger import setup_logger
from libs.core.database import get_db_sync
from libs.core.constitutional import get_arbiter, get_ledger
from sqlalchemy import text
from datetime import datetime
import os


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
    Centralized Governance Policy for Predator Analytics v26.
    Integrates with Arbiter and Truth Ledger.
    """

    FORBIDDEN_COMMANDS = [
        "rm -rf /", "mkfs", "dd if=", ":(){ :|:& };:", # Fork bomb
        "chmod 777 -R /", "shutdown", "reboot",
        "> /dev/sda", "mv /* /dev/null", "rm -rf .git"
    ]

    FORBIDDEN_PATTERNS = [
        ";", "&&", "||", "|", "`", "$( ", ">", "<", # Shell injection characters
        "../", "..\\" # Path traversal
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
        # Global Bypass for Full Sovereignty
        if os.getenv("SOVEREIGN_AUTO_APPROVE", "false").lower() == "true":
            return {"approved": True, "reason": "Суверенне автосхвалення активовано. Політику обійдено."}

        cmd_lower = command.lower()

        # 1. Global Blocklist (Exact matches or suspicious sequences)
        for bad_cmd in OperationalPolicy.FORBIDDEN_COMMANDS:
            if bad_cmd.lower() in cmd_lower:
                return {
                    "approved": False,
                    "reason": f"Критичне порушення безпеки: Заборонена послідовність команд '{bad_cmd}'."
                }

        # 2. Production Constraints & Pattern Check
        if stage == SecurityStage.PRODUCTION:
            # Тільки дозволені команди в проді
            allowed_prefixes = ["uvicorn", "python", "celery", "aider", "git", "ls", "grep"]
            is_allowed = any(cmd_lower.startswith(pref) for pref in allowed_prefixes)

            if not is_allowed:
                return {
                    "approved": False,
                    "reason": f"Операційне порушення: Команда '{command.split()[0]}' не дозволена для PRODUCTION."
                }

            # Перевірка на небезпечні символи (Shell Injection)
            for pattern in OperationalPolicy.FORBIDDEN_PATTERNS:
                if pattern in command:
                     return {
                        "approved": False,
                        "reason": f"Порушення безпеки: Виявлено заборонений символ/паттерн '{pattern}' у PRODUCTION."
                    }

            if "kubectl apply" in cmd_lower or "kubectl delete" in cmd_lower:
                 return {
                    "approved": False,
                    "reason": "Пряма модифікація через kubectl заборонена в PRODUCTION. Використовуйте GitOps (ArgoCD)."
                }
            if "pip install" in cmd_lower:
                 return {
                    "approved": False,
                    "reason": "Встановлення пакетів під час виконання заборонено в PRODUCTION."
                }

        return {"approved": True, "reason": "Команда безпечна згідно з поточною політикою."}

    @staticmethod
    def check_technology(tech_stack: List[str]) -> Dict[str, Any]:
        """
        Перевіряє, чи технології відповідають стандарту Rationalization.
        """
        for tech in tech_stack:
            if tech.lower() in OperationalPolicy.FORBIDDEN_TECH:
                return {
                    "approved": False,
                    "reason": f"Технологія '{tech}' заборонена політикою раціоналізації. Використовуйте затверджений стек."
                }
        return {"approved": True, "reason": "Технологічний стек відповідає стандартам WinSURF."}

    @staticmethod
    def verify_truth_ledger() -> Dict[str, Any]:
        """
        Верифікує цілісність ланцюга Truth Ledger (v26 Remote Service).
        """
        client = get_ledger()
        healthy = client.verify_integrity()

        return {
            "status": "VALID" if healthy else "CORRUPTED",
            "service": "truth-ledger:8092",
            "timestamp": datetime.now().isoformat()
        }

    @staticmethod
    def authorize_high_compute(component: str, task_details: Dict[str, Any]) -> Dict[str, Any]:
        """
        Request authorization for high-compute task (Constitutional Gatekeeping).
        """
        arbiter = get_arbiter()
        decision = arbiter.decide(
            action_type="high_compute_task",
            context={
                "component": component,
                **task_details
            },
            sender="governance_lib"
        )

        if decision.get('allowed'):
            # Log successful start to ledger
            ledger = get_ledger()
            ledger.log_action(
                entity_type="compute_execution",
                entity_id=component,
                action="authorized_start",
                payload=task_details,
                signature=decision.get('signature')
            )

        return decision
