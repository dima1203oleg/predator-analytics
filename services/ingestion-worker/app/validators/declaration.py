"""Declaration Validator — PREDATOR Analytics v55.1 Ironclad.

Валідація митних декларацій згідно TZ §2.2.3.
"""
from dataclasses import dataclass, field
from enum import StrEnum
import hashlib
import re
from typing import Any, ClassVar

from predator_common.logging import get_logger

logger = get_logger("ingestion_worker.validator")


class Severity(StrEnum):
    """Рівень серйозності помилки валідації."""

    CRITICAL = "critical"  # Запис відправляється в карантин
    ERROR = "error"  # Запис індексується, але позначається флагом
    WARNING = "warning"  # Запис виправляється автоматично


@dataclass
class ValidationError:
    """Помилка валідації."""

    field: str
    message: str
    severity: Severity
    original_value: Any = None
    corrected_value: Any = None


@dataclass
class ValidationResult:
    """Результат валідації запису."""

    is_valid: bool = True
    errors: list[ValidationError] = field(default_factory=list)
    quarantine: bool = False
    record_hash: str | None = None
    normalized_record: dict[str, Any] = field(default_factory=dict)


# Офіційні коди УКТЗЕД (перші 2 цифри — групи товарів)
VALID_UKTZED_PREFIXES = {
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
    "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
    "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
    "31", "32", "33", "34", "35", "36", "37", "38", "39", "40",
    "41", "42", "43", "44", "45", "46", "47", "48", "49", "50",
    "51", "52", "53", "54", "55", "56", "57", "58", "59", "60",
    "61", "62", "63", "64", "65", "66", "67", "68", "69", "70",
    "71", "72", "73", "74", "75", "76", "78", "79", "80", "81",
    "82", "83", "84", "85", "86", "87", "88", "89", "90", "91",
    "92", "93", "94", "95", "96", "97",
}


class DeclarationValidator:
    """Валідатор митних декларацій."""

    # Ключові поля для генерації хешу (дедуплікація)
    HASH_FIELDS: ClassVar[list[str]] = [
        "declaration_number",
        "declaration_date",
        "company_edrpou",
        "uktzed_code",
        "customs_value",
    ]

    @staticmethod
    def validate_edrpou(value: Any) -> ValidationError | None:
        """Валідація ЄДРПОУ: точно 8 цифр. Severity: CRITICAL."""
        if value is None:
            return ValidationError(
                field="company_edrpou",
                message="ЄДРПОУ відсутній",
                severity=Severity.CRITICAL,
                original_value=value,
            )

        # Очищаємо від нецифрових символів
        cleaned = re.sub(r"\D", "", str(value))

        if len(cleaned) != 8:
            return ValidationError(
                field="company_edrpou",
                message=f"ЄДРПОУ має бути 8 цифр, отримано {len(cleaned)}",
                severity=Severity.CRITICAL,
                original_value=value,
            )

        return None

    @staticmethod
    def validate_customs_value(value: Any) -> tuple[ValidationError | None, float | None]:
        """Валідація митної вартості: > 0. Severity: WARNING."""
        if value is None:
            return (
                ValidationError(
                    field="customs_value",
                    message="Митна вартість відсутня",
                    severity=Severity.WARNING,
                    original_value=value,
                ),
                None,
            )

        try:
            numeric_value = float(value)
        except (ValueError, TypeError):
            return (
                ValidationError(
                    field="customs_value",
                    message=f"Неможливо конвертувати в число: {value}",
                    severity=Severity.WARNING,
                    original_value=value,
                ),
                None,
            )

        if numeric_value < 0:
            # Автоматичне виправлення: конвертуємо в абсолютне значення
            corrected = abs(numeric_value)
            return (
                ValidationError(
                    field="customs_value",
                    message="Від'ємна митна вартість конвертована в абсолютне значення",
                    severity=Severity.WARNING,
                    original_value=numeric_value,
                    corrected_value=corrected,
                ),
                corrected,
            )

        if numeric_value == 0:
            return (
                ValidationError(
                    field="customs_value",
                    message="Митна вартість дорівнює нулю",
                    severity=Severity.WARNING,
                    original_value=numeric_value,
                ),
                numeric_value,
            )

        return None, numeric_value

    @staticmethod
    def validate_uktzed_code(value: Any) -> ValidationError | None:
        """Валідація коду УКТЗЕД. Severity: ERROR."""
        if value is None:
            return ValidationError(
                field="uktzed_code",
                message="Код УКТЗЕД відсутній",
                severity=Severity.ERROR,
                original_value=value,
            )

        cleaned = re.sub(r"\D", "", str(value))

        if len(cleaned) < 4:
            return ValidationError(
                field="uktzed_code",
                message=f"Код УКТЗЕД занадто короткий: {cleaned}",
                severity=Severity.ERROR,
                original_value=value,
            )

        # Перевірка префіксу (перші 2 цифри)
        prefix = cleaned[:2]
        if prefix not in VALID_UKTZED_PREFIXES:
            return ValidationError(
                field="uktzed_code",
                message=f"Невалідний префікс коду УКТЗЕД: {prefix}",
                severity=Severity.ERROR,
                original_value=value,
            )

        return None

    @classmethod
    def generate_record_hash(cls, record: dict[str, Any]) -> str:
        """Генерує унікальний хеш запису для дедуплікації."""
        hash_parts = []
        for field_name in cls.HASH_FIELDS:
            value = record.get(field_name, "")
            hash_parts.append(str(value).strip().lower())

        hash_string = "|".join(hash_parts)
        return hashlib.sha256(hash_string.encode("utf-8")).hexdigest()[:32]

    @classmethod
    def validate_record(cls, record: dict[str, Any]) -> ValidationResult:
        """Повна валідація запису декларації."""
        result = ValidationResult()
        result.normalized_record = record.copy()

        # 1. Валідація ЄДРПОУ (CRITICAL)
        edrpou_error = cls.validate_edrpou(record.get("company_edrpou"))
        if edrpou_error:
            result.errors.append(edrpou_error)
            if edrpou_error.severity == Severity.CRITICAL:
                result.quarantine = True
                result.is_valid = False

        # 2. Валідація митної вартості (WARNING)
        value_error, corrected_value = cls.validate_customs_value(
            record.get("customs_value")
        )
        if value_error:
            result.errors.append(value_error)
            if corrected_value is not None:
                result.normalized_record["customs_value"] = corrected_value

        # 3. Валідація коду УКТЗЕД (ERROR)
        uktzed_error = cls.validate_uktzed_code(record.get("uktzed_code"))
        if uktzed_error:
            result.errors.append(uktzed_error)
            # ERROR не відправляє в карантин, але позначає флагом
            result.normalized_record["_uktzed_invalid"] = True

        # 4. Генерація хешу для дедуплікації
        result.record_hash = cls.generate_record_hash(result.normalized_record)

        return result
