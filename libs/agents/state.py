from typing import TypedDict, Annotated, List, Union, Dict, Any, Optional
import operator

class AgentMessage(TypedDict):
    role: str # user, assistant, system, tool
    content: str
    name: Optional[str]

class AgentState(TypedDict):
    """
    The state of the agent graph.
    Propagates through all nodes.
    """
    # Messages history with append-only semantics (if supported by reducer, typical in LangGraph)
    messages: List[AgentMessage]

    # Shared context (variables like 'doc_id', 'user_query', 'extracted_data')
    context: Dict[str, Any]

    # Current logical step description for debugging
    current_step: str

    # Last tool output or reasoning result
    last_output: Optional[Dict[str, Any]]

    # Errors if any
    error: Optional[str]
