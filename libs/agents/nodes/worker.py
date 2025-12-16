from ..state import AgentState
import logging

logger = logging.getLogger("agent.worker")

async def worker_node(state: AgentState):
    """
    Executes the current step of the plan.
    """
    logger.info("👷 WORKER: Executing step...")

    plan = state["context"].get("plan", [])
    if not plan:
        return {"error": "No plan to execute"}

    # Simulate work
    return {
        "current_step": "work_done",
        "last_output": {"result": "Data analyzed successfully", "quality": 0.9}
    }
