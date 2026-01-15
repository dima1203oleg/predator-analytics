"""
📊 Structured Logging для Predator Analytics v25

Production-grade logging з JSON output для легкого parsing в
ElasticSearch, Loki, CloudWatch та інших log aggregators.

Features:
- JSON structured output
- Correlation IDs для distributed tracing
- Automatic context injection (service, version, environment)
- Performance metrics logging
- Error tracking з stack traces
"""

import structlog
import logging
import sys
from typing import Any, Dict, Optional
from datetime import datetime
import uuid
import os


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SERVICE_NAME = os.getenv("SERVICE_NAME", "predator-api")
SERVICE_VERSION = os.getenv("APP_VERSION", "25.0.0")


# ═══════════════════════════════════════════════════════════════════════════
# PROCESSORS
# ═══════════════════════════════════════════════════════════════════════════

def add_service_context(logger, method_name, event_dict):
    """Add service metadata to every log"""
    event_dict["service"] = SERVICE_NAME
    event_dict["version"] = SERVICE_VERSION
    event_dict["environment"] = ENVIRONMENT
    return event_dict


def add_correlation_id(logger, method_name, event_dict):
    """Add correlation ID if not present"""
    if "correlation_id" not in event_dict:
        event_dict["correlation_id"] = str(uuid.uuid4())
    return event_dict


def add_otel_trace_ids(logger, method_name, event_dict):
    """Add OpenTelemetry trace and span IDs if available"""
    try:
        from opentelemetry import trace
        span = trace.get_current_span()
        if span.is_recording():
            ctx = span.get_span_context()
            if ctx.is_valid:
                event_dict["trace_id"] = format(ctx.trace_id, "032x")
                event_dict["span_id"] = format(ctx.span_id, "016x")
    except ImportError:
        pass
    return event_dict


def add_timestamp(logger, method_name, event_dict):
    """Add ISO8601 timestamp"""
    event_dict["timestamp"] = datetime.utcnow().isoformat() + "Z"
    return event_dict


def rename_event_key(logger, method_name, event_dict):
    """Rename 'event' to 'message' for better compatibility"""
    if "event" in event_dict:
        event_dict["message"] = event_dict.pop("event")
    return event_dict


# ═══════════════════════════════════════════════════════════════════════════
# SETUP
# ═══════════════════════════════════════════════════════════════════════════

def setup_structured_logging(
    log_level: str = LOG_LEVEL,
    use_json: bool = True
) -> structlog.BoundLogger:
    """
    Configure structured logging for production

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR)
        use_json: Output as JSON (True) or colored console (False)

    Returns:
        Configured logger instance

    Usage:
        logger = setup_structured_logging()
        logger.info("user_logged_in", user_id="123", ip="1.2.3.4")
    """

    # Processors pipeline
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        add_service_context,
        add_correlation_id,
        add_otel_trace_ids,
        add_timestamp,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        rename_event_key,
    ]

    if use_json:
        # JSON output для production
        processors.append(structlog.processors.JSONRenderer())
    else:
        # Colored console для development
        processors.append(structlog.dev.ConsoleRenderer(colors=True))

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
        force=True,
    )

    return structlog.get_logger()


# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

class RequestLogger:
    """
    Context manager для логування API requests з timing

    Usage:
        with RequestLogger(logger, "search_documents") as req_logger:
            results = search(query)
            req_logger.info(
                "search_completed",
                query=query,
                results_count=len(results)
            )
    """

    def __init__(
        self,
        logger: structlog.BoundLogger,
        operation: str,
        **initial_context
    ):
        self.logger = logger
        self.operation = operation
        self.context = initial_context
        self.start_time = None
        self.correlation_id = str(uuid.uuid4())

    def __enter__(self):
        self.start_time = datetime.utcnow()
        self.logger.info(
            f"{self.operation}_started",
            correlation_id=self.correlation_id,
            **self.context
        )
        return self.logger.bind(
            correlation_id=self.correlation_id,
            operation=self.operation
        )

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration_ms = int((datetime.utcnow() - self.start_time).total_seconds() * 1000)

        if exc_type:
            self.logger.error(
                f"{self.operation}_failed",
                correlation_id=self.correlation_id,
                duration_ms=duration_ms,
                error=str(exc_val),
                error_type=exc_type.__name__,
                **self.context
            )
        else:
            self.logger.info(
                f"{self.operation}_completed",
                correlation_id=self.correlation_id,
                duration_ms=duration_ms,
                **self.context
            )

    async def __aenter__(self):
        """Async context manager entry"""
        return self.__enter__()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        return self.__exit__(exc_type, exc_val, exc_tb)


