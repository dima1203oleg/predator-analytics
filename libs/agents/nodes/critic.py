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

    # 1. Handle Errors (Retry logic is in graph conditional)
    if state.get("error"):
        logger.warning(f"Step '{current_step}' failed with error.")
        return {} # Pass through for graph logic

    # 2. Check if Worker signaled completion (e.g. final_answer)
    if last_output.get("done") or "final_answer" in last_output:
        logger.info("✅ Worker signaled completion.")
        return {"current_step": "COMPLETE"}

    # 3. Advance Plan
    if plan and idx < len(plan) - 1:
        next_idx = idx + 1
        next_step = plan[next_idx]
        logger.info(f"👉 Advancing to step {next_idx + 1}/{len(plan)}: {next_step}")

        return {
            "current_step": next_step,
            "context": {**context, "plan_index": next_idx},
            "last_output": {}, # Clear output
            "error": None
        }

    # 4. Plan Exhausted
    if plan:
        logger.info("🏁 All steps executed.")
        return {"current_step": "COMPLETE"}

    return {"error": "Plan empty or invalid state"}
