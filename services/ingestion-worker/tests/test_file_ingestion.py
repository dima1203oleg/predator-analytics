"""Тести для File Ingestion Pipeline — PREDATOR Analytics v55.1 Ironclad.

Тестування валідації, дедуплікації та обробки файлів.
"""

import pytest

from app.validators.declaration import (
    DeclarationValidator,
    Severity,
)


class TestDeclarationValidator:
    """Тести валідатора декларацій."""

    def test_validate_edrpou_valid(self):
        """Валідний ЄДРПОУ (8 цифр)."""
        error = DeclarationValidator.validate_edrpou("12345678")
        assert error is None

    def test_validate_edrpou_invalid_length(self):
        """Невалідний ЄДРПОУ (не 8 цифр)."""
        error = DeclarationValidator.validate_edrpou("1234567")
        assert error is not None
        assert error.severity == Severity.CRITICAL
        assert "8 цифр" in error.message

    def test_validate_edrpou_with_spaces(self):
        """ЄДРПОУ з пробілами — очищається."""
        error = DeclarationValidator.validate_edrpou("1234 5678")
        assert error is None  # Очищається до 12345678

    def test_validate_edrpou_none(self):
        """Відсутній ЄДРПОУ."""
        error = DeclarationValidator.validate_edrpou(None)
        assert error is not None
        assert error.severity == Severity.CRITICAL

    def test_validate_customs_value_positive(self):
        """Позитивна митна вартість."""
        error, value = DeclarationValidator.validate_customs_value(1000.50)
        assert error is None
        assert value == 1000.50

    def test_validate_customs_value_negative(self):
        """Від'ємна митна вартість — конвертується в абсолютне."""
        error, value = DeclarationValidator.validate_customs_value(-500)
        assert error is not None
        assert error.severity == Severity.WARNING
        assert value == 500  # Абсолютне значення

    def test_validate_customs_value_zero(self):
        """Нульова митна вартість."""
        error, value = DeclarationValidator.validate_customs_value(0)
        assert error is not None
        assert error.severity == Severity.WARNING
        assert value == 0

    def test_validate_customs_value_string(self):
        """Митна вартість як рядок."""
        error, value = DeclarationValidator.validate_customs_value("1500.75")
        assert error is None
        assert value == 1500.75

    def test_validate_uktzed_code_valid(self):
        """Валідний код УКТЗЕД."""
        error = DeclarationValidator.validate_uktzed_code("8471300000")
        assert error is None

    def test_validate_uktzed_code_invalid_prefix(self):
        """Невалідний префікс коду УКТЗЕД."""
        error = DeclarationValidator.validate_uktzed_code("9999000000")
        assert error is not None
        assert error.severity == Severity.ERROR

    def test_validate_uktzed_code_too_short(self):
        """Занадто короткий код УКТЗЕД."""
        error = DeclarationValidator.validate_uktzed_code("84")
        assert error is not None
        assert error.severity == Severity.ERROR

    def test_generate_record_hash_consistent(self):
        """Хеш запису має бути консистентним."""
        record = {
            "declaration_number": "UA123456",
            "declaration_date": "2024-01-15",
            "company_edrpou": "12345678",
            "uktzed_code": "8471300000",
            "customs_value": 10000,
        }
        hash1 = DeclarationValidator.generate_record_hash(record)
        hash2 = DeclarationValidator.generate_record_hash(record)
        assert hash1 == hash2

    def test_generate_record_hash_different(self):
        """Різні записи мають різні хеші."""
        record1 = {
            "declaration_number": "UA123456",
            "declaration_date": "2024-01-15",
            "company_edrpou": "12345678",
        }
        record2 = {
            "declaration_number": "UA123457",
            "declaration_date": "2024-01-15",
            "company_edrpou": "12345678",
        }
        hash1 = DeclarationValidator.generate_record_hash(record1)
        hash2 = DeclarationValidator.generate_record_hash(record2)
        assert hash1 != hash2

    def test_validate_record_valid(self):
        """Повна валідація валідного запису."""
        record = {
            "company_edrpou": "12345678",
            "customs_value": 5000,
            "uktzed_code": "8471300000",
        }
        result = DeclarationValidator.validate_record(record)
        assert result.is_valid
        assert not result.quarantine
        assert result.record_hash is not None

    def test_validate_record_quarantine(self):
        """Запис з критичною помилкою відправляється в карантин."""
        record = {
            "company_edrpou": "123",  # Невалідний
            "customs_value": 5000,
            "uktzed_code": "8471300000",
        }
        result = DeclarationValidator.validate_record(record)
        assert not result.is_valid
        assert result.quarantine

    def test_validate_record_with_warnings(self):
        """Запис з попередженнями залишається валідним."""
        record = {
            "company_edrpou": "12345678",
            "customs_value": -100,  # Буде виправлено
            "uktzed_code": "8471300000",
        }
        result = DeclarationValidator.validate_record(record)
        assert result.is_valid
        assert not result.quarantine
        assert result.normalized_record["customs_value"] == 100  # Виправлено


class TestMinioService:
    """Тести MinIO сервісу."""

    def test_parse_s3_path_with_bucket(self):
        """Парсинг s3_path з bucket."""
        from app.minio_service import MinioService

        service = MinioService()
        bucket, obj = service.parse_s3_path("raw-uploads/tenant1/job123/file.csv")
        assert bucket == "raw-uploads"
        assert obj == "tenant1/job123/file.csv"

    def test_parse_s3_path_without_bucket(self):
        """Парсинг s3_path без bucket."""
        from app.minio_service import MinioService

        service = MinioService()
        bucket, obj = service.parse_s3_path("file.csv")
        assert bucket == service.bucket_ingestion
        assert obj == "file.csv"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
