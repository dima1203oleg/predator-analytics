"""
Predator Analytics - OpenTelemetry Integration (v28-S)
Centralized setup for distributed tracing and metrics.
"""
import os
from opentelemetry import trace, metrics
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import OTLPMetricExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from libs.core.config import settings
from libs.core.structured_logger import get_logger

logger = get_logger("predator.otel")

def setup_otel(app, service_name: str):
    """
    Initialize OpenTelemetry for a FastAPI application.
    """
    otlp_endpoint = settings.OTLP_ENDPOINT

    # 1. Define Resource
    resource = Resource.create({
        "service.name": service_name,
        "environment": os.getenv("ENVIRONMENT", "dev"),
    })

    # 2. Setup Tracing
    try:
        tracer_provider = TracerProvider(resource=resource)
        span_exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        tracer_provider.add_span_processor(BatchSpanProcessor(span_exporter))
        trace.set_tracer_provider(tracer_provider)

        # Instrument FastAPI
        FastAPIInstrumentor.instrument_app(app)

        # Instrument Database (Async SQLAlchemy)
        SQLAlchemyInstrumentor().instrument()

        # Instrument HTTP Clients
        HTTPXClientInstrumentor().instrument()

        logger.info(f"🕸️ OpenTelemetry Tracing initialized for {service_name} (OTLP: {otlp_endpoint})")
    except Exception as e:
        logger.warning(f"⚠️ OTEL Tracing setup failed: {e}")

    # 3. Setup Metrics (OTLP)
    try:
        metric_exporter = OTLPMetricExporter(endpoint=otlp_endpoint, insecure=True)
        reader = PeriodicExportingMetricReader(metric_exporter)
        meter_provider = MeterProvider(resource=resource, metric_readers=[reader])
        metrics.set_meter_provider(meter_provider)

        logger.info(f"📊 OpenTelemetry Metrics initialized for {service_name}")
    except Exception as e:
        logger.warning(f"⚠️ OTEL Metrics setup failed: {e}")

def get_tracer(name: str):
    return trace.get_tracer(name)

def get_meter(name: str):
    return metrics.get_meter(name)
