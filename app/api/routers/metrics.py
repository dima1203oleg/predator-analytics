from __future__ import annotations


"""Unified Prometheus Metrics Router for Predator Analytics
Consolidates all application metrics into a single registry and endpoint.
"""
import logging

from fastapi import APIRouter, Response
from prometheus_client import (
    CONTENT_TYPE_LATEST,
    REGISTRY,
    Counter,
    Gauge,
    Histogram,
    generate_latest,
)


# Import shared metrics from middleware to avoid duplication
try:
    from app.middleware import (
        ACTIVE_CONNECTIONS,
        HTTP_REQUEST_SIZE,
        HTTP_REQUESTS_TOTAL,
        HTTP_RESPONSE_SIZE,
        RATE_LIMIT_EXCEEDED,
    )
    from app.middleware import HTTP_REQUEST_DURATION as HTTP_REQUEST_DURATION_SECONDS
except ImportError:
    # Fallback if middleware is not yet in place or import path differs
    HTTP_REQUESTS_TOTAL = None
    HTTP_REQUEST_DURATION_SECONDS = None
    ACTIVE_CONNECTIONS = None

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Metrics"])


def _get_or_create_metric(cls, name, *args, **kwargs):
    """Utility to avoid duplicated metrics in registry."""
    if name in REGISTRY._names_to_collectors:
        return REGISTRY._names_to_collectors[name]
    return cls(name, *args, **kwargs)


# ============================================================================
# SEARCH METRICS
# ============================================================================

SEARCH_REQUESTS_TOTAL = _get_or_create_metric(
    Counter, "search_requests_total", "Total search requests", ["search_type", "status"]
)

SEARCH_LATENCY_SECONDS = _get_or_create_metric(
    Histogram,
    "search_latency_seconds",
    "Search request latency in seconds",
    ["search_type"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
)

SEARCH_RESULTS_COUNT = _get_or_create_metric(
    Histogram,
    "search_results_count",
    "Number of search results returned",
    ["search_type"],
    buckets=[0, 1, 5, 10, 20, 50, 100],
)

# ============================================================================
# LLM COUNCIL METRICS
# ============================================================================

LLM_COUNCIL_REQUESTS_TOTAL = _get_or_create_metric(
    Counter, "llm_council_requests_total", "Total LLM Council queries", ["peer_review_enabled"]
)

LLM_COUNCIL_LATENCY_SECONDS = _get_or_create_metric(
    Histogram,
    "llm_council_latency_seconds",
    "LLM Council deliberation latency",
    ["num_models"],
    buckets=[1, 5, 10, 15, 20, 30, 60],
)

LLM_COUNCIL_CONFIDENCE_SCORE = _get_or_create_metric(
    Histogram,
    "llm_council_confidence_score",
    "Confidence score of council decisions",
    buckets=[0.0, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0],
)

LLM_COUNCIL_PEER_REVIEWS = _get_or_create_metric(
    Histogram,
    "llm_council_peer_reviews",
    "Number of peer reviews conducted",
    buckets=[0, 2, 4, 6, 8, 12, 20],
)

LLM_COUNCIL_COST_USD = _get_or_create_metric(
    Counter, "llm_council_cost_usd", "Estimated cost in USD", ["model_provider"]
)

# ============================================================================
# MODEL & INFERENCE METRICS
# ============================================================================

MODEL_INFERENCE_TOTAL = _get_or_create_metric(
    Counter, "model_inference_total", "Total model inference requests", ["model_name", "status"]
)

MODEL_INFERENCE_LATENCY = _get_or_create_metric(
    Histogram,
    "model_inference_latency_seconds",
    "Model inference latency",
    ["model_name"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0],
)

MODEL_TOKENS_USED = _get_or_create_metric(
    Counter,
    "model_tokens_used_total",
    "Total tokens used",
    ["model_name", "type"],
)

# ============================================================================
# ETL & INGESTION METRICS
# ============================================================================

ETL_TASKS_TOTAL = _get_or_create_metric(
    Counter, "etl_tasks_total", "Total ETL tasks executed", ["task_type", "status"]
)

ETL_TASK_DURATION_SECONDS = _get_or_create_metric(
    Histogram,
    "etl_task_duration_seconds",
    "ETL task duration",
    ["task_type"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0],
)

ETL_DOCUMENTS_PROCESSED = _get_or_create_metric(
    Counter, "etl_documents_processed_total", "Total documents processed", ["source_type", "status"]
)

ETL_RECORDS_PROCESSED = _get_or_create_metric(
    Counter, "etl_records_processed_total", "Total records processed by ETL", ["stage"]
)

# ============================================================================
# INFRASTRUCTURE METRICS
# ============================================================================

DB_QUERY_DURATION_SECONDS = _get_or_create_metric(
    Histogram,
    "db_query_duration_seconds",
    "Database query duration",
    ["query_type"],
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0],
)

DB_CONNECTIONS_ACTIVE = _get_or_create_metric(
    Gauge, "db_connections_active", "Active database connections"
)

CACHE_HITS_TOTAL = _get_or_create_metric(Counter, "cache_hits_total", "Cache hits", ["cache_type"])

CACHE_MISSES_TOTAL = _get_or_create_metric(
    Counter, "cache_misses_total", "Cache misses", ["cache_type"]
)

# ============================================================================
# SYSTEM STATE METRICS
# ============================================================================

OPENSEARCH_DOCS_TOTAL = _get_or_create_metric(
    Gauge, "opensearch_docs_total", "Total documents in OpenSearch"
)

QDRANT_VECTORS_TOTAL = _get_or_create_metric(
    Gauge, "qdrant_vectors_total", "Total vectors in Qdrant"
)

