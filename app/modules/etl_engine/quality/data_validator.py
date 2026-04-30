from __future__ import annotations

"""
Data Validator Component

Responsible for validating data records against schemas and business rules.
"""

from dataclasses import dataclass
import logging
from typing import Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ValidationIssue:
    """Represents a single validation issue."""

    field: str
    message: str
    severity: str = "error"  # "error", "warning"


@dataclass
class ValidationResult:
    """Result of validating a record or batch."""

    is_valid: bool
    issues: list[ValidationIssue]
    record_index: int | None = None

    @property
    def error_count(self) -> int:
        return len([i for i in self.issues if i.severity == "error"])

    @property
    def warning_count(self) -> int:
        return len([i for i in self.issues if i.severity == "warning"])


class DataValidator:
    """Data Validator for ETL engine.

    Performs deep validation of records beyond simple type normalization.
    """

    def __init__(self, config: dict[str, Any] | None = None):
        self.config = config or {}
        # Default required fields if not provided in config
        self.required_fields = self.config.get("required_fields", ["name", "registration_number"])
        logger.info("DataValidator initialized")

    def validate_record(self, record: dict[str, Any], index: int | None = None) -> ValidationResult:
        """Validate a single record.

        Args:
            record: Data record to validate
            index: Optional index of the record in a batch

        Returns:
            ValidationResult containing status and issues

        """
        issues = []

        # 1. Check required fields
        required: list[str] = self.required_fields
        for field in required:
            field_val = record.get(field)
            if field_val is None or str(field_val).strip() == "":
                issues.append(ValidationIssue(field, f"Required field '{field}' is missing or empty", "error"))

        # 2. Check for zero prices (Business Rule)
        price_fields: list[str] = ["Ціна", "Вартість", "Price", "Amount"]
        for field in price_fields:
            if field in record:
                try:
                    field_val = record[field]
                    val = float(field_val)
                    if val <= 0:
                        issues.append(ValidationIssue(field, f"Price/Amount in '{field}' is zero or negative: {val}", "warning"))
                except (ValueError, TypeError):
                    issues.append(ValidationIssue(field, f"Invalid numeric value in price field '{field}'", "error"))

        # 3. Check UKTZED code format (Ukraine specific)
        uktzed_field: str = "Код товару"
        if uktzed_field in record:
            uktzed_val = record[uktzed_field]
            val_str = str(uktzed_val).strip()
            if not val_str.isdigit() or len(val_str) < 2:
                issues.append(ValidationIssue(uktzed_field, f"Invalid UKTZED code format (should be numeric): {val_str}", "warning"))

        return ValidationResult(
            is_valid=len([i for i in issues if i.severity == "error"]) == 0,
            issues=issues,
            record_index=index
        )

    def validate_batch(self, records: list[dict[str, Any]]) -> list[ValidationResult]:
        """Validate a batch of records.

        Args:
            records: List of records to validate

        Returns:
            List of ValidationResult objects

        """
        results = []
        for i, record in enumerate(records):
            results.append(self.validate_record(record, i))
        return results


def create_data_validator(config: dict[str, Any] | None = None) -> DataValidator:
    """Factory function to create a DataValidator instance.

    Returns:
        DataValidator instance

    """
    return DataValidator(config)
