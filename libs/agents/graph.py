from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes.planner import planner_node
from .nodes.worker import worker_node
from .nodes.critic import critic_node

def should_continue(state: AgentState) -> str:
    """
    Decide next step based on state.
    Returns the key for the conditional edge mapping.
    """
    if state.get("error"):
        # Simple retry logic
        retries = state["context"].get("retries", 0)
        if retries < 3:
            state["context"]["retries"] = retries + 1
            return "retry"
        else:
            return "give_up"

    # If no error, check if approved or needs refinement
    last_output = state.get("last_output", {})
    if last_output.get("quality", 0) > 0.8:
        return "approve"

    return "retry"

def create_agent_graph():
    """
    Builds the Plan-and-Execute Agent Graph.
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("worker", worker_node)
    workflow.add_node("critic", critic_node)

    # Set entry point
    workflow.set_entry_point("planner")

    # Static edges
    workflow.add_edge("planner", "worker")
    workflow.add_edge("worker", "critic")

    # Conditional edges
    workflow.add_conditional_edges(
        "critic",
        should_continue,
        {
            "approve": END,
            "give_up": END,
            "retry": "worker"
        }
    )

    return workflow.compile()
