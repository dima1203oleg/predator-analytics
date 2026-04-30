from __future__ import annotations

from typing import Any

from app.libs.core.governance import OperationalPolicy, SecurityStage
from app.libs.core.logger import setup_logger

logger = setup_logger("predator.trinity")


class TrinityCore:
    """The heart of Predator Analytics v45+.
    Unifies WinSURF Governance, Strategic Planning, and Secure Execution.
    """

    def __init__(self, strategist, coder, auditor, ops=None):
        self.strategist = strategist
        self.coder = coder
        self.auditor = auditor
        self.ops = ops

    async def process(self, query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
        context = context or {}
        stage = SecurityStage(context.get("stage", "rnd"))

        # 0. System Lockdown Enforcement
        try:
            from app.services.system_control_service import system_control_service

            if await system_control_service.is_lockdown():
                # Allow only basic information queries during lockdown
                safe_keywords = ["status", "здоров'я", "info", "допомога", "help"]
                is_safe = any(w in query.lower() for w in safe_keywords)

                if not is_safe:
                    logger.warning(f"BLOCKING action during SYSTEM LOCKDOWN: {query[:50]}...")
                    return {
                        "success": False,
                        "error": "⛔ SYSTEM LOCKDOWN ACTIVE: All modifications and high-privilege actions are restricted by the core security protocol.",
                        "history": ["🚨 Lockdown Policy: Operation blocked by root governance."],
                    }
        except Exception as e:
            logger.exception(f"Failed to check lockdown status in TrinityCore: {e}")

        # 1. WinSURF L1: Command Validation
        policy = OperationalPolicy.validate_command(query, stage=stage)
        if not policy["approved"]:
            return {
                "success": False,
                "error": f"WinSURF Blocked: {policy['reason']}",
                "audit_report": f"Governance Violation: {policy['reason']}",
            }

        history = ["🛡️ WinSURF: Approval granted."]

        try:
            # 1.5 Context Enrichment for Diagnosis
            if "diagnose" in query.lower() and self.ops:
                diag_data = await self.ops.diagnose_system(query)
                query = f"CONTEXT DATA:\n{diag_data}\n\nUSER REQUEST: {query}"
                history.append("📊 Context: Diagnostic data collected from system.")

            # 2. Strategy Phase (Gemini)
            plan = await self.strategist.analyze_with_context(query)
            if plan.startswith("❌"):
                return {"success": False, "error": f"Strategy Failure: {plan}", "history": history}
            history.append("🧠 Strategy: Plan generated.")

            # 3. Coding/Tools Phase (Mistral/Ops)
            code = ""
            if any(word in query.lower() for word in ["fix", "generate", "patch", "diagnose"]):
                code = await self.coder.generate_code(query)
                if code.startswith(("❌", "# Error")):
                    return {
                        "success": False,
                        "error": f"Generation Failure: {code}",
                        "history": history,
                    }
                history.append("⚙️ Generation: Code block produced.")

            # 4. Audit Phase (Copilot)
            audit = await self.auditor.security_review(code or query)
            if not audit["approved"]:
                return {
                    "success": False,
                    "error": f"Audit Failed: {audit.get('security_assessment')}",
                    "audit_report": audit.get("security_assessment"),
                    "history": history,
                }
            history.append("✅ Audit: Security check passed.")

            return {
                "success": True,
                "plan": plan,
                "code": code,
                "history": history,
                "audit_report": audit["security_assessment"],
            }

        except Exception as e:
            logger.exception(f"Trinity Core Failure: {e}")
            return {"success": False, "error": str(e), "history": history}
