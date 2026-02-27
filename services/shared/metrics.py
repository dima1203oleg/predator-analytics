
"""
Module: metrics
Component: shared
Predator Analytics v45.1
Section 3.5 of Spec.
"""
from prometheus_client import Counter, Histogram, Gauge

# LLM Metrics
llm_requests_total = Counter(
    "predator_llm_requests_total",
    "Total LLM requests",
    ["provider", "model", "task_type", "cache_hit"]
)
llm_latency_seconds = Histogram(
    "predator_llm_latency_seconds",
    "LLM request latency",
    ["provider", "model"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0, 60.0]
)
llm_fallback_total = Counter(
    "predator_llm_fallback_total",
    "LLM fallback events",
    ["from_provider", "to_provider"]
)

# RTB Metrics
rtb_decisions_total = Counter(
    "predator_rtb_decisions_total",
    "Total RTB decisions",
    ["rule_id", "decision", "autonomy_level"]
)
rtb_decision_latency = Histogram(
    "predator_rtb_decision_latency_seconds",
    "RTB decision latency",
    ["rule_id"]
)

# ML Training & Drift
model_accuracy = Gauge(
    "predator_model_accuracy",
    "Current model accuracy",
    ["model_id", "stage"]
)
model_drift_score = Gauge(
    "predator_model_drift_score",
    "Data drift score",
    ["model_id", "feature"]
)
training_jobs_total = Counter(
    "predator_training_jobs_total",
    "Training jobs",
    ["framework", "status"]
)

# API Metrics
api_requests_total = Counter(
    "predator_api_requests_total",
    "API requests",
    ["endpoint", "method", "status_code"]
)
api_latency_seconds = Histogram(
    "predator_api_latency_seconds",
    "API request latency",
    ["endpoint"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0]
)