DOCUMENTS_TOTAL = _get_or_create_metric(
    Gauge, "documents_total", "Total documents in gold schema", ["category"]
)

STAGING_RECORDS_UNPROCESSED = _get_or_create_metric(
    Gauge, "staging_records_unprocessed", "Unprocessed records in staging"
)

# ============================================================================
# DECISION INTELLIGENCE METRICS
# ============================================================================

DECISION_REQUESTS_TOTAL = _get_or_create_metric(
    Counter,
    "predator_decision_requests_total",
    "Total Decision Intelligence API requests",
    ["endpoint", "status"]
)

DECISION_LATENCY_SECONDS = _get_or_create_metric(
    Histogram,
    "predator_decision_latency_seconds",
    "Decision Intelligence API latency",
    ["endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

DECISION_CACHE_HITS = _get_or_create_metric(
    Counter,
    "predator_decision_cache_hits_total",
    "Decision Intelligence cache hits",
    ["endpoint"]
)

DECISION_RISK_SCORES = _get_or_create_metric(
    Histogram,
    "predator_decision_risk_scores",
    "Distribution of CERS risk scores",
    ["analysis_type"],
    buckets=[0, 25, 50, 75, 100]
)

# ============================================================================
# ENDPOINTS
# ============================================================================


@router.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint.
    Scrapes the entire default REGISTRY which includes:
    - Custom app metrics defined here
    - Middleware metrics (requests, latency, etc.)
    - Default Python/Process metrics.
    """
    return Response(content=generate_latest(REGISTRY), media_type=CONTENT_TYPE_LATEST)


@router.get("/metrics/summary")
async def metrics_summary():
    """Human-readable metrics summary (v45 compliant)."""
    return {"status": "active", "registry": "default", "endpoint": "/metrics"}


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================


class MetricsHelper:
    """Consolidated helper for application instrumentation."""

    @staticmethod
    def track_search(search_type: str, duration: float, results_count: int, success: bool = True):
        status = "success" if success else "error"
        SEARCH_REQUESTS_TOTAL.labels(search_type=search_type, status=status).inc()
        SEARCH_LATENCY_SECONDS.labels(search_type=search_type).observe(duration)
        SEARCH_RESULTS_COUNT.labels(search_type=search_type).observe(results_count)

    @staticmethod
    def track_etl_task(task_type: str, status: str, duration: float, records: int = 0):
        ETL_TASKS_TOTAL.labels(task_type=task_type, status=status).inc()
        ETL_TASK_DURATION_SECONDS.labels(task_type=task_type).observe(duration)
        if records > 0:
            ETL_RECORDS_PROCESSED.labels(stage=task_type).inc(records)
            ETL_DOCUMENTS_PROCESSED.labels(source_type=task_type, status=status).inc(records)

    @staticmethod
    def track_llm_council(
        num_models: int,
        latency: float,
        confidence: float,
        num_peer_reviews: int,
        peer_review_enabled: bool,
        cost_estimates: dict | None = None,
    ):
        LLM_COUNCIL_REQUESTS_TOTAL.labels(peer_review_enabled=str(peer_review_enabled)).inc()
        LLM_COUNCIL_LATENCY_SECONDS.labels(num_models=str(num_models)).observe(latency)
        LLM_COUNCIL_CONFIDENCE_SCORE.observe(confidence)
        LLM_COUNCIL_PEER_REVIEWS.observe(num_peer_reviews)
        if cost_estimates:
            for provider, cost in cost_estimates.items():
                LLM_COUNCIL_COST_USD.labels(model_provider=provider).inc(cost)

    @staticmethod
    def track_model_inference(
        model_name: str, latency: float, success: bool, tokens: dict | None = None
    ):
        status = "success" if success else "error"
        MODEL_INFERENCE_TOTAL.labels(model_name=model_name, status=status).inc()
        if success:
            MODEL_INFERENCE_LATENCY.labels(model_name=model_name).observe(latency)
            if tokens:
                if "prompt" in tokens:
                    MODEL_TOKENS_USED.labels(model_name=model_name, type="prompt").inc(
                        tokens["prompt"]
                    )
                if "completion" in tokens:
                    MODEL_TOKENS_USED.labels(model_name=model_name, type="completion").inc(
                        tokens["completion"]
                    )

    @staticmethod
    def track_cache(cache_type: str, hit: bool):
        if hit:
            CACHE_HITS_TOTAL.labels(cache_type=cache_type).inc()
        else:
            CACHE_MISSES_TOTAL.labels(cache_type=cache_type).inc()

    @staticmethod
    def track_decision_request(endpoint: str, duration: float, success: bool = True, cached: bool = False, risk_score: int | None = None):
        """Track Decision Intelligence API request metrics."""
        status = "success" if success else "error"
        DECISION_REQUESTS_TOTAL.labels(endpoint=endpoint, status=status).inc()
        DECISION_LATENCY_SECONDS.labels(endpoint=endpoint).observe(duration)
        if cached:
            DECISION_CACHE_HITS.labels(endpoint=endpoint).inc()
        if risk_score is not None:
            DECISION_RISK_SCORES.labels(analysis_type=endpoint).observe(risk_score)


# Shared singleton for backend-wide use
metrics_helper = MetricsHelper()


# Legacy / Alias Functions for Backward Compatibility
def track_search_request(search_type: str, duration: float, results_count: int):
    """Wrapper for MetricsHelper.track_search (Fixes ImportError in search.py)."""
    MetricsHelper.track_search(search_type, duration, results_count)


def track_model_usage(model_name: str, latency: float, success: bool, tokens: dict | None = None):
    """Wrapper for MetricsHelper.track_model_inference."""
    MetricsHelper.track_model_inference(model_name, latency, success, tokens)
