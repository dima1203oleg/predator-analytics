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
    step = state.get("current_step")

    # 1. Success / Completion
    if step == "COMPLETE":
        return "approve"

    # 2. Error Handling
    if state.get("error"):
        retries = state["context"].get("retries", 0)
        if retries < 3:
            state["context"]["retries"] = retries + 1
            return "retry"
        else:
            return "give_up"

    # 3. Validation / Continuation
    # If logic reaches here, Critic implied continuation to next step
    return "next_step"

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
            "approve": END,     # Success
            "give_up": END,     # Failure
            "retry": "worker",  # Error recovery
            "next_step": "worker" # Next item in plan
        }
    )

    return workflow.compile()
