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

class DataSourceInfo(TypedDict):
    """Information about a data source used in analysis."""
    id: str
    name: str
    type: str  # FILE, API, DATABASE
    records_count: int
    status: str  # ONLINE, OFFLINE, PROCESSING

class QueryResult(TypedDict):
    """Result from querying a specific database."""
    database: str  # postgresql, opensearch, qdrant
    query: str
    results: List[Dict[str, Any]]
    execution_time_ms: float
    error: Optional[str]

class AnalysisResult(TypedDict):
    """Structured result of data analysis."""
    id: str
    type: str  # anomaly, pattern, correlation, risk
    confidence: float
    description: str
    data_points: List[Dict[str, Any]]
    recommendations: List[str]

class CaseTemplate(TypedDict):
    """Template for generating a case from analysis."""
    title: str
    situation: str
    conclusion: str
    status: str  # КРИТИЧНО, УВАГА, БЕЗПЕЧНО
    risk_score: int
    sector: str  # GOV, BIZ, MED, SCI
    evidence: List[Dict[str, Any]]
    ai_insight: str

class AgentState(TypedDict):
    """
    The state of the agent graph.
    Propagates through all nodes.
    Supports E2E analytics workflow: Data → Parse → Distribute → Analyze → Query → Response
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

    # ===== E2E ANALYTICS EXTENSIONS (v25.1) =====

    # Active data sources being analyzed
    data_sources: List[DataSourceInfo]

    # Multi-database query results
    query_results: Dict[str, QueryResult]  # keyed by db name

    # Analysis findings
    analysis_results: List[AnalysisResult]

    # Generated cases from analysis
    generated_cases: List[CaseTemplate]

    # Cross-database fusion results
    fusion_results: Optional[Dict[str, Any]]

    # Processing statistics
    processing_stats: Dict[str, Any]

    # User session context (tenant, permissions)
    session: Dict[str, Any]

    # Real-time streaming updates
    stream_updates: Annotated[List[str], operator.add]
