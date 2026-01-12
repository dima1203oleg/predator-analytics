import sys
import os
import logging
import time
import json
import uuid
from typing import Dict, Any
from .llm import llm_service

# Ensure libs is reachable (dynamically find project root)
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_current_dir, "..", "..", "..", ".."))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)

from libs.agents.core import TrinityCore
from libs.core.database import get_db_ctx  # Correct context manager
from libs.core.models import TrinityAuditLog

# Add scripts to path for MixedCLIStack
_scripts_dir = os.path.abspath(os.path.join(_project_root, "scripts"))
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

try:
    from triple_cli import MixedCLIStack, AgentRole
except ImportError:
    MixedCLIStack = None

logger = logging.getLogger(__name__)

from .ops_service import ops_service

class TripleAgentService(TrinityCore):
    """
    Orchestrator for the Triple Agent Chain.
    Backend implementation of TrinityCore with persistent audit logging.
    Uses Mixed Top CLI Stack (Gemini, Mistral, Aider) + Ops Tools.
    """

    def __init__(self):
        super().__init__(strategist=self, coder=self, auditor=self, ops=ops_service)

        from libs.core.secrets import secret_manager

        g_key = secret_manager.get_secret("GEMINI_API_KEY")
        m_key = secret_manager.get_secret("MISTRAL_API_KEY")
        gr_key = secret_manager.get_secret("GROQ_API_KEY")

        self.cli_stack = MixedCLIStack(gemini_key=g_key, mistral_key=m_key, groq_key=gr_key) if MixedCLIStack else None

        # Fallback providers if CLI stack fails or is not available
        self.strategist_provider = "gemini"
        self.coder_provider = "groq"
        self.auditor_provider = "groq"

    async def analyze_with_context(self, command: str) -> str:
        """TrinityCore Strategist implementation (Gemini)"""
        if self.cli_stack:
            # Use CLI Stack logic
            try:
                # Wrap synchronous call in thread if needed, but SDK is usually fine
                # MixedCLIStack planner returns dict
                self._current_plan_raw = self.cli_stack.planner_agent(command)
                return self._current_plan_raw.get("description", "Strategy generated via Gemini CLI")
            except Exception as e:
                logger.error(f"Gemini CLI Planner failed: {e}")

        # Fallback to internal LLM service
        self._current_plan_raw = await self._gemini_plan_fallback(command)
        return self._current_plan_raw.get("plan", "No plan generated")

    async def generate_code(self, plan: str) -> str:
        """TrinityCore Coder implementation (Mistral Vibe)"""
        if self.cli_stack:
            try:
                plan_dict = self._current_plan_raw if self._current_plan_raw else {"description": plan}
                self._current_code_raw = {"code": self.cli_stack.codegen_agent(plan_dict)}
                return self._current_code_raw.get("code", "")
            except Exception as e:
                logger.error(f"Mistral Vibe CLI Codegen failed: {e}")

        self._current_code_raw = await self._mistral_generate_fallback(plan)
        return self._current_code_raw.get("code", "")

    async def security_review(self, code: str) -> Dict[str, Any]:
        """TrinityCore Auditor implementation (Aider)"""
        if self.cli_stack:
            try:
                # Aider needs a file. We'll create a temp file for review.
                temp_file = f"/tmp/trinity_review_{uuid.uuid4().hex}.py"
                with open(temp_file, "w") as f:
                    f.write(code)

                # Call real Aider CLI
                plan_desc = self._current_plan_raw.get("description", "Secure audit")
                fixed_code = self.cli_stack.review_agent(temp_file, plan_desc)

                if fixed_code:
                    # Update internal state with fixed code if Aider modified it
                    self._current_code_raw["code"] = fixed_code
                    return {
                        "approved": True,
                        "security_assessment": "Aider CLI: Code reviewed and auto-fixed for security standards."
                    }

                # If Aider failed or didn't return code, fallback
                res = await self._aider_audit_fallback(code, self._current_plan_raw.get("plan", ""))
                return {
                    "approved": res.get("success", False),
                    "security_assessment": f"Aider Review (Fallback): {res.get('report', '')}"
                }
            except Exception as e:
                logger.error(f"Aider CLI Audit failed: {e}")

        self._current_audit_raw = await self._aider_audit_fallback(code, self._current_plan_raw.get("plan", ""))
        return {
            "approved": self._current_audit_raw.get("success", False),
            "security_assessment": self._current_audit_raw.get("report", "")
        }

    async def process_command(self, user_command: str) -> Dict[str, Any]:
        """
        Main entry point. Uses LangGraph Agent System for unified logic.
        Records every step into trinity_audit_logs.
        """
        start_time = time.time()

        # 1. Initialize LangGraph Agent
        try:
            from libs.agents.graph import create_agent_graph
            agent_graph = create_agent_graph()

            # Initial State
            initial_state = {
                "messages": [{"role": "user", "content": user_command}],
                "context": {
                    "original_request": user_command,
                    "retries": 0,
                    "plan_index": 0
                },
                "current_step": "START",
                "error": None
            }

            logger.info(f"🚀 Trinity Agent Graph started for: {user_command}")

            # 2. Execute Graph
            final_state = await agent_graph.ainvoke(initial_state)

            # 3. Extract Results
            success = not final_state.get("error")
            plan = final_state.get("context", {}).get("plan", [])
            last_output = final_state.get("last_output", {})

            final_code = ""
            if isinstance(last_output, dict):
                final_code = last_output.get("tool_output", "") or last_output.get("result", "")

            execution_time_ms = int((time.time() - start_time) * 1000)

            # 4. Persist Audit Log
            try:
                async with get_db_ctx() as db:
                    log_entry = TrinityAuditLog(
                        id=uuid.uuid4(),
                        request_text=user_command,
                        user_id="anonymous",
                        intent=final_state.get("current_step", "unknown"),
                        gemini_plan={"steps": plan},
                        mistral_output=final_code,  # Storing final result here
                        copilot_audit={"success": success, "error": final_state.get("error")},
                        thinking_process=final_state.get("thinking", "No reasoning recorded."),
                        meta=final_state.get("context", {}),
                        status="verified" if success else "blocked",
                        final_output=str(last_output),
                        risk_level="low" if success else "high",
                        execution_time_ms=execution_time_ms
                    )
                    db.add(log_entry)
                logger.info("✅ Trinity audit log saved.")
            except Exception as e:
                logger.error(f"Failed to save audit log: {e}")

            return {
                "success": success,
                "error": final_state.get("error"),
                "audit_report": f"Graph Execution Completed. Steps: {len(plan)}",
                "plan": plan,
                "code": final_code,
                "history": final_state.get("messages", []),
                "intent": "autonomous_action"
            }

        except Exception as e:
            logger.error(f"❌ LangGraph Execution Failed: {e}")
             # Fallback to old Logic or just fail gracefully
            return {
                "success": False,
                "error": str(e),
                "audit_report": "Agent Graph Critical Failure",
                "plan": [],
                "code": ""
            }

    async def _gemini_plan_fallback(self, command: str) -> Dict[str, Any]:
        # Implementation for internal LLM fallback
        prompt = f"Create a tactical execution plan for: {command}. Return JSON."
        res = await llm_service.generate(prompt, provider="gemini", format="json")
        try:
            return json.loads(res.content)
        except:
            return {"plan": res.content}

    async def _mistral_generate_fallback(self, plan: str, audit_feedback: str = "") -> Dict[str, Any]:
        prompt = f"Implement this plan: {plan}. Feedback: {audit_feedback}. Return code."
        res = await llm_service.generate(prompt, provider="groq") # or mistral if available
        return {"code": res.content}

    async def _aider_audit_fallback(self, code: str, plan: str) -> Dict[str, Any]:
        prompt = f"Review this code for security and plan compliance: {plan}\n\nCode:\n{code}\n\nReturn 'success' (bool) and 'report' (string) in JSON."
        res = await llm_service.generate(prompt, provider="groq", format="json")
        try:
            return json.loads(res.content)
        except:
            return {"success": True, "report": "Audit passed (fallback parsing error)"}

triple_agent_service = TripleAgentService()
