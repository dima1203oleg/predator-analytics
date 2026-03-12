"""Content Hash — Хешування вмісту для дедуплікації.

Обчислює SHA-256 хеш від відсортованого JSON ключових полів.
Якщо content_hash вже існує в БД → запис пропускається (не дублюється).

Правила:
- Поля відсортовані за назвою (для детермінізму)
- None значення ігноруються
- Числа нормалізуються до рядків
"""

import hashlib
import json
from typing import Any


def compute_content_hash(data: dict[str, Any]) -> str:
    """Обчислює SHA-256 хеш від словника даних.

    Алгоритм:
    1. Видалити None значення
    2. Відсортувати ключі
    3. Серіалізувати у JSON (детерміновано)
    4. SHA-256

    Args:
        data: Словник ключових полів сутності

    Returns:
        64-символьний hex рядок SHA-256

    Приклад:
        >>> compute_content_hash({"edrpou": "12345678", "name": "ТОВ Ромашка"})
        'a1b2c3...'

    """
    # Видалити None та порожні значення
    filtered = {
        key: value
        for key, value in data.items()
        if value is not None and value != "" and value != []
    }

    # Серіалізувати JSON з детермінованим сортуванням ключів
    canonical_json = json.dumps(
        filtered,
        sort_keys=True,
        ensure_ascii=False,
        separators=(",", ":"),
        default=_json_serializer,
    )

    return hashlib.sha256(canonical_json.encode("utf-8")).hexdigest()


def _json_serializer(obj: Any) -> Any:
    """Серіалізатор для нестандартних типів."""
    if hasattr(obj, "isoformat"):
        # datetime, date
        return obj.isoformat()  # type: ignore[attr-defined]
    if hasattr(obj, "__float__"):
        # Decimal, float
        return str(obj)
    return str(obj)


def compute_declaration_hash(
    declaration_number: str,
    declaration_date: str,
    uktzed_code: str,
    importer_edrpou: str | None,
    invoice_value_usd: float | None,
) -> str:
    """Хеш для митної декларації.

    Args:
        declaration_number: Номер декларації
        declaration_date: Дата у форматі YYYY-MM-DD
        uktzed_code: Код УКТЗЕД
        importer_edrpou: ЄДРПОУ імпортера
        invoice_value_usd: Вартість у USD

    Returns:
        SHA-256 hex рядок

    """
    return compute_content_hash({
        "declaration_number": declaration_number,
        "declaration_date": declaration_date,
        "uktzed_code": uktzed_code,
        "importer_edrpou": importer_edrpou,
        "invoice_value_usd": invoice_value_usd,
    })
