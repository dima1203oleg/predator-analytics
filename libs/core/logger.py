import logging
import sys


def setup_logger(name: str, level: str = "INFO", log_file: str | None = None) -> logging.Logger:
    """Standard logger setup for Predator services.

    Args:
        name: Logger name
        level: Logging level (INFO, DEBUG, etc.)
        log_file: Optional path to a file to write logs to

    Returns:
        Configured logging.Logger instance

    """
    logger = logging.getLogger(name)

    # Avoid duplicate handlers if setup_logger is called multiple times
    if logger.handlers:
        return logger

    logger.setLevel(level)

    # Create formatter
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler if requested
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    # Prevent propagation to root logger to avoid double logging
    logger.propagate = False

    return logger
