from ..state import AgentState
import logging

logger = logging.getLogger("agent.critic")

async def critic_node(state: AgentState):
    """
    Reviews the worker's output.
    """
    logger.info("🧐 CRITIC: Reviewing output...")

    last_output = state.get("last_output", {})
    quality = last_output.get("quality", 0.0)

    if quality > 0.8:
        return {"current_step": "approved"}
    else:
        return {"current_step": "rejected", "error": "Low quality result"}
