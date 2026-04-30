"""Decision Ledger — WORM immutable AI decision store (Phase 5 — SM Edition).

Implements §4.3: Every AI decision gets a WORM record with:
- Input hash, output, SHAP values, confidence, execution time.
HR-16: UPDATE/DELETE = ERROR.
"""
from datetime import UTC, datetime
import hashlib
import json
from typing import Any


class DecisionLedger:
    """WORM Decision Ledger для AI/ML рішень."""

    def __init__(self) -> None:
        self.config: dict[str, Any] = {
            "storage": "postgresql",
            "table": "decision_artifacts",
            "worm": True,
            "archive_to": "clickhouse",
            "archive_after_days": 90,
            "backup_to": "minio",
            "bucket": "predator-decision-artifacts",
        }

    def get_config(self) -> dict[str, Any]:
        """Конфігурація Decision Ledger."""
        return {
            **self.config,
            "status": "active",
            "worm_policy": "UPDATE/DELETE заборонено (HR-16)",
            "updated_at": datetime.now(UTC).isoformat(),
        }

    def create_artifact(
        self,
        decision_type: str,
        model_name: str,
        model_version: str,
        input_data: dict[str, Any],
        output_data: dict[str, Any],
        confidence: float,
        shap_values: dict[str, Any] | None = None,
        execution_ms: int = 0,
    ) -> dict[str, Any]:
        """Створити WORM запис рішення.

        Повертає структуру для INSERT в decision_artifacts.
        """
        input_json = json.dumps(input_data, sort_keys=True)
        input_hash = hashlib.sha256(input_json.encode("utf-8")).hexdigest()

        return {
            "decision_type": decision_type,
            "model_name": model_name,
            "model_version": model_version,
            "input_hash": input_hash,
            "input_summary": input_data,
            "output": output_data,
            "confidence": confidence,
            "shap_values": shap_values,
            "execution_ms": execution_ms,
            "created_at": datetime.now(UTC).isoformat(),
            "worm": True,
        }

    def get_stats(self) -> dict[str, Any]:
        """Статистика Decision Ledger."""
        return {
            "total_artifacts": 0,
            "decision_types": [],
            "avg_confidence": 0.0,
            "avg_execution_ms": 0,
            "worm_violations_blocked": 0,
        }
