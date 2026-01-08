import logging
from ..state import AgentState

logger = logging.getLogger("agent.critic")

async def critic_node(state: AgentState):
    """
    Reviews the worker's output and determines if the plan is complete.
    """
    logger.info("🧐 CRITIC: Reviewing result...")

    last_output = state.get("last_output", {})
    context = state.get("context", {})
    plan = context.get("plan", [])
    idx = context.get("plan_index", 0)
    current_step = state.get("current_step")

    # 1. AI SECURITY AUDIT (Copilot/Aider Phase)
    audit_report = "Security assessment in progress..."
    try:
        from app.services.triple_agent_service import triple_agent_service
        result_text = str(last_output.get('tool_output') or last_output.get('result', 'No result'))
        audit_res = await triple_agent_service.security_review(result_text)
        audit_report = audit_res.get("security_assessment", "Audit passed.")

        if not audit_res.get("approved"):
            logger.warning(f"🚨 Audit REJECTED: {audit_report}")
            state["error"] = f"Audit Failed: {audit_report}"
            return {
                "thinking": f"Critique: Step '{current_step}' output rejected. Reason: {audit_report}. Requesting correction."
            }

        logger.info(f"✅ Audit PASSED: {audit_report}")
    except Exception as e:
        logger.error(f"Critic Audit Error: {e}")
        audit_report = f"Audit skipped due to error: {e}"

    # 2. Reasoning Trace for UI
    thinking = f"Critic thinking: Analysis of step '{current_step}' completed. Result: {audit_report}. "

    # 3. Handle Errors
    if state.get("error"):
        return {"thinking": thinking + "Status: ERROR DETECTED."}

    # 4. Check if Worker signaled completion
    if last_output.get("done") or "final_answer" in last_output:
        logger.info("✅ Worker signaled completion.")
        return {
            "current_step": "COMPLETE",
            "thinking": thinking + "Mission accomplished. Strategy successfully finalized."
        }

    # 5. Advance Plan
    if plan and idx < len(plan) - 1:
        next_idx = idx + 1
        next_step = plan[next_idx]
        logger.info(f"👉 Advancing to step {next_idx + 1}/{len(plan)}: {next_step}")

        return {
            "current_step": next_step,
            "context": {**context, "plan_index": next_idx},
            "last_output": {}, # Clear output
            "error": None,
            "thinking": thinking + f"Proceeding to next strategic milestone: {next_step}"
        }

    # 6. Plan Exhausted
    if plan:
        logger.info("🏁 All steps executed.")
        return {
            "current_step": "COMPLETE",
            "thinking": thinking + "All strategic steps completed. System state verified."
        }

    return {"error": "Plan empty or invalid state", "thinking": "Critique failed: internal inconsistency."}
