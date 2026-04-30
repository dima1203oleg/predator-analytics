from __future__ import annotations

"""Prometheus Metrics Exporter for SuperIntelligence Orchestrator v45.0.

Exposes key AI metrics for monitoring:
- Request counts and latencies
- Agent status and performance
- Self-healing events
- LLM router health
- Self-improvement cycle status
"""

from functools import wraps
import logging
import time

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Gauge, Histogram, Info, generate_latest

logger = logging.getLogger(__name__)

# =============================================================================
# METRIC DEFINITIONS
# =============================================================================

# Request Metrics
AI_REQUESTS_TOTAL = Counter(
    "predator_ai_requests_total", "Total number of AI requests processed", ["mode", "status"]
)

AI_REQUEST_LATENCY = Histogram(
    "predator_ai_request_latency_seconds",
    "AI request latency in seconds",
    ["mode"],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0, 30.0, 60.0],
)

AI_REQUEST_TOKENS = Counter(
    "predator_ai_tokens_total",
    "Total tokens processed",
    ["direction"],  # input, output
)

# Agent Metrics
AI_AGENTS_STATUS = Gauge(
    "predator_ai_agent_status",
    "Current status of AI agents (1=healthy, 0=error)",
    ["agent_type", "agent_name"],
)

AI_AGENT_TASKS = Counter(
    "predator_ai_agent_tasks_total", "Total tasks processed by agents", ["agent_type", "status"]
)

