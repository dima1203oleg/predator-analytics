from typing import TypedDict, List, Dict, Any, Optional, Union, Annotated
import operator

class ToolOutput(TypedDict):
    tool_name: str
    tool_input: str
    output: str
    timestamp: float

class PlanStep(TypedDict):
    id: str
    description: str
    status: str # pending, active, completed, failed
    result: Optional[str]

class AgentMessage(TypedDict):
    role: str # user, assistant, system, tool
    content: str
    name: Optional[str]

class AgentState(TypedDict):
    """
    The state of the agent graph.
    Propagates through all nodes.
    """
    # Messages history with append-only semantics
    messages: Annotated[List[AgentMessage], operator.add]

    # Shared context (global variables)
    context: Dict[str, Any]

    # Strategic Plan
    plan: List[PlanStep]

    # Current logical step description
    current_step: str

    # Structured tool outputs log
    tool_outputs: List[ToolOutput]

    # Generated artifacts (files, reports, etc.)
    artifacts: Dict[str, Any]

    # V25 Inner Monologue / Thinking Process
    thinking: List[str] # Stream of thoughts

    # Errors if any
    error: Optional[str]

    # Final answer/result
    final_response: Optional[str]
