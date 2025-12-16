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

    response = await llm_service.generate(
        prompt=prompt,
        provider="gemini",
        temperature=0.2
    )

    plan = ["Explore codebase"] # Fallback

    if response.success:
        try:
            content = response.content.replace("```json", "").replace("```", "").strip()
            # Try to find array
            start = content.find("[")
            end = content.rfind("]")
            if start != -1 and end != -1:
                plan = json.loads(content[start:end+1])
        except Exception as e:
            logger.warning(f"Failed to parse plan: {e}")

    logger.info(f"📋 Plan generated: {len(plan)} steps")

    return {
        "current_step": plan[0],
        "context": {
            **context,
            "plan": plan,
            "completed_steps": [],
            "plan_index": 0
        }
    }
