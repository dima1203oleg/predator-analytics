import logging
from typing import Any, Dict

from libs.agents.core import TrinityCore

from bot.config import settings
from bot.services.agents.aider_agent import AiderAgent
from bot.services.agents.gemini_agent import GeminiAgent
from bot.services.agents.mistral_agent import MistralAgent
from bot.services.agents.ops_agent import OpsAgent
from bot.services.integrations.prometheus import PrometheusClient

logger = logging.getLogger(__name__)

class AgentOrchestrator(TrinityCore):
    def __init__(self, winsurf_architect=None):
        # Ініціалізація агентів
        gemini = GeminiAgent()
        mistral = MistralAgent()
        aider = AiderAgent()
        ops = OpsAgent()

        # Виклик конструктора базового ядра
        super().__init__(
            strategist=gemini,
            coder=mistral,
            auditor=aider,
            ops=ops
        )
        # Аліаси для зворотної сумісності з ботом
        self.gemini = gemini
        self.mistral = mistral
        self.aider = aider
        self.ops = ops
        self.prometheus = PrometheusClient()
        self.pending_actions = {} # user_id -> intent_data

    async def execute_chain(self, intent_data: Dict[str, Any], user_id: int) -> Dict:
        """
        Processes an intent and parameters through the TrinityCore or directly via Ops.
        """
        intent = intent_data.get("intent", "chat")
        params = intent_data.get("params", {})
        query = params.get("query") or intent # Fallback

        logger.info(f"Orchestrating intent: {intent} for user {user_id}")

        # Specialized handling for direct system actions
        if intent in ["system_status", "task_list", "backup", "sync", "security_scan", "quality_check"]:
            logger.info(f"Executing direct Ops task: {intent}")
            ops_result = await self.ops.execute_task(intent, params)
            return {
                "status": "executed",
                "summary": ops_result,
                "audit_report": "Direct Ops Execution (Internal)"
            }

        # For diagnose or chat, use TrinityCore (Strategist -> Auditor)
        context = {
            "user_id": user_id,
            "intent": intent,
            "params": params,
            "stage": settings.ENVIRONMENT
        }

        result = await self.process(query, context)

        if not result["success"]:
            return {
                "status": "error",
                "summary": result["error"],
                "audit_report": result.get("audit_report")
            }

        return {
            "status": "executed",
            "summary": result["plan"],
            "code": result.get("code"),
            "audit_report": result.get("audit_report")
        }
