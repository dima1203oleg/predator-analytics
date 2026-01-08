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
    # 1. Success / Completion
    if state.get("final_response"):
        return "approve"

    # 2. Error Handling
    if state.get("error"):
        retries = state["context"].get("retries", 0)
        if retries < 3:
            # We modify context in place, which is fine in LangGraph for dicts
            # but ideally we should return a state update.
            # For conditional edges, we just inspect.
            # The 'worker' node should handle retry logic or we add a 'recovery' node.
            # Here we just decide where to go.
            return "retry"
        else:
            return "give_up"

    # 3. Validation / Continuation
    # If we have a plan but no final response, continue working
    if state.get("plan"):
        # Check if all steps are done (logic to be implemented in planner/critic)
        # For now, just continue execution
        return "next_step"

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
