from __future__ import annotations

import operator
from typing import Annotated, Any, Dict, List, Optional, TypedDict, Union


class ToolOutput(TypedDict):
    tool_name: str
    tool_input: str
    output: str
    timestamp: float

class PlanStep(TypedDict):
    id: str
    description: str
    status: str # pending, active, completed, failed
    result: str | None

class AgentMessage(TypedDict):
    role: str # user, assistant, system, tool
    content: str
    name: str | None

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
    results: list[dict[str, Any]]
    execution_time_ms: float
    error: str | None

class AnalysisResult(TypedDict):
    """Structured result of data analysis."""
    id: str
    type: str  # anomaly, pattern, correlation, risk
    confidence: float
    description: str
    data_points: list[dict[str, Any]]
    recommendations: list[str]

class CaseTemplate(TypedDict):
    """Template for generating a case from analysis."""
    title: str
    situation: str
    conclusion: str
    status: str  # КРИТИЧНО, УВАГА, БЕЗПЕЧНО
    risk_score: int
    sector: str  # GOV, BIZ, MED, SCI
    evidence: list[dict[str, Any]]
    ai_insight: str

class AgentState(TypedDict):
    """The state of the agent graph.
    Propagates through all nodes.
    Supports E2E analytics workflow: Data → Parse → Distribute → Analyze → Query → Response.
    """
    # Messages history with append-only semantics
    messages: Annotated[list[AgentMessage], operator.add]

    # Shared context (global variables)
    context: dict[str, Any]

    # Strategic Plan
    plan: list[PlanStep]

    # Current logical step description
    current_step: str

    # Structured tool outputs log
    tool_outputs: list[ToolOutput]

    # Generated artifacts (files, reports, etc.)
    artifacts: dict[str, Any]

    # V25 Inner Monologue / Thinking Process
    thinking: list[str] # Stream of thoughts

    # Errors if any
    error: str | None

    # Final answer/result
    final_response: str | None

    # ===== E2E ANALYTICS EXTENSIONS (v25.1) =====

    # Active data sources being analyzed
    data_sources: list[DataSourceInfo]

    # Multi-database query results
    query_results: dict[str, QueryResult]  # keyed by db name

    # Analysis findings
    analysis_results: list[AnalysisResult]

    # Generated cases from analysis
    generated_cases: list[CaseTemplate]

    # Cross-database fusion results
    fusion_results: dict[str, Any] | None

    # Processing statistics
    processing_stats: dict[str, Any]

    # User session context (tenant, permissions)
    session: dict[str, Any]

    # Real-time streaming updates
    stream_updates: Annotated[list[str], operator.add]
