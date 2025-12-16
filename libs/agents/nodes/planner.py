from ..state import AgentState
import logging

logger = logging.getLogger("agent.planner")

async def planner_node(state: AgentState):
    """
    Analyzes the user request and creates a step-by-step plan.
    """
    logger.info("🧠 PLANNER: Analyzing request...")

    # Context should contain 'llm' instance injected via config in real LangGraph,
    # or we mock it here.

    # Logic:
    # 1. Check if plan exists.
    # 2. If not, generate plan from messages[-1]

    return {
        "current_step": "plan_created",
        "context": {**state["context"], "plan": ["analyze_data", "generate_report"]}
    }
