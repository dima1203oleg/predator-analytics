import logging
import sys
import json
import os
from datetime import datetime
from typing import Optional

class WinSURFFormatter(logging.Formatter):
    """
    Structured JSON Formatter for Predator Analytics v25+.
    Enables better log analysis for AI Agents and Observability tools.
    """
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "func": record.funcName,
            "line": record.lineno,
            "env": os.getenv("ENVIRONMENT", "rnd")
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry)

def setup_logger(name: str, level: Optional[int] = None) -> logging.Logger:
    """
    Configures a logger with WinSURF standards.
    Usage: logger = setup_logger(__name__)
    """
    logger = logging.getLogger(name)

    # Set level from env or default
    if level is None:
        env_level = os.getenv("LOG_LEVEL", "INFO").upper()
        level = getattr(logging, env_level, logging.INFO)

    logger.setLevel(level)

    # Avoid adding multiple handlers if already configured
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)

        # Use JSON formatter in Production/Staging, Human-readable in R&D
        env = os.getenv("ENVIRONMENT", "rnd").lower()
        if env in ["prod", "production", "staging"]:
            handler.setFormatter(WinSURFFormatter())
        else:
            # Clean human-readable format for R&D
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            handler.setFormatter(formatter)

        logger.addHandler(handler)
        logger.propagate = False

    return logger

# Global system-wide logger
system_logger = setup_logger("predator.sys")
