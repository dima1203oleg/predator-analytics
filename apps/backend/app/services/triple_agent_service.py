import sys
import os
import logging
import time
import json
import uuid
from typing import Dict, Any, List, Optional
from .llm import llm_service, LLMResponse

# Ensure libs is reachable (dynamically find project root)
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_current_dir, "..", "..", "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from libs.core.governance import OperationalPolicy
from libs.agents.core import TrinityCore
from libs.core.database import get_db_ctx  # Correct context manager
from libs.core.models import TrinityAuditLog

logger = logging.getLogger(__name__)

class TripleAgentService(TrinityCore):
    """
    Orchestrator for the Triple Agent Chain.
    Backend implementation of TrinityCore with persistent audit logging.
    """

    def __init__(self):
        super().__init__(strategist=self, coder=self, auditor=self)
        self.strategist_provider = "gemini"
        self.coder_provider = "mistral"
        self.auditor_provider = "groq"

    async def analyze_with_context(self, command: str) -> str:
        """TrinityCore Strategist implementation"""
        self._current_plan_raw = await self._gemini_plan(command)
        return self._current_plan_raw.get("plan", "No plan generated")

    async def generate_code(self, plan: str) -> str:
        """TrinityCore Coder implementation"""
        self._current_code_raw = await self._mistral_generate(plan)
        return self._current_code_raw.get("code", "")

    async def security_review(self, code: str) -> Dict[str, Any]:
        """TrinityCore Auditor implementation"""
        self._current_audit_raw = await self._aider_audit(code, self._current_plan_raw.get("plan", ""))
        return {
            "approved": self._current_audit_raw.get("success", False),
            "security_assessment": self._current_audit_raw.get("report", "")
        }

    async def process_command(self, user_command: str) -> Dict[str, Any]:
        """
        Main entry point. Uses TrinityCore.process for unified logic.
        Records every step into trinity_audit_logs.
        """
        start_time = time.time()

        # Reset internal state trackers
        self._current_plan_raw = {}
        self._current_code_raw = {}
        self._current_audit_raw = {}

        # 1. Execute unified Trinity process
        res = await self.process(user_command)

        execution_time_ms = int((time.time() - start_time) * 1000)

        # 2. Persist to Database using context manager
        try:
            async with get_db_ctx() as db:
                log_entry = TrinityAuditLog(
                    id=uuid.uuid4(),
                    request_text=user_command,
                    user_id="anonymous",
                    intent=self._current_plan_raw.get("intent", "unknown"),
                    gemini_plan=self._current_plan_raw,
                    mistral_output=res.get("code", ""),
                    copilot_audit=self._current_audit_raw,
                    status="verified" if res["success"] else "blocked",
                    final_output=res.get("audit_report", "Execution blocked by auditor"),
                    risk_level="low" if res["success"] else "high",
                    execution_time_ms=execution_time_ms
                )
                db.add(log_entry)
                # No need to manual commit, get_db_ctx handles it
            logger.info(f"Trinity audit log saved for request: {user_command[:50]}...")
        except Exception as e:
            logger.error(f"Failed to save Trinity audit log: {e}")

        # 3. Return response compatible with UI v22.0
        return {
            "success": res["success"],
            "error": res.get("error"),
            "audit_report": res.get("audit_report"),
            "plan": res.get("plan"),
            "code": res.get("code"),
            "history": res.get("history"),
            "intent": self._current_plan_raw.get("intent", "autonomous_action") if res["success"] else "blocked"
        }

    async def _gemini_plan(self, command: str) -> Dict[str, Any]:
        system_prompt = """
        Ти — Стратег системи Predator Analytics v22.0. Твоє завдання — проаналізувати запит та скласти покроковий план.
        Відповідь у форматі JSON: {"intent": "...", "plan": "...", "success": true}
        """
        response = await llm_service.generate_with_routing(
            prompt=command,
            system=system_prompt,
            mode="precise",
            preferred_provider=self.strategist_provider
        )
        try:
            import json, re
            json_str = re.search(r'\{.*\}', response.content, re.DOTALL).group(0)
            return json.loads(json_str)
        except:
            return {"success": False, "plan": response.content}

    async def _mistral_generate(self, plan: str, audit_feedback: str = "") -> Dict[str, Any]:
        system_prompt = f"Ти — Кодер. Генеруй тільки код. План: {plan}"
        response = await llm_service.generate_with_routing(
            prompt=plan,
            system=system_prompt,
            mode="fast",
            preferred_provider=self.coder_provider
        )
        return {"success": response.success, "code": response.content}

    async def _aider_audit(self, code: str, plan: str) -> Dict[str, Any]:
        system_prompt = "Перевір код. Видай: ПРИЙНЯТО або ВІДХИЛЕНО."
        response = await llm_service.generate_with_routing(
            prompt=f"Code: {code}\nPlan: {plan}",
            system=system_prompt,
            mode="precise",
            preferred_provider=self.auditor_provider
        )
        is_safe = "ПРИЙНЯТО" in response.content.upper() and response.success
        return {"success": is_safe, "report": response.content}

triple_agent_service = TripleAgentService()
