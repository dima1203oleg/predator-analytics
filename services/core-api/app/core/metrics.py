"""Prometheus Metrics — PREDATOR Analytics v55.2-SM-EXTENDED.

Реалізація згідно TZ §2.7.2.
"""
from collections.abc import Callable
from functools import wraps
import time

from prometheus_client import Counter, Gauge, Histogram

# ======================== API METRICS ========================

api_requests_total = Counter(
    "api_requests_total",
    "Загальна кількість API запитів",
    ["method", "endpoint", "status"]
)

api_request_duration_seconds = Histogram(
    "api_request_duration_seconds",
    "Латентність API запитів",
    ["method", "endpoint"],
    buckets=(0.1, 0.5, 1.0, 2.5, 5.0, 10.0)
)

# ======================== INGESTION METRICS ========================

ingestion_records_processed = Counter(
    "ingestion_records_processed_total",
    "Загальна кількість оброблених записів",
    ["job_id", "status"]
)

ingestion_job_duration_seconds = Histogram(
    "ingestion_job_duration_seconds",
    "Тривалість обробки job",
    buckets=(60, 300, 600, 1800, 3600)
)

ingestion_jobs_active = Gauge(
    "ingestion_jobs_active",
    "Кількість активних ingestion jobs"
)

# ======================== DATABASE METRICS ========================

db_query_duration_seconds = Histogram(
    "db_query_duration_seconds",
    "Латентність запитів до БД",
    ["query_type"],
    buckets=(0.01, 0.05, 0.1, 0.5, 1.0, 5.0)
)

db_connections_active = Gauge(
    "db_connections_active",
    "Кількість активних з'єднань з БД"
)

# ======================== RISK CALCULATION METRICS ========================

cers_calculation_duration_seconds = Histogram(
    "cers_calculation_duration_seconds",
    "Час розрахунку CERS",
    buckets=(0.1, 0.5, 1.0, 5.0)
)

risk_scores_pending = Gauge(
    "risk_scores_pending",
    "Кількість очікуючих розрахунків ризику"
)

risk_scores_calculated = Counter(
    "risk_scores_calculated_total",
    "Загальна кількість розрахованих ризик-скорів",
    ["entity_type", "risk_level"]
)

# ======================== GRAPH METRICS ========================

graph_query_duration_seconds = Histogram(
    "graph_query_duration_seconds",
    "Латентність запитів до Neo4j",
    ["query_type"],
    buckets=(0.1, 0.5, 1.0, 2.0)
)

graph_nodes_total = Gauge(
    "graph_nodes_total",
    "Загальна кількість вузлів у графі",
    ["node_type"]
)

# ======================== AI/COPILOT METRICS ========================

copilot_requests_total = Counter(
    "copilot_requests_total",
    "Загальна кількість запитів до Copilot",
    ["session_type"]
)

copilot_tokens_used = Counter(
    "copilot_tokens_used_total",
    "Загальна кількість використаних токенів",
    ["model"]
)

copilot_response_duration_seconds = Histogram(
    "copilot_response_duration_seconds",
    "Час відповіді Copilot",
    buckets=(1.0, 2.0, 5.0, 10.0, 30.0)
)

# ======================== ALERTS METRICS ========================

alerts_triggered_total = Counter(
    "alerts_triggered_total",
    "Загальна кількість спрацьованих алертів",
    ["alert_type", "severity"]
)

alerts_delivery_status = Counter(
    "alerts_delivery_status_total",
    "Статус доставки алертів",
    ["channel", "status"]
)

# ======================== AUTH METRICS ========================

auth_login_attempts = Counter(
    "auth_login_attempts_total",
    "Кількість спроб логіну",
    ["status"]
)

auth_active_sessions = Gauge(
    "auth_active_sessions",
    "Кількість активних сесій"
)


# ======================== ДЕКОРАТОРИ ========================

def track_request_metrics(endpoint: str):
    """Декоратор для відстеження метрик API запитів."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                status = "success"
                return result
            except Exception:
                status = "error"
                raise
            finally:
                duration = time.time() - start_time
                api_requests_total.labels(
                    method="POST",
                    endpoint=endpoint,
                    status=status
                ).inc()
                api_request_duration_seconds.labels(
                    method="POST",
                    endpoint=endpoint
                ).observe(duration)
        return wrapper
    return decorator


def track_db_query(query_type: str):
    """Декоратор для відстеження метрик запитів до БД."""
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                return await func(*args, **kwargs)
            finally:
                duration = time.time() - start_time
                db_query_duration_seconds.labels(query_type=query_type).observe(duration)
        return wrapper
    return decorator
