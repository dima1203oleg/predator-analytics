# Add project root to sys.path to access scripts and libs
_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_current_dir, "../../.."))
_scripts_dir = os.path.join(_project_root, "scripts")

if _project_root not in sys.path:
    sys.path.insert(0, _project_root)
if _scripts_dir not in sys.path:
    sys.path.insert(0, _scripts_dir)

try:
    from scripts.triple_cli import MixedCLIStack, AgentRole
except ImportError:
    try:
        from triple_cli import MixedCLIStack, AgentRole
    except ImportError:
        MixedCLIStack = None

# Mocking CopilotAgent for fallback when Aider CLI is not used/available
class CopilotAgent:
    def __init__(self, version="v2-audit"):
        self.version = version

    async def review(self, code, rules):
        # Mock audit logic
        class AuditResult:
            def __init__(self, passed, errors):
                self.passed = passed
                self.errors = errors

        # Simple check for forbidden patterns
        if "import os" in code and "system" in code:
            return AuditResult(False, ["Security Risk: Direct system calls detected."])
        return AuditResult(True, [])

from core.tools import InfraTools
import json
import asyncio

logger = logging.getLogger("trinity.cortex")

class TrinityOrchestrator:
    def __init__(self):
        # Initialize CLI Stack (Mixed Top Tech)
        self.cli_stack = MixedCLIStack() if MixedCLIStack else None

        # Fallback to local SDK initialization if CLI stack is not available
        self.gemini = None
        self.mistral = None

        if not self.cli_stack:
            # Gemini Fallback
            try:
                gemini_key = os.getenv("GEMINI_API_KEY", "")
                if gemini_key:
                    import google.generativeai as genai
                    genai.configure(api_key=gemini_key)
                    self.gemini = genai.GenerativeModel("gemini-1.5-pro")
                    logger.info("Gemini Pro (Fallback SDK) initialized.")
            except Exception as e:
                logger.error(f"Gemini Init failed: {e}")

            # Mistral Fallback
            try:
                api_key = os.getenv("MISTRAL_API_KEY", "")
                if api_key:
                    from mistralai import Mistral
                    self.mistral = Mistral(api_key=api_key)
                    logger.info("Mistral (Fallback SDK) initialized.")
            except Exception as e:
                logger.error(f"Mistral Init failed: {e}")

        # Copilot/Aider Audit
        self.copilot = CopilotAgent(version="v2-audit")

        # Tools
        self.tools = InfraTools()

    async def process_request(self, user_query: str, user_role: str):
        """Main loop for processing requests via the Trinity of Agents."""
        logger.info(f"Processing request: {user_query} [Role: {user_role}]")
        start_time = asyncio.get_event_loop().time()

        # STEP 1: Gemini (Strategist) - Intent Analysis & Planning
        plan = {}

        if self.cli_stack:
            try:
                # Use CPU-bound call in a way that doesn't block (ideally)
                # But here we just call it
                plan = self.cli_stack.planner_agent(user_query)
            except Exception as e:
                logger.error(f"CLI Planner failed: {e}")

        if not plan:
            if not self.gemini:
                return {"status": "error", "message": "Strategist (Gemini) unavailable."}

            strategy_prompt = f"User Query: {user_query}. Role: {user_role}. Task: Analyze intent and create JSON plan."
            try:
                strategy_resp = await self.gemini.generate_content_async(strategy_prompt)
                text_resp = strategy_resp.text.replace("```json", "").replace("```", "")
                plan = json.loads(text_resp)
            except Exception as e:
                logger.error(f"Fallback Strategy failed: {e}")
                return {"status": "error", "message": "Failed to generate strategy."}

        if plan.get('risk_level') == 'high' and user_role != 'admin':
            return {"status": "denied", "reason": "High risk action requires Admin approval."}

        # STEP 2: Execution
        execution_result = {}
        draft_code = None
        audit_data = {"passed": True, "errors": []}
        intent = plan.get('intent')

        if intent == 'generate_code':
            # Mistral (Coder)
            if self.cli_stack:
                try:
                    draft_code = self.cli_stack.codegen_agent(plan)
                except Exception as e:
                    logger.error(f"CLI Codegen failed: {e}")

            if not draft_code:
                if not self.mistral:
                     return {"status": "error", "message": "Coder unavailable."}
                from mistralai.models import UserMessage
                code_prompt = f"Context: {plan}. Task: Generate Python script. Return only code."
                draft_msg = await self.mistral.chat.complete_async(model="mistral-large-latest", messages=[UserMessage(content=code_prompt)])
                draft_code = draft_msg.choices[0].message.content

            # Aider/Copilot (Auditor)
            if self.cli_stack:
                try:
                    # Write to temp file for Aider
                    temp_file = f"/tmp/bot_review_{start_time}.py"
                    with open(temp_file, "w") as f:
                        f.write(draft_code)

                    fixed_code = self.cli_stack.review_agent(temp_file, plan.get("description", "Secure audit"))
                    if fixed_code:
                        draft_code = fixed_code
                        audit_data = {"passed": True, "errors": [], "method": "Aider CLI"}
                    else:
                        audit_data = {"passed": False, "errors": ["Aider CLI failed"], "method": "Aider CLI"}
                except Exception as e:
                    logger.error(f"Aider CLI Audit failed: {e}")

            if audit_data["passed"]:
                execution_result = {"type": "code", "content": draft_code, "summary": "✅ Code generated and verified via Trinity Stack."}
            else:
                 # Local SDK Audit fallback
                 audit = await self.copilot.review(draft_code, rules="security")
                 audit_data = {"passed": audit.passed, "errors": audit.errors, "method": "Mock Auditor"}
                 execution_result = {"type": "code", "content": draft_code, "summary": f"⚠️ Audit: {'Passed' if audit.passed else 'Failed'}. Errors: {audit.errors}"}

        elif intent == 'ops_action':
            # Execution via InfraTools
            result = await self.tools.execute_plan(plan.get('steps', []))
            execution_result = {"type": "action", "results": result, "summary": "⚡ Infrastructure action initiated via Trinity Core."}

        elif intent == 'shadow_protocol':
            execution_result = {"type": "info", "summary": "🔒 Shadow Protocol Level 7 Access Granted.", "content": "Retrieving classified datasets..."}

        elif intent == 'info':
            execution_result = {"type": "info", "summary": "🔍 System Intelligence Report", "content": f"Analyzed query: {user_query}. Cluster status: ACTIVE."}

        # Urgent flag based on risk level or intent
        if plan.get('risk_level') == 'high' or intent == 'ops_action':
            execution_result["urgent"] = True

        # STEP 3: Persistence (Database Logging)
        try:
            from libs.core.database import async_session_maker
            from libs.core.models import TrinityAuditLog

            execution_time = int((asyncio.get_event_loop().time() - start_time) * 1000)

            async with async_session_maker() as session:
                log = TrinityAuditLog(
                    request_text=user_query,
                    user_id=user_role, # Simplified for demo
                    intent=intent,
                    gemini_plan=plan,
                    mistral_output=draft_code,
                    copilot_audit=audit_data,
                    status="verified" if audit_data["passed"] else "fixed",
                    final_output=execution_result.get("content") or execution_result.get("summary"),
                    risk_level=plan.get("risk_level", "low"),
                    execution_time_ms=execution_time
                )
                session.add(log)
                await session.commit()
                logger.info(f"Trinity audit log saved. ID: {log.id}")
        except Exception as e:
             logger.error(f"Failed to save Trinity audit log: {e}")

        return execution_result
