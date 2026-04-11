"""
📝 Advanced Structured Logging Configuration для PREDATOR Analytics v56.1.4

JSON-formatted logs з context, correlation IDs, та performance metrics.
Ready for ELK/Loki integration.
"""

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any


class JSONFormatter(logging.Formatter):
    """JSON formatter для структурованих логів."""

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info and record.exc_info[0]:
            log_data["exception"] = {
                "type": record.exc_info[0].__name__,
                "message": str(record.exc_info[1]),
                "traceback": self.formatException(record.exc_info),
            }

        # Add extra fields from record
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        
        if hasattr(record, "tenant_id"):
            log_data["tenant_id"] = record.tenant_id
        
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        
        if hasattr(record, "method"):
            log_data["method"] = record.method
        
        if hasattr(record, "path"):
            log_data["path"] = record.path
        
        if hasattr(record, "status"):
            log_data["status"] = record.status
        
        if hasattr(record, "client_ip"):
            log_data["client_ip"] = record.client_ip

        # Add any additional extra fields
        for key, value in record.__dict__.items():
            if key not in [
                "name", "msg", "args", "created", "filename", "funcName",
                "levelname", "levelno", "lineno", "module", "msecs",
                "message", "pathname", "process", "processName", "relativeCreated",
                "stack_info", "exc_info", "exc_text", "thread", "threadName",
                "taskName", "request_id", "tenant_id", "user_id", "duration_ms",
                "method", "path", "status", "client_ip"
            ]:
                if not key.startswith("_"):
                    log_data[key] = value

        return json.dumps(log_data, default=str, ensure_ascii=False)


class ColoredFormatter(logging.Formatter):
    """Colored formatter для development (human-readable)."""

    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[1;31m", # Bold Red
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        color = self.COLORS.get(record.levelname, self.RESET)
        
        # Base format
        log_msg = f"{color}[{record.levelname}]{self.RESET} {record.getMessage()}"
        
        # Add extra context
        extras = []
        if hasattr(record, "request_id"):
            extras.append(f"req_id={record.request_id}")
        if hasattr(record, "tenant_id"):
            extras.append(f"tenant={record.tenant_id}")
        if hasattr(record, "duration_ms"):
            extras.append(f"{record.duration_ms}ms")
        
        if extras:
            log_msg += f" {self.COLORS['DEBUG']}| {' | '.join(extras)}{self.RESET}"
        
        # Add exception
        if record.exc_info and record.exc_info[0]:
            log_msg += f"\n{self.formatException(record.exc_info)}"
        
        return log_msg


def setup_logging(
    level: str = "INFO",
    json_format: bool = True,
    log_file: str = None,
) -> None:
    """
    Налаштувати logging для всього додатку.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_format: Use JSON format (True for production, False for dev)
        log_file: Optional log file path
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, level.upper()))
    
    # Remove existing handlers
    root_logger.handlers.clear()
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, level.upper()))
    
    if json_format:
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(ColoredFormatter())
    
    root_logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(getattr(logging, level.upper()))
        file_handler.setFormatter(JSONFormatter())
        root_logger.addHandler(file_handler)
    
    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    
    # Log startup
    logger = logging.getLogger("predator.logging")
    logger.info(
        "Logging initialized",
        extra={
            "level": level,
            "format": "json" if json_format else "colored",
            "log_file": log_file or "console_only",
        }
    )


class PerformanceLogger:
    """Helper для логування performance metrics."""

    def __init__(self, operation: str, logger_name: str = "performance"):
        self.operation = operation
        self.logger = logging.getLogger(logger_name)
        self.start_time = None

    def __enter__(self):
        self.start_time = datetime.now(timezone.utc)
        self.logger.info(
            f"Starting {self.operation}",
            extra={"operation": self.operation, "event": "start"}
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (datetime.now(timezone.utc) - self.start_time).total_seconds() * 1000
        
        if exc_type:
            self.logger.error(
                f"Failed {self.operation}",
                extra={
                    "operation": self.operation,
                    "event": "error",
                    "duration_ms": round(duration, 2),
                    "error_type": exc_type.__name__,
                    "error_message": str(exc_val),
                },
                exc_info=(exc_type, exc_val, exc_tb)
            )
        else:
            self.logger.info(
                f"Completed {self.operation}",
                extra={
                    "operation": self.operation,
                    "event": "complete",
                    "duration_ms": round(duration, 2),
                }
            )
        
        return False  # Don't suppress exceptions


# Convenience function
def get_structured_logger(name: str) -> logging.Logger:
    """Get a logger with structured logging support."""
    return logging.getLogger(name)
