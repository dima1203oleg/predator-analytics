import json
import logging
from ..state import AgentState

logger = logging.getLogger("agent.planner")

async def planner_node(state: AgentState):
    """
    Generates a plan from the user request.
    """
    logger.info("🧠 PLANNER: Generating plan...")

    context = state.get("context", {})

    # Get request
    messages = state.get("messages", [])
    if not messages:
        return {"error": "No messages found"}

    last_msg = messages[-1]["content"]

    # Lazy import LLM
    try:
        from app.services.llm.service import llm_service
    except ImportError:
        return {"error": "LLM Service unavailable"}

    prompt = f"""
You are a Senior Software Architect.
Analyze the request: "{last_msg}"

Create a concise, step-by-step plan to achieve this.
Each step should be clear and executable by a developer tools agent.

Return ONLY a JSON array of strings.
Example: ["list directory to find config", "read config.py", "check database settings"]
"""

    # Use Trinity Strategist (Gemini CLI)
    from app.services.triple_agent_service import triple_agent_service
    plan_text = await triple_agent_service.analyze_with_context(last_msg)

    plan = []
    try:
        # If it returns a string with newlines, try to split into steps
        if "[" in plan_text and "]" in plan_text:
            start = plan_text.find("[")
            end = plan_text.rfind("]")
            plan = json.loads(plan_text[start:end+1])
        else:
            plan = [s.strip() for s in plan_text.split("\n") if s.strip()]
    except Exception as e:
        logger.warning(f"Failed to parse Trinity plan: {e}")
        plan = [plan_text]

    logger.info(f"📋 Plan generated: {len(plan)} steps")

    return {
        "current_step": plan[0],
        "thinking": f"Architectural reasoning: Analyzing request '{last_msg}'. Strategy chosen: Plan-and-Execute. Steps derived from Trinitarian Strategy.",
        "context": {
            **context,
            "plan": plan,
            "completed_steps": [],
            "plan_index": 0
        }
    }
