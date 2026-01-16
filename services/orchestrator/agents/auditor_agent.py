"""
AUDITOR AGENT (Внутрішній Аудитор)
==================================
Перевіряє відповідність дій стандартам та безпеці (Post-Factum).
"""

from typing import Dict, Any, List
from datetime import datetime

try:
    from libs.core.structured_logger import get_logger
except ImportError:
    import logging
    def get_logger(name): return logging.getLogger(name)

logger = get_logger("agent.auditor")

class AuditorAgent:
    def __init__(self):
        self.audit_log: List[Dict] = []

    async def audit_action(self, action_id: str, action_data: Dict[str, Any]) -> bool:
        """Проводить аудит виконаної дії"""
        logger.info(f"AUDITOR: Reviewing action {action_id}...")

        # Перевірка на відповідність політикам (спрощено)
        is_compliant = True
        issues = []

        if "delete" in str(action_data).lower() and "force" in str(action_data).lower():
            is_compliant = False
            issues.append("Unsafe forced deletion detected")

        record = {
            "action_id": action_id,
            "timestamp": datetime.now().isoformat(),
            "compliant": is_compliant,
            "issues": issues
        }

        self.audit_log.append(record)

        if not is_compliant:
            logger.warning(f"AUDITOR: Action {action_id} FAILED audit: {issues}")
            return False

        logger.info(f"AUDITOR: Action {action_id} PASSED audit.")
        return True

# Експорт
auditor_agent = AuditorAgent()
