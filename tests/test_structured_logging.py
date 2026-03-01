from __future__ import annotations

import json
import logging
import sys

import pytest

from app.libs.core.structured_logger import RequestLogger, get_logger, setup_structured_logging


# Ensure logging is configured for JSON before tests
@pytest.fixture(scope="module", autouse=True)
def configure_logging():
    # Force JSON output for tests
    import libs.core.structured_logger

    libs.core.structured_logger._global_logger = setup_structured_logging(
        log_level="INFO", use_json=True
    )


def test_structured_log_format(caplog):
    """Verify logs are valid JSON when configured."""
    # Clear previous logs
    caplog.clear()

    logger = get_logger("test_structured_logging")
    logger.info("test_event", key="value")

    assert caplog.records, "No log records captured"

    # Check the last record
    log_record = caplog.records[-1]

    # The message should be a JSON string if JSONRenderer is working
    try:
        data = json.loads(log_record.message)
    except json.JSONDecodeError:
        pytest.fail(f"Log message is not JSON: {log_record.message}")

    assert data.get("message") == "test_event"
    assert data.get("key") == "value"
    assert "timestamp" in data
    assert "correlation_id" in data
    assert "service" in data


def test_request_logger_context(caplog):
    """Verify RequestLogger adds context and duration."""
    caplog.clear()
    print("DEBUG: Starting test_request_logger_context")

    logger = get_logger("test_request_context")

    with RequestLogger(logger, "test_op", user="admin") as req_logger:
        req_logger.info("inside_context")

    events = []
    for record in caplog.records:
        try:
            events.append(json.loads(record.message))
        except json.JSONDecodeError:
            continue

    started = next((e for e in events if e.get("message") == "test_op_started"), None)
    assert started, f"Start event not found in: {[r.message for r in caplog.records]}"
    assert started.get("user") == "admin"
    assert "correlation_id" in started

    inside = next((e for e in events if e.get("message") == "inside_context"), None)
    assert inside, "Inside event not found"
    assert inside["correlation_id"] == started["correlation_id"]

    completed = next((e for e in events if e.get("message") == "test_op_completed"), None)
    assert completed, "Completion event not found"
    assert completed["correlation_id"] == started["correlation_id"]
    assert "duration_ms" in completed