AI_AGENT_LATENCY = Histogram(
    "predator_ai_agent_latency_seconds",
    "Agent processing latency",
    ["agent_type"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

# LLM Router Metrics
LLM_ROUTER_REQUESTS = Counter(
    "predator_llm_router_requests_total", "LLM router requests", ["provider", "status"]
)

LLM_ROUTER_LATENCY = Histogram(
    "predator_llm_router_latency_seconds",
    "LLM router latency per provider",
    ["provider"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
)

LLM_ROUTER_FALLBACKS = Counter(
    "predator_llm_router_fallbacks_total",
    "Number of LLM router fallbacks",
    ["from_provider", "to_provider"],
)

# Self-Healing Metrics
HEALING_EVENTS = Counter(
    "predator_healing_events_total",
    "Self-healing events triggered",
    ["component", "strategy", "status"],
)

HEALING_RECOVERY_TIME = Histogram(
    "predator_healing_recovery_seconds",
    "Time to recover from failures",
    ["component"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
)

SYSTEM_HEALTH_STATUS = Gauge(
    "predator_system_health_status",
    "System health status (3=healthy, 2=degraded, 1=recovering, 0=critical)",
)

# Self-Improvement Metrics
SELF_IMPROVEMENT_CYCLES = Counter(
    "predator_self_improvement_cycles_total",
    "Self-improvement cycles executed",
    ["stage", "status"],
)

SELF_IMPROVEMENT_PERFORMANCE = Gauge(
    "predator_self_improvement_score", "Current self-improvement performance score", ["metric"]
)

# Orchestrator Info
ORCHESTRATOR_INFO = Info("predator_orchestrator", "SuperIntelligence Orchestrator information")


# =============================================================================
# METRICS HELPER FUNCTIONS
# =============================================================================


def track_request(mode: str):
    """Decorator to track AI request metrics."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            status = "success"
            try:
                return await func(*args, **kwargs)
            except Exception:
                status = "error"
                raise
            finally:
                duration = time.time() - start
                AI_REQUESTS_TOTAL.labels(mode=mode, status=status).inc()
                AI_REQUEST_LATENCY.labels(mode=mode).observe(duration)

        return wrapper

    return decorator


def track_agent(agent_type: str):
    """Decorator to track agent metrics."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            status = "success"
            try:
                return await func(*args, **kwargs)
            except Exception:
                status = "error"
                raise
            finally:
                duration = time.time() - start
                AI_AGENT_TASKS.labels(agent_type=agent_type, status=status).inc()
                AI_AGENT_LATENCY.labels(agent_type=agent_type).observe(duration)

        return wrapper

    return decorator


def track_llm_call(provider: str):
    """Decorator to track LLM provider metrics."""

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start = time.time()
            status = "success"
            try:
                return await func(*args, **kwargs)
            except Exception:
                status = "error"
                raise
            finally:
                duration = time.time() - start
                LLM_ROUTER_REQUESTS.labels(provider=provider, status=status).inc()
                LLM_ROUTER_LATENCY.labels(provider=provider).observe(duration)

        return wrapper

    return decorator


def record_healing_event(component: str, strategy: str, success: bool, recovery_time: float):
    """Record a self-healing event."""
    status = "success" if success else "failed"
    HEALING_EVENTS.labels(component=component, strategy=strategy, status=status).inc()
    if success:
        HEALING_RECOVERY_TIME.labels(component=component).observe(recovery_time)


def update_system_health(status: str):
    """Update system health gauge."""
    status_map = {"healthy": 3, "degraded": 2, "recovering": 1, "critical": 0}
    SYSTEM_HEALTH_STATUS.set(status_map.get(status, 0))


def update_agent_status(agent_type: str, agent_name: str, is_healthy: bool):
    """Update agent status gauge."""
    AI_AGENTS_STATUS.labels(agent_type=agent_type, agent_name=agent_name).set(
        1 if is_healthy else 0
    )


def record_tokens(input_tokens: int, output_tokens: int):
    """Record token counts."""
    AI_REQUEST_TOKENS.labels(direction="input").inc(input_tokens)
    AI_REQUEST_TOKENS.labels(direction="output").inc(output_tokens)


def record_llm_fallback(from_provider: str, to_provider: str):
    """Record LLM router fallback."""
    LLM_ROUTER_FALLBACKS.labels(from_provider=from_provider, to_provider=to_provider).inc()


def record_self_improvement(stage: str, success: bool, score: float | None = None):
    """Record self-improvement cycle metrics."""
    status = "success" if success else "failed"
    SELF_IMPROVEMENT_CYCLES.labels(stage=stage, status=status).inc()
    if score is not None:
        SELF_IMPROVEMENT_PERFORMANCE.labels(metric="overall").set(score)


def init_orchestrator_info(version: str, agents: list, llm_providers: list):
    """Initialize orchestrator info metric."""
    ORCHESTRATOR_INFO.info(
        {"version": version, "agents": ",".join(agents), "llm_providers": ",".join(llm_providers)}
    )


# =============================================================================
# METRICS ENDPOINT
# =============================================================================


def get_metrics() -> bytes:
    """Generate Prometheus metrics output."""
    return generate_latest()


def get_content_type() -> str:
    """Get Prometheus content type."""
    return CONTENT_TYPE_LATEST


# =============================================================================
# METRICS COLLECTOR CLASS
# =============================================================================


class AIMetricsCollector:
    """Centralized metrics collector for SuperIntelligence Orchestrator."""

    def __init__(self):
        self.initialized = False

    def initialize(self, orchestrator):
        """Initialize metrics with orchestrator reference."""
        if self.initialized:
            return

        try:
            # Set orchestrator info
            agents = (
                [agent.value for agent in orchestrator.agents]
                if hasattr(orchestrator, "agents")
                else []
            )
            llm_providers = ["groq", "gemini", "ollama"]
            init_orchestrator_info("v45.0", agents, llm_providers)

            # Set initial agent statuses
            if hasattr(orchestrator, "agents"):
                for agent_type, agent in orchestrator.agents.items():
                    update_agent_status(agent_type.value, agent.name, agent.state.status != "error")

            # Set initial health
            if hasattr(orchestrator, "healing"):
                update_system_health(orchestrator.healing.health.value)

            self.initialized = True
            logger.info("AI Metrics Collector initialized")

        except Exception as e:
            logger.exception(f"Failed to initialize metrics: {e}")

    def update_from_orchestrator(self, orchestrator):
        """Update all metrics from orchestrator state."""
        try:
            # Update agent statuses
            if hasattr(orchestrator, "agents"):
                for agent_type, agent in orchestrator.agents.items():
                    update_agent_status(agent_type.value, agent.name, agent.state.status != "error")

            # Update health status
            if hasattr(orchestrator, "healing"):
                update_system_health(orchestrator.healing.health.value)

            # Update performance metrics
            if hasattr(orchestrator, "metrics"):
                total = orchestrator.metrics.get("total_requests", 0)
                success = orchestrator.metrics.get("successful_requests", 0)
                if total > 0:
                    score = success / total
                    SELF_IMPROVEMENT_PERFORMANCE.labels(metric="success_rate").set(score)

                latency = orchestrator.metrics.get("avg_latency_ms", 0)
                SELF_IMPROVEMENT_PERFORMANCE.labels(metric="avg_latency_ms").set(latency)

        except Exception as e:
            logger.exception(f"Failed to update metrics: {e}")


# Global collector instance
metrics_collector = AIMetricsCollector()
