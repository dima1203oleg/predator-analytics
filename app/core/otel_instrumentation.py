"""OpenTelemetry Auto-Instrumentation v63.0-ELITE.

Автоматичне трасування для FastAPI + Kafka + SQLAlchemy:
  - FastAPI auto-instrumentation (opentelemetry-instrument)
  - Kafka producer/consumer span links
  - SQLAlchemy query tracing
  - eBPF profiling через Pixie (zero-code)
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    pass

settings = get_settings()
logger = logging.getLogger(__name__)


def setup_opentelemetry(
    service_name: str = "predator-core-api",
    otlp_endpoint: str = "http://predator-otel-collector:4317",
) -> Any:
    """Налаштовує OpenTelemetry для FastAPI застосунку.

    Викликати один раз при старті застосунку.
    """
    try:
        from opentelemetry import trace
        from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
        from opentelemetry.instrumentation.redis import RedisInstrumentor
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
        from opentelemetry.instrumentation.httpx import HTTPXInstrumentor
        from opentelemetry.instrumentation.aiokafka import AioKafkaInstrumentor
        from opentelemetry.sdk.resources import Resource, SERVICE_NAME
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor

        # Resource
        resource = Resource.create({
            SERVICE_NAME: service_name,
            "deployment.environment": settings.ENVIRONMENT,
            "service.version": settings.APP_VERSION,
        })

        # Tracer Provider
        provider = TracerProvider(resource=resource)

        # OTLP Exporter
        otlp_exporter = OTLPSpanExporter(
            endpoint=otlp_endpoint,
            insecure=True,
        )
        provider.add_span_processor(
            BatchSpanProcessor(otlp_exporter)
        )

        trace.set_tracer_provider(provider)

        logger.info(
            "OpenTelemetry налаштовано: service=%s, endpoint=%s",
            service_name, otlp_endpoint,
        )

        return provider

    except ImportError as e:
        logger.warning("OpenTelemetry не встановлено: %s. Трасування вимкнено.", e)
        return None


def instrument_app(app: Any) -> None:
    """Інструментує FastAPI застосунок."""
    try:
        from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

        FastAPIInstrumentor.instrument_app(
            app,
            excluded_urls="health,ready,metrics",
            tracer_provider=trace.get_tracer_provider(),
        )
        logger.info("FastAPI auto-instrumentation увімкнено.")
    except ImportError:
        logger.debug("FastAPI instrumentation skipped.")
    except Exception:
        logger.warning("FastAPI instrumentation failed", exc_info=True)


def instrument_sqlalchemy(engine: Any) -> None:
    """Інструментує SQLAlchemy engine."""
    try:
        from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

        SQLAlchemyInstrumentor().instrument(
            engine=engine.sync_engine,
            tracer_provider=trace.get_tracer_provider(),
        )
        logger.info("SQLAlchemy instrumentation увімкнено.")
    except ImportError:
        logger.debug("SQLAlchemy instrumentation skipped.")
    except Exception:
        logger.warning("SQLAlchemy instrumentation failed", exc_info=True)


def instrument_redis() -> None:
    """Інструментує Redis."""
    try:
        from opentelemetry.instrumentation.redis import RedisInstrumentor

        RedisInstrumentor().instrument()
        logger.info("Redis instrumentation увімкнено.")
    except ImportError:
        logger.debug("Redis instrumentation skipped.")
    except Exception:
        logger.warning("Redis instrumentation failed", exc_info=True)


def instrument_kafka() -> None:
    """Інструментує aiokafka producer/consumer."""
    try:
        from opentelemetry.instrumentation.aiokafka import AioKafkaInstrumentor

        AioKafkaInstrumentor().instrument()
        logger.info("Kafka instrumentation увімкнено.")
    except ImportError:
        logger.debug("Kafka instrumentation skipped.")
    except Exception:
        logger.warning("Kafka instrumentation failed", exc_info=True)


def instrument_httpx() -> None:
    """Інструментує HTTPX (зовнішні API виклики)."""
    try:
        from opentelemetry.instrumentation.httpx import HTTPXInstrumentor

        HTTPXInstrumentor().instrument()
        logger.info("HTTPX instrumentation увімкнено.")
    except ImportError:
        logger.debug("HTTPX instrumentation skipped.")
    except Exception:
        logger.warning("HTTPX instrumentation failed", exc_info=True)


# ── Custom Span Helpers ──────────────────────────────────────


def create_manual_span(
    name: str,
    attributes: dict[str, Any] | None = None,
    kind: str = "INTERNAL",
) -> Any:
    """Створює ручний span для кастомних операцій."""
    try:
        from opentelemetry import trace
        from opentelemetry.trace import SpanKind

        kind_map = {
            "INTERNAL": SpanKind.INTERNAL,
            "SERVER": SpanKind.SERVER,
            "CLIENT": SpanKind.CLIENT,
            "PRODUCER": SpanKind.PRODUCER,
            "CONSUMER": SpanKind.CONSUMER,
        }

        tracer = trace.get_tracer(__name__)
        span = tracer.start_span(name, kind=kind_map.get(kind, SpanKind.INTERNAL))

        if attributes:
            for key, value in attributes.items():
                span.set_attribute(key, value)

        return span
    except ImportError:
        return None


# ── eBPF Profiling (Pixie) ───────────────────────────────────


def setup_ebpf_profiling() -> None:
    """Налаштовує eBPF profiling через Pixie (zero-code).

    Pixie автоматично збирає:
      - CPU profiling (flame graphs)
      - Network traffic (HTTP/gRPC)
      - Memory allocation
      - Application CPU time per endpoint
    """
    logger.info(
        "eBPF profiling через Pixie: автоматично (zero-code). "
        "Переконайтесь що Pixie встановлено в кластері."
    )
