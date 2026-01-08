import json
import logging
from ..state import AgentState
from ..tools.registry import registry
# Import tools to ensure registration

logger = logging.getLogger("agent.worker")

async def worker_node(state: AgentState):
    """
    Executes the current step using available tools (ReAct loop).
    """
    step = state.get("current_step", "Unknown step")
    logger.info(f"👷 WORKER: Starting step '{step}'")

    # Lazy import LLM service
    try:
        from app.services.llm.service import llm_service
    except ImportError:
        return {"error": "LLM Service unavailable (ImportError)"}

    # Prepare Context & Tools
    context_part = json.dumps(state.get("context", {}), default=str)[:1000] # Limit context size
    tools = registry.get_tools_list()
    tools_desc = "\n".join([f"- {t.name}: {t.description}" for t in tools])

    prompt = f"""
You are an execution agent. Your goal is to complete the current step: "{step}"
Context: {context_part}

Available Tools:
{tools_desc}

Decide your next action. You can use a tool OR provide a final answer.
Return ONLY a JSON object.

Format 1 (To use a tool):
{{
  "thought": "Reasoning...",
  "tool": "tool_name",
  "args": {{ "arg_name": "value" }}
}}

Format 2 (Completion):
{{
  "thought": "I have finished.",
  "final_answer": "Result summary..."
}}
"""

    try:
        # 1. Think & Choose Tool
        response = await llm_service.generate(
            prompt=prompt,
            provider="groq", # Coder Phase - Fast & Accurate
            temperature=0.0
        )

        if not response.success:
            return {"error": f"LLM Generation Failed: {response.error}"}

        # 2. Parse
        content = response.content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[0].strip()

        try:
            action = json.loads(content)
        except json.JSONDecodeError:
            # Fallback: treat whole content as answer if possible
            return {"last_output": {"result": content, "thought": "Failed to parse JSON, returning raw"}}

        # 3. Execute
        if "tool" in action:
            tool_name = action["tool"]
            args = action.get("args", {})
            logger.info(f"🔧 Tool Call: {tool_name} {args}")

            # Check if tool exists
            if not registry.get_tool(tool_name):
                 return {"error": f"Tool {tool_name} not found"}

            result = await registry.execute(tool_name, args)

            # Truncate large results
            result_str = str(result)
            if len(result_str) > 2000:
                result_str = result_str[:2000] + "...[truncated]"

            return {
                "thinking": action.get("thought", f"Executing tool: {tool_name}"),
                "last_output": {
                    "tool": tool_name,
                    "tool_output": result_str,
                    "thought": action.get("thought"),
                    "quality": 1.0 # Optimistic
                }
            }

        elif "final_answer" in action:
            return {
                "thinking": action.get("thought", "Synthesizing final strategic result."),
                "last_output": {
                    "result": action["final_answer"],
                    "thought": action.get("thought"),
                    "quality": 1.0
                }
            }

    except Exception as e:
        logger.error(f"Worker Exception: {e}")
        return {"error": str(e), "thinking": f"Worker encountered critical error: {e}"}

    return {"error": "No action taken", "thinking": "Worker stalled: no valid action derived."}
