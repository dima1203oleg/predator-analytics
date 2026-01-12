from langgraph.graph import StateGraph, END
from .state import AgentState
from .nodes.planner import planner_node
from .nodes.worker import worker_node
from .nodes.critic import critic_node
from .nodes.analyzer import analyzer_node

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
            return "retry"
        else:
            return "give_up"

    # 3. Analysis needed - check if we have query results that need case generation
    if state.get("analysis_results") and not state.get("generated_cases"):
        return "generate_cases"

    # 4. Validation / Continuation
    if state.get("plan"):
        pending_steps = [s for s in state["plan"] if s.get("status") == "pending"]
        if pending_steps:
            return "next_step"
        return "approve"

    return "next_step"


def should_analyze(state: AgentState) -> str:
    """
    Decide if we need E2E analysis.
    """
    context = state.get("context", {})

    # Check if this is an analysis request
    if context.get("requires_analysis"):
        return "analyze"

    # Check for analysis keywords in last message
    messages = state.get("messages", [])
    if messages:
        last_content = messages[-1].get("content", "").lower()
        analysis_keywords = ["аналіз", "analyze", "пошук", "search", "знайти", "find", "перевір", "check"]
        if any(kw in last_content for kw in analysis_keywords):
            return "analyze"

    return "skip_analysis"


def create_agent_graph():
    """
    Builds the Plan-and-Execute Agent Graph with E2E Analytics.

    Flow:
    planner -> (analyzer OR worker) -> critic -> (END or loop back)
    """
    workflow = StateGraph(AgentState)

    # Add nodes
    workflow.add_node("planner", planner_node)
    workflow.add_node("analyzer", analyzer_node)  # E2E multi-db analysis
    workflow.add_node("worker", worker_node)
    workflow.add_node("critic", critic_node)

    # Set entry point
    workflow.set_entry_point("planner")

    # Conditional branch after planner: analyze or work
    workflow.add_conditional_edges(
        "planner",
        should_analyze,
        {
            "analyze": "analyzer",
            "skip_analysis": "worker"
        }
    )

    # Static edges
    workflow.add_edge("analyzer", "worker")  # After analysis, worker processes results
    workflow.add_edge("worker", "critic")

    # Conditional edges from critic
    workflow.add_conditional_edges(
        "critic",
        should_continue,
        {
            "approve": END,          # Success
            "give_up": END,          # Failure
            "retry": "worker",       # Error recovery
            "next_step": "worker",   # Next item in plan
            "generate_cases": "worker"  # Generate cases from analysis
        }
    )

    return workflow.compile()


def create_analysis_graph():
    """
    Creates a simplified graph for pure E2E analysis tasks.
    Skips planning and goes straight to analysis.
    """
    workflow = StateGraph(AgentState)

    workflow.add_node("analyzer", analyzer_node)
    workflow.add_node("critic", critic_node)

    workflow.set_entry_point("analyzer")
    workflow.add_edge("analyzer", "critic")

    workflow.add_conditional_edges(
        "critic",
        should_continue,
        {
            "approve": END,
            "give_up": END,
            "retry": "analyzer",
            "next_step": END,
            "generate_cases": END
        }
    )

    return workflow.compile()
