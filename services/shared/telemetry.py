
"""
Module: telemetry
Component: shared
Predator Analytics v25.1
"""
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

def setup_telemetry(service_name: str):
    """
    Standardizes OpenTelemetry tracing.
    Exports to Tempo / Phoenix.
    """
    resource = Resource.create({"service.name": service_name, "version": "25.1"})
    provider = TracerProvider(resource=resource)
    
    otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://predator-analytics-tempo:4317")
    
    try:
        exporter = OTLPSpanExporter(endpoint=otlp_endpoint, insecure=True)
        processor = BatchSpanProcessor(exporter)
        provider.add_span_processor(processor)
    except Exception:
        # Fallback to console or no-op if exporter fails
        pass

    trace.set_tracer_provider(provider)
    return trace.get_tracer(service_name)
