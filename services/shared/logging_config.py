
"""
Module: logging_config
Component: shared
Predator Analytics v25.1
"""
import logging
import json
import sys
from datetime import datetime
from typing import Any

class JSONFormatter(logging.Formatter):
    """
    Structured JSON Formatter for Predator Analytics.
    Ensures all logs are machine-readable for Loki/OpenSearch.
    """
    def format(self, record: logging.LogRecord) -> str:
        log_record: dict[str, Any] = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "component": getattr(record, "component", "unknown"),
        }

        # Add trace/correlation IDs if present
        if hasattr(record, "trace_id"):
            log_record["trace_id"] = record.trace_id
        if hasattr(record, "correlation_id"):
            log_record["correlation_id"] = record.correlation_id
        if hasattr(record, "event_id"):
            log_record["event_id"] = record.event_id

        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)

        # Add extra fields but exclude internal logging attributes
        extra = {
            k: v for k, v in record.__dict__.items()
            if k not in logging.LogRecord("", 0, "", 0, "", [], None).__dict__
            and k not in ["message", "component", "trace_id", "correlation_id", "event_id"]
        }
        if extra:
            log_record["extra"] = extra

        return json.dumps(log_record)

def setup_logging(component_name: str, level: str = "INFO") -> None:
    """
    Configures root logger to output JSON to stdout.
    """
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(getattr(logging, level.upper()))

    # Inject component name filter (optional, simplest is to just rely on extra)
    # But for cleaner logs, we can set a factory or adapter. 
    # For now, we assume usage via logger.info(..., extra={"component": "..."}) 
    # or rely on the global setup.
    
    # Silence noisy libraries
    logging.getLogger("uvicorn.access").handlers = [handler]
    logging.getLogger("uvicorn.error").handlers = [handler]
    
    # Set proper level for third-party libs
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("chromadb").setLevel(logging.WARNING)

    # Log startup
    root_logger.info(f"Logging initialized for {component_name}", extra={"component": component_name})

class ComponentLogger(logging.LoggerAdapter):
    """
    Adapter to automatically inject component name into logs.
    """
    def __init__(self, logger: logging.Logger, component: str):
        super().__init__(logger, {"component": component})

    def process(self, msg, kwargs):
        return msg, kwargs

def get_logger(name: str, component: str = "unknown") -> logging.LoggerAdapter:
    logger = logging.getLogger(name)
    return ComponentLogger(logger, component)
