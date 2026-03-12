"""UEID — Universal Entity ID Generator.

Генерує детермінований, глобально унікальний ідентифікатор
для компаній та фізичних осіб на основі SHA-256 хешу
від канонічної форми сутності.

Алгоритм:
- Компанія: SHA256(f"company:{edrpou}:{normalized_name}")
- Особа:    SHA256(f"person:{inn}:{normalized_name}:{dob}")
- Fallback: SHA256(normalized_name + address)
"""

import hashlib
import re
import unicodedata


def _normalize_text(text: str) -> str:
    """Нормалізація тексту: unicode, lowercase, видалення зайвих символів."""
    # Unicode нормалізація (звести до NFC форми)
    text = unicodedata.normalize("NFC", text)
    # Видалити непотрібні символи (лапки, крапки, коми)
    text = re.sub(r'[«»"\'.,;:!?()\[\]{}\-–—_]', " ", text)
    # Привести до нижнього регістру
    text = text.lower().strip()
    # Видалити помилкові пробіли
    text = re.sub(r"\s+", " ", text)
    return text


def _normalize_company_name(name: str) -> str:
    """Нормалізація назви компанії.

    Приклад:
        'Товариство з обмеженою відповідальністю "Ромашка-Трейд"'
        → 'тов ромашка трейд'
    """
    legal_forms: dict[str, str] = {
        "товариство з обмеженою відповідальністю": "тов",
        "товариство з додатковою відповідальністю": "тдв",
        "публічне акціонерне товариство": "пат",
        "приватне акціонерне товариство": "прат",
        "приватне підприємство": "пп",
        "акціонерне товариство": "ат",
        "фізична особа підприємець": "фоп",
        "державне підприємство": "дп",
        "комунальне підприємство": "кп",
    }
    name = _normalize_text(name)
    for long_form, short_form in legal_forms.items():
        name = name.replace(long_form, short_form)
    return name.strip()


def generate_ueid(canonical_string: str) -> str:
    """Генерує UEID з канонічного рядка через SHA-256.

    Args:
        canonical_string: Рядок у форматі 'entity_type:field1:field2:...'

    Returns:
        64-символьний hex рядок SHA-256 хешу

    """
    return hashlib.sha256(canonical_string.encode("utf-8")).hexdigest()


def generate_company_ueid(
    name: str,
    edrpou: str | None = None,
    address: str | None = None,
) -> str:
    """Генерує UEID для компанії.

    Якщо є ЄДРПОУ — використовує його як основний ідентифікатор.
    Якщо немає — fallback на нормалізовану назву + адрес.

    Args:
        name: Назва компанії (буде нормалізована)
        edrpou: ЄДРПОУ (8 цифр), опціональний
        address: Адреса (для fallback), опціональна

    Returns:
        UEID рядок (SHA-256 hex)

    Приклад:
        >>> generate_company_ueid("ТОВ Ромашка", "12345678")
        'a1b2c3...'

    """
    normalized_name = _normalize_company_name(name)

    if edrpou and edrpou.strip():
        edrpou_clean = re.sub(r"\D", "", edrpou)
        canonical = f"company:{edrpou_clean}:{normalized_name}"
    elif address:
        normalized_address = _normalize_text(address)
        canonical = f"company:{normalized_name}:{normalized_address}"
    else:
        canonical = f"company:{normalized_name}"

    return generate_ueid(canonical)


def generate_person_ueid(
    full_name: str,
    inn: str | None = None,
    date_of_birth: str | None = None,
) -> str:
    """Генерує UEID для фізичної особи.

    Args:
        full_name: Повне ім'я (буде нормалізоване)
        inn: ІПН (10 цифр), опціональний
        date_of_birth: Дата народження у форматі YYYY-MM-DD, опціональна

    Returns:
        UEID рядок (SHA-256 hex)

    Приклад:
        >>> generate_person_ueid("Іванов Іван Іванович", "1234567890", "1980-05-15")
        'd4e5f6...'

    """
    normalized_name = _normalize_text(full_name)

    if inn and inn.strip():
        inn_clean = re.sub(r"\D", "", inn)
        dob = date_of_birth or ""
        canonical = f"person:{inn_clean}:{normalized_name}:{dob}"
    elif date_of_birth:
        canonical = f"person:{normalized_name}:{date_of_birth}"
    else:
        canonical = f"person:{normalized_name}"

    return generate_ueid(canonical)
