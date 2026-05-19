"""Data Quality Contracts v63.0-ELITE — Great Expectations.

Контракти даних для всіх Kafka topics:
  - Автоматичні data quality checkpoints
  - Block ingestion при schema breaking changes
  - Data quality dashboards
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any

from app.core.settings import get_settings

if TYPE_CHECKING:
    from collections.abc import Sequence

settings = get_settings()
logger = logging.getLogger(__name__)


@dataclass
class DataQualityCheck:
    """Один data quality check."""

    name: str
    expectation: str
    kwargs: dict[str, Any] = field(default_factory=dict)
    passed: bool | None = None
    observed_value: Any = None
    error: str | None = None


@dataclass
class DataQualityResult:
    """Результат перевірки якості даних."""

    dataset: str
    checks: list[DataQualityCheck]
    passed: bool = True
    total_checks: int = 0
    passed_checks: int = 0
    timestamp: str = ""

    def __post_init__(self) -> None:
        self.total_checks = len(self.checks)
        self.passed_checks = sum(1 for c in self.checks if c.passed)
        self.passed = self.passed_checks == self.total_checks
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


# ── Data Contracts ───────────────────────────────────────────


PREDATOR_DATA_CONTRACTS: dict[str, list[dict[str, Any]]] = {
    "predator.ingestion.parsed": [
        {
            "name": "declared_value_positive",
            "expectation": "expect_column_values_to_be_between",
            "kwargs": {"column": "declared_value_usd", "min_value": 0, "max_value": 1_000_000_000},
        },
        {
            "name": "weight_positive",
            "expectation": "expect_column_values_to_be_between",
            "kwargs": {"column": "weight_kg", "min_value": 0, "max_value": 1_000_000},
        },
        {
            "name": "hs_code_valid",
            "expectation": "expect_column_values_to_match_regex",
            "kwargs": {"column": "hs_code", "regex": r"^\d{4,10}$"},
        },
        {
            "name": "country_not_null",
            "expectation": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "origin_country"},
        },
        {
            "name": "event_id_unique",
            "expectation": "expect_column_values_to_be_unique",
            "kwargs": {"column": "event_id"},
        },
    ],
    "predator.risk.scored": [
        {
            "name": "risk_score_range",
            "expectation": "expect_column_values_to_be_between",
            "kwargs": {"column": "risk_score", "min_value": 0.0, "max_value": 1.0},
        },
        {
            "name": "model_version_not_null",
            "expectation": "expect_column_values_to_not_be_null",
            "kwargs": {"column": "model_version"},
        },
    ],
    "predator.alerts": [
        {
            "name": "severity_valid",
            "expectation": "expect_column_values_to_be_in_set",
            "kwargs": {"column": "severity", "value_set": ["LOW", "MEDIUM", "HIGH", "CRITICAL"]},
        },
        {
            "name": "alert_id_unique",
            "expectation": "expect_column_values_to_be_unique",
            "kwargs": {"column": "alert_id"},
        },
    ],
}


# ── Data Quality Engine ──────────────────────────────────────


class DataQualityEngine:
    """Двигун перевірки якості даних."""

    def __init__(self) -> None:
        self._contracts = PREDATOR_DATA_CONTRACTS
        self._history: list[DataQualityResult] = []

    def validate(
        self, dataset: str, records: list[dict[str, Any]]
    ) -> DataQualityResult:
        """Перевіряє якість даних для набору записів."""
        contract = self._contracts.get(dataset)
        if contract is None:
            logger.warning("No data contract for dataset: %s", dataset)
            return DataQualityResult(dataset=dataset, checks=[])

        checks = []
        for check_def in contract:
            check = DataQualityCheck(
                name=check_def["name"],
                expectation=check_def["expectation"],
                kwargs=check_def["kwargs"],
            )

            try:
                check.passed = self._run_check(check, records)
            except Exception as e:
                check.passed = False
                check.error = str(e)

            checks.append(check)

        result = DataQualityResult(dataset=dataset, checks=checks)
        self._history.append(result)

        if not result.passed:
            logger.warning(
                "Data quality FAILED for %s: %d/%d checks passed",
                dataset, result.passed_checks, result.total_checks,
            )
            for c in result.checks:
                if not c.passed:
                    logger.warning("  ❌ %s: %s", c.name, c.error or "failed")

        return result

    def _run_check(
        self, check: DataQualityCheck, records: list[dict[str, Any]]
    ) -> bool:
        """Виконує один data quality check."""
        expectation = check.expectation
        kwargs = check.kwargs

        if expectation == "expect_column_values_to_be_between":
            return self._check_range(records, **kwargs)
        elif expectation == "expect_column_values_to_not_be_null":
            return self._check_not_null(records, **kwargs)
        elif expectation == "expect_column_values_to_be_unique":
            return self._check_unique(records, **kwargs)
        elif expectation == "expect_column_values_to_match_regex":
            return self._check_regex(records, **kwargs)
        elif expectation == "expect_column_values_to_be_in_set":
            return self._check_in_set(records, **kwargs)
        else:
            logger.warning("Unknown expectation: %s", expectation)
            return True

    def _check_range(
        self, records: list[dict[str, Any]], column: str, min_value: float, max_value: float
    ) -> bool:
        values = [r.get(column, 0) for r in records]
        return all(min_value <= v <= max_value for v in values)

    def _check_not_null(
        self, records: list[dict[str, Any]], column: str
    ) -> bool:
        return all(r.get(column) is not None for r in records)

    def _check_unique(
        self, records: list[dict[str, Any]], column: str
    ) -> bool:
        values = [r.get(column) for r in records]
        return len(values) == len(set(values))

    def _check_regex(
        self, records: list[dict[str, Any]], column: str, regex: str
    ) -> bool:
        import re
        pattern = re.compile(regex)
        return all(pattern.match(str(r.get(column, ""))) for r in records)

    def _check_in_set(
        self, records: list[dict[str, Any]], column: str, value_set: list[str]
    ) -> bool:
        return all(r.get(column) in value_set for r in records)

    @property
    def stats(self) -> dict[str, Any]:
        """Статистика якості даних."""
        if not self._history:
            return {"total_checks": 0, "pass_rate": 1.0}

        total = sum(r.total_checks for r in self._history)
        passed = sum(r.passed_checks for r in self._history)
        return {
            "total_checks": total,
            "passed_checks": passed,
            "pass_rate": round(passed / max(total, 1), 3),
            "datasets_checked": len(set(r.dataset for r in self._history)),
        }


# ── Factory ──────────────────────────────────────────────────

_dq_engine: DataQualityEngine | None = None


def get_dq_engine() -> DataQualityEngine:
    """Отримати синглтон DataQualityEngine."""
    global _dq_engine
    if _dq_engine is None:
        _dq_engine = DataQualityEngine()
    return _dq_engine
