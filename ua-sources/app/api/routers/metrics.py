"""
Prometheus Metrics Endpoint
Exposes metrics for monitoring and alerting
"""
from fastapi import APIRouter
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response
import time

router = APIRouter(tags=["Metrics"])

# ============================================================================
# METRICS DEFINITIONS
# ============================================================================

# Request Metrics
HTTP_REQUESTS_TOTAL = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "endpoint", "status"]
)

HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency",
    ["method", "endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Search Metrics
SEARCH_REQUESTS_TOTAL = Counter(
    "search_requests_total",
    "Total search requests",
    ["search_type"]  # hybrid, keyword, semantic
)

SEARCH_LATENCY_SECONDS = Histogram(
    "search_latency_seconds",
    "Search request latency",
    ["search_type"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0]
)

SEARCH_RESULTS_COUNT = Histogram(
    "search_results_count",
    "Number of search results returned",
    buckets=[0, 1, 5, 10, 20, 50, 100]
)

# ETL Metrics
ETL_TASKS_TOTAL = Counter(
    "etl_tasks_total",
    "Total ETL tasks executed",
    ["task_type", "status"]  # parser/processor/indexer, success/failure
)

ETL_TASK_DURATION_SECONDS = Histogram(
    "etl_task_duration_seconds",
    "ETL task duration",
    ["task_type"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0, 120.0, 300.0]
)

ETL_RECORDS_PROCESSED = Counter(
    "etl_records_processed_total",
    "Total records processed by ETL",
    ["stage"]  # staging, gold, indexed
)

# Database Metrics
DB_CONNECTIONS_ACTIVE = Gauge(
    "db_connections_active",
    "Active database connections"
)

DB_QUERY_DURATION_SECONDS = Histogram(
    "db_query_duration_seconds",
    "Database query duration",
    ["query_type"],  # select, insert, update
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0]
)

# LLM Metrics
LLM_REQUESTS_TOTAL = Counter(
    "llm_requests_total",
    "Total LLM API requests",
    ["provider", "model", "status"]
)

LLM_LATENCY_SECONDS = Histogram(
    "llm_latency_seconds",
    "LLM API call latency",
    ["provider"],
    buckets=[0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)

LLM_TOKENS_USED = Counter(
    "llm_tokens_used_total",
    "Total tokens used",
    ["provider", "direction"]  # input/output
)

# Index Metrics
OPENSEARCH_DOCS_TOTAL = Gauge(
    "opensearch_docs_total",
    "Total documents in OpenSearch"
)

QDRANT_VECTORS_TOTAL = Gauge(
    "qdrant_vectors_total",
    "Total vectors in Qdrant"
)

# Document Metrics
DOCUMENTS_TOTAL = Gauge(
    "documents_total",
    "Total documents in gold schema",
    ["category"]
)

STAGING_RECORDS_UNPROCESSED = Gauge(
    "staging_records_unprocessed",
    "Unprocessed records in staging"
)

# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint
    
    Scrape config for prometheus.yml:
    ```yaml
    scrape_configs:
      - job_name: 'predator-backend'
        static_configs:
          - targets: ['backend:8000']
        metrics_path: '/metrics'
    ```
    """
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@router.get("/metrics/summary")
async def metrics_summary():
    """
    Human-readable metrics summary
    """
    return {
        "search": {
            "total_requests": SEARCH_REQUESTS_TOTAL._metrics,
        },
        "etl": {
            "total_tasks": ETL_TASKS_TOTAL._metrics,
        },
        "info": "Use /metrics for Prometheus format"
    }


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def track_search_request(search_type: str, duration: float, results_count: int):
    """Track a search request"""
    SEARCH_REQUESTS_TOTAL.labels(search_type=search_type).inc()
    SEARCH_LATENCY_SECONDS.labels(search_type=search_type).observe(duration)
    SEARCH_RESULTS_COUNT.observe(results_count)


def track_etl_task(task_type: str, status: str, duration: float, records: int = 0):
    """Track an ETL task"""
    ETL_TASKS_TOTAL.labels(task_type=task_type, status=status).inc()
    ETL_TASK_DURATION_SECONDS.labels(task_type=task_type).observe(duration)
    if records > 0:
        ETL_RECORDS_PROCESSED.labels(stage=task_type).inc(records)


def track_llm_request(provider: str, model: str, status: str, latency: float, tokens: int = 0):
    """Track an LLM request"""
    LLM_REQUESTS_TOTAL.labels(provider=provider, model=model, status=status).inc()
    LLM_LATENCY_SECONDS.labels(provider=provider).observe(latency)
    if tokens > 0:
        LLM_TOKENS_USED.labels(provider=provider, direction="total").inc(tokens)


def update_index_metrics(opensearch_docs: int, qdrant_vectors: int):
    """Update index metrics"""
    OPENSEARCH_DOCS_TOTAL.set(opensearch_docs)
    QDRANT_VECTORS_TOTAL.set(qdrant_vectors)


def update_document_metrics(category: str, count: int):
    """Update document metrics by category"""
    DOCUMENTS_TOTAL.labels(category=category).set(count)


def update_staging_metrics(unprocessed: int):
    """Update staging metrics"""
    STAGING_RECORDS_UNPROCESSED.set(unprocessed)
