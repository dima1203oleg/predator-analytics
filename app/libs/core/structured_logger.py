from __future__ import annotations

from datetime import datetime
import json
import logging
import os
import sys
import uuid


# Спроба імпорту structlog
try:
    import structlog

    HAS_STRUCTLOG = True
except ImportError:
    HAS_STRUCTLOG = False

# Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
SERVICE_NAME = os.getenv("SERVICE_NAME", "predator-api")
SERVICE_VERSION = os.getenv("APP_VERSION", "25.0.0")

if HAS_STRUCTLOG:

    def add_service_context(logger, method_name, event_dict):
        event_dict["service"] = SERVICE_NAME
        event_dict["version"] = SERVICE_VERSION
        event_dict["environment"] = ENVIRONMENT
        return event_dict

    def add_correlation_id(logger, method_name, event_dict):
        if "correlation_id" not in event_dict:
            event_dict["correlation_id"] = str(uuid.uuid4())
        return event_dict

    def add_timestamp(logger, method_name, event_dict):
        event_dict["timestamp"] = datetime.utcnow().isoformat() + "Z"
        return event_dict

    def setup_structured_logging(log_level: str = LOG_LEVEL, use_json: bool = True):
        processors = [
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            add_service_context,
            add_correlation_id,
            add_timestamp,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer() if use_json else structlog.dev.ConsoleRenderer(colors=True),
        ]
        structlog.configure(
            processors=processors,
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )
        logging.basicConfig(format="%(message)s", stream=sys.stdout, level=getattr(logging, log_level.upper()))
        return structlog.get_logger()

else:
    # Заглушка для систем без structlog
    class MockBoundLogger:
        def __init__(self, name="root", context=None):
            self.logger = logging.getLogger(name)
            self._context = context or {}

        def bind(self, **kwargs):
            new_context = {**self._context, **kwargs}
            return MockBoundLogger(self.logger.name, new_context)

        def info(self, event, **kwargs):
            self.logger.info(self._format(event, kwargs))

        def warning(self, event, **kwargs):
            self.logger.warning(self._format(event, kwargs))

        def error(self, event, **kwargs):
            self.logger.error(self._format(event, kwargs))

        def debug(self, event, **kwargs):
            self.logger.debug(self._format(event, kwargs))

        def exception(self, event, **kwargs):
            self.logger.exception(self._format(event, kwargs))

        def _format(self, event, kwargs):
            data = {**self._context, **kwargs, "event": event, "timestamp": datetime.now().isoformat()}
            return json.dumps(data)

    def setup_structured_logging(log_level: str = LOG_LEVEL, use_json: bool = True):
        logging.basicConfig(level=getattr(logging, log_level.upper()))
        return MockBoundLogger()


# Global logger instance
_global_logger = None


def get_logger(name: str | None = None):
    global _global_logger
    if _global_logger is None:
        _global_logger = setup_structured_logging()

    if name and HAS_STRUCTLOG:
        return _global_logger.bind(logger_name=name)
    if name:
        return MockBoundLogger(name)
    return _global_logger


# Helper classes needed by the app
class RequestLogger:
    def __init__(self, logger, operation, **initial_context):
        self.logger = logger
        self.operation = operation
        self.context = initial_context
        self.start_time = datetime.now()

    def __enter__(self):
        return self.logger.bind(operation=self.operation, **self.context)

    def __exit__(self, exc_type, exc_val, exc_tb):
        pass


def log_performance(logger, operation, duration_ms, **metadata):
    logger.info("performance_metric", operation=operation, duration_ms=duration_ms, **metadata)


def log_business_event(logger, event_name, **attributes):
    logger.info(event_name, event_category="business", **attributes)


def log_security_event(logger, event_type, severity, **details):
    logger.warning(f"security_{event_type}", event_category="security", severity=severity, **details)
