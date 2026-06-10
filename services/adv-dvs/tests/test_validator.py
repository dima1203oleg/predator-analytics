# services/adv-dvs/tests/test_validator.py
"""Тести для модуля ADV-DVS validator.

Перевіряє, що всі методи валідації повертають True (заглушка) та
коректно генерується звіт.
"""

import pytest
import importlib.util, os

# Dynamically load ADVValidator from the validator module with hyphenated path
validator_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'adv-dvs', 'validator.py'))
spec = importlib.util.spec_from_file_location('adv_dvs_validator', validator_path)
validator_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator_module)
ADVValidator = validator_module.ADVValidator

@pytest.fixture(scope="module")
def validator():
    """Створює один екземпляр валідатора для всіх тестів."""
    return ADVValidator()

def test_all_validations_return_true(validator):
    """Перевіряє, що кожен метод валідації повертає True."""
    assert validator.validate_infrastructure() is True
    assert validator.validate_containers() is True
    assert validator.validate_databases() is True
    assert validator.validate_dom() is True
    assert validator.validate_user_journey() is True
    assert validator.validate_api() is True
    assert validator.validate_etl() is True
    assert validator.validate_telegram() is True
    assert validator.validate_ai() is True
    assert validator.validate_observability() is True
    assert validator.validate_security() is True
    assert validator.validate_chaos() is True

def test_generate_report_structure(validator):
    """Перевіряє структуру та коректність звіту, створеного методом `run_all`."""
    report = validator.run_all()
    # Очікувані ключі в звіті
    expected_keys = {"timestamp", "steps", "readiness_index", "overall_status"}
    assert set(report.keys()) == expected_keys

    steps = report["steps"]
    # Усі кроки мають бути True
    assert all(value is True for value in steps.values())
    # Індекс готовності має бути 100
    assert report["readiness_index"] == 100
    # Загальний статус має бути PASSED
    assert report["overall_status"] == "PASSED"
