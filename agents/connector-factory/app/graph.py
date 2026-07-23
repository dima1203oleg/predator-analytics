from langgraph.graph import StateGraph, END
from typing import TypedDict, Optional, Dict, Any

from app.models.schemas import FactoryState
from app.agents.discovery_agent import DiscoveryAgent
from app.agents.profiling_agent import ProfilingAgent
from app.agents.coder_agent import CoderAgent
from app.agents.qa_agent import QAAgent

# Define TypedDict for LangGraph state that maps to FactoryState
class AgentState(TypedDict):
    source: Dict[str, Any]
    profiling: Optional[Dict[str, Any]]
    artifacts: Optional[Dict[str, Any]]
    test_report: Optional[Dict[str, Any]]
    status: str
    error_message: Optional[str]

def create_factory_graph():
    # Initialize agents
    discovery = DiscoveryAgent()
    profiler = ProfilingAgent()
    coder = CoderAgent()
    qa = QAAgent()

    # Create Graph
    workflow = StateGraph(AgentState)

    # Add Nodes
    workflow.add_node("discovery", discovery.run)
    workflow.add_node("profiling", profiler.run)
    workflow.add_node("coding", coder.run)
    workflow.add_node("testing", qa.run)

    # Define Edges
    workflow.set_entry_point("discovery")
    
    workflow.add_edge("discovery", "profiling")
    workflow.add_edge("profiling", "coding")
    workflow.add_edge("coding", "testing")
    
    def route_testing(state: AgentState):
        retry_count = state.get("test_report", {}).get("retry_count", 0) if state.get("test_report") else 0
        if state.get("status") == "failed" and retry_count < 3:
            return "coding"
        return END

    workflow.add_conditional_edges(
        "testing",
        route_testing,
        {
            "coding": "coding",
            END: END
        }
    )

    # Compile
    return workflow.compile()