def log_performance(
    logger: structlog.BoundLogger,
    operation: str,
    duration_ms: int,
    **metadata
):
    """
    Log performance metric

    Usage:
        log_performance(
            logger,
            "database_query",
            duration_ms=234,
            query_type="select",
            rows_returned=100
        )
    """
    logger.info(
        "performance_metric",
        operation=operation,
        duration_ms=duration_ms,
        performance_category="latency",
        **metadata
    )


def log_business_event(
    logger: structlog.BoundLogger,
    event_name: str,
    **attributes
):
    """
    Log business event для analytics

    Usage:
        log_business_event(
            logger,
            "ml_training_completed",
            dataset_id="123",
            accuracy=0.95,
            model_type="automl"
        )
    """
    logger.info(
        event_name,
        event_category="business",
        **attributes
    )


def log_security_event(
    logger: structlog.BoundLogger,
    event_type: str,
    severity: str,
    **details
):
    """
    Log security-related event

    Usage:
        log_security_event(
            logger,
            "unauthorized_access_attempt",
            severity="high",
            user_id="unknown",
            ip_address="1.2.3.4",
            endpoint="/api/admin/users"
        )
    """
    logger.warning(
        f"security_{event_type}",
        event_category="security",
        severity=severity,
        **details
    )


# ═══════════════════════════════════════════════════════════════════════════
# EXAMPLES
# ═══════════════════════════════════════════════════════════════════════════

def example_usage():
    """Приклади використання structured logging"""

    # Setup logger
    logger = setup_structured_logging()

    # Simple log
    logger.info("application_started")

    # Log with context
    logger.info(
        "user_logged_in",
        user_id="user_123",
        username="admin",
        ip_address="192.168.1.100"
    )

    # Log with request context manager
    with RequestLogger(logger, "search_documents", query="test") as req_logger:
        req_logger.info(
            "processing_search",
            mode="hybrid",
            limit=20
        )
        # Simulate work
        import time
        time.sleep(0.1)
        req_logger.info(
            "search_results",
            results_count=15
        )

    # Performance logging
    log_performance(
        logger,
        "database_query",
        duration_ms=234,
        query_type="select",
        table="documents"
    )

    # Business event
    log_business_event(
        logger,
        "ml_training_started",
        dataset_id="dataset_march_2024",
        model_type="automl",
        priority="high"
    )

    # Security event
    log_security_event(
        logger,
        "permission_denied",
        severity="medium",
        user_id="user_456",
        required_role="admin",
        actual_role="operator"
    )

    # Error logging with exception
    try:
        1 / 0
    except Exception as e:
        logger.exception(
            "calculation_error",
            operation="divide",
            numerator=1,
            denominator=0
        )


# Global logger instance
_global_logger = None

def get_logger(name: Optional[str] = None) -> structlog.BoundLogger:
    """
    Get a configured logger instance

    Args:
        name: Optional logger name (for filtering)

    Returns:
        Configured structured logger

    Usage:
        from libs.core.structured_logger import get_logger

        logger = get_logger("predator.api")
        logger.info("request_received", path="/api/search")
    """
    global _global_logger

    if _global_logger is None:
        _global_logger = setup_structured_logging(
            log_level=LOG_LEVEL,
            use_json=(ENVIRONMENT == "production")
        )

    if name:
        return _global_logger.bind(logger_name=name)
    return _global_logger


if __name__ == "__main__":
    # Run examples
    print("Running structured logging examples...\n")
    example_usage()
