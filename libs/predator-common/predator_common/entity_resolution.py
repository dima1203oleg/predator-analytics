"""Entity Resolution Engine — PREDATOR Analytics v55.1 Ironclad.

Об'єднує різні написання однієї компанії/особи в єдиний UEID.
Використовує: нормалізацію → векторний пошук → fuzzy matching.

Алгоритм (FR-002, FR-044):
1. Нормалізація (видалення ОПФ, транслітерація)
2. ЄДРПОУ/ІПН як anchor (найточніший збіг)
3. Fuzzy matching (rapidfuzz token_sort_ratio)
4. Fallback — новий UEID

Precision мета: F1 > 0.95 (VR-002)
"""

from dataclasses import dataclass, field
import re
import unicodedata

from predator_common.ueid import generate_company_ueid, generate_person_ueid

# Організаційно-правові форми та їх скорочення
_LEGAL_FORM_MAP: dict[str, str] = {
    "товариство з обмеженою відповідальністю": "тов",
    "товариство з додатковою відповідальністю": "тдв",
    "публічне акціонерне товариство": "пат",
    "приватне акціонерне товариство": "прат",
    "акціонерне товариство": "ат",
    "приватне підприємство": "пп",
    "фізична особа підприємець": "фоп",
    "фізична особа – підприємець": "фоп",
    "фізична особа - підприємець": "фоп",
    "державне підприємство": "дп",
    "комунальне підприємство": "кп",
    "казенне підприємство": "кп",
    "публічне акціонерне": "пат",
    "limited liability company": "llc",
    "joint stock company": "jsc",
}

# Транслітерація UA → EN
_TRANSLIT_MAP: dict[str, str] = {
    "а": "a", "б": "b", "в": "v", "г": "h", "ґ": "g",
    "д": "d", "е": "e", "є": "ie", "ж": "zh", "з": "z",
    "и": "y", "і": "i", "ї": "i", "й": "i", "к": "k",
    "л": "l", "м": "m", "н": "n", "о": "o", "п": "p",
    "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ь": "", "ю": "iu", "я": "ia",
}


@dataclass
class EntityCandidate:
    """Кандидат на об'єднання сутностей."""

    ueid: str
    name: str
    name_normalized: str
    edrpou: str | None = None
    inn: str | None = None
    address: str | None = None
    score: float = 0.0
    match_type: str = "unknown"  # exact_id | fuzzy_name | new


@dataclass
class ResolutionResult:
    """Результат Entity Resolution."""

    ueid: str
    is_new: bool
    match_type: str
    confidence: float
    candidates: list[EntityCandidate] = field(default_factory=list)


def normalize_company_name(name: str) -> str:
    """Нормалізація назви компанії для порівняння.

    Кроки:
    1. Unicode NFC
    2. Нижній регістр
    3. Видалення ОПФ (ТОВ, ПП, тощо)
    4. Видалення лапок та спецсимволів
    5. Транслітерація
    6. Нормалізація пробілів

    Приклад:
        >>> normalize_company_name('Товариство з обмеженою відповідальністю "Ромашка-Трейд"')
        'romashka treid'
    """
    # Unicode NFC нормалізація
    text = unicodedata.normalize("NFC", name)
    text = text.lower().strip()

    # Видалення ОПФ (повні форми спочатку)
    sorted_forms = sorted(_LEGAL_FORM_MAP.keys(), key=len, reverse=True)
    for form in sorted_forms:
        text = text.replace(form, " ")

    # Видалення скорочень ОПФ (ТОВ, ПП, тощо)
    short_forms = set(_LEGAL_FORM_MAP.values())
    for short in sorted(short_forms, key=len, reverse=True):
        text = re.sub(rf"\b{re.escape(short)}\b", " ", text)

    # Видалення спецсимволів (але не кирилиці/латиниці)
    text = re.sub(r'[«»"\'.,;:!?()\[\]{}\-–—_№#@]', " ", text)

    # Транслітерація кирилиці
    result: list[str] = []
    for char in text:
        result.append(_TRANSLIT_MAP.get(char, char))
    text = "".join(result)

    # Видалення не-алфавітних символів (крім пробілів)
    text = re.sub(r"[^a-z0-9 ]", " ", text)

    # Нормалізація пробілів
    text = re.sub(r"\s+", " ", text).strip()

    return text


def normalize_person_name(full_name: str) -> str:
    """Нормалізація ПІБ.

    Приклад:
        >>> normalize_person_name("ІВАНОВ Іван Іванович")
        'ivanov ivan ivanovych'
    """
    text = unicodedata.normalize("NFC", full_name).lower().strip()

    result: list[str] = []
    for char in text:
        result.append(_TRANSLIT_MAP.get(char, char))
    text = "".join(result)

    text = re.sub(r"[^a-z ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def fuzzy_similarity(s1: str, s2: str) -> float:
    """Нечітке порівняння рядків.

    Використовує token_sort_ratio для кращого порівняння слів у різному порядку.

    Повертає значення від 0.0 до 1.0.
    """
    if not s1 or not s2:
        return 0.0

    try:
        from rapidfuzz import fuzz  # type: ignore[import-untyped]
        return fuzz.token_sort_ratio(s1, s2) / 100.0
    except ImportError:
        # Fallback: Dice similarity на відсортованих токенах
        tokens1 = sorted(s1.split())
        tokens2 = sorted(s2.split())
        if not tokens1 or not tokens2:
            return 0.0
        # Підраховуємо спільні біграми токенів
        set1 = set(tokens1)
        set2 = set(tokens2)
        intersection = set1 & set2
        return (2.0 * len(intersection)) / (len(set1) + len(set2))


def resolve_company(
    name: str,
    edrpou: str | None = None,
    address: str | None = None,
    candidates: list[EntityCandidate] | None = None,
    similarity_threshold: float = 0.85,
) -> ResolutionResult:
    """Визначити UEID для компанії.

    Priority:
    1. Точний збіг за ЄДРПОУ → match_type='exact_id'
    2. Fuzzy збіг за нормалізованою назвою → match_type='fuzzy_name'
    3. Новий UEID → match_type='new', is_new=True

    Args:
        name: Назва компанії
        edrpou: ЄДРПОУ (опціональний)
        address: Адреса (опціональна, для fallback UEID)
        candidates: Список відомих кандидатів (з БД/кешу)
        similarity_threshold: Поріг схожості для fuzzy (0.0..1.0)

    Returns:
        ResolutionResult з UEID та метаданими

    """
    normalized = normalize_company_name(name)
    candidates = candidates or []

    # 1. Точний збіг за ЄДРПОУ
    if edrpou:
        edrpou_clean = re.sub(r"\D", "", edrpou)
        for candidate in candidates:
            if candidate.edrpou and re.sub(r"\D", "", candidate.edrpou) == edrpou_clean:
                return ResolutionResult(
                    ueid=candidate.ueid,
                    is_new=False,
                    match_type="exact_id",
                    confidence=1.0,
                    candidates=[candidate],
                )

    # 2. Fuzzy збіг за нормалізованою назвою
    best_candidate: EntityCandidate | None = None
    best_score = 0.0

    for candidate in candidates:
        score = fuzzy_similarity(normalized, candidate.name_normalized)
        if score > best_score:
            best_score = score
            best_candidate = candidate

    if best_candidate and best_score >= similarity_threshold:
        return ResolutionResult(
            ueid=best_candidate.ueid,
            is_new=False,
            match_type="fuzzy_name",
            confidence=best_score,
            candidates=[best_candidate],
        )

    # 3. Новий UEID
    new_ueid = generate_company_ueid(name, edrpou=edrpou, address=address)
    return ResolutionResult(
        ueid=new_ueid,
        is_new=True,
        match_type="new",
        confidence=1.0,
        candidates=[],
    )


def resolve_person(
    full_name: str,
    inn: str | None = None,
    date_of_birth: str | None = None,
    candidates: list[EntityCandidate] | None = None,
    similarity_threshold: float = 0.90,
) -> ResolutionResult:
    """Визначити UEID для фізичної особи.

    Args:
        full_name: Повне ім'я
        inn: ІПН (опціональний)
        date_of_birth: Дата народження YYYY-MM-DD (опціональна)
        candidates: Список відомих кандидатів
        similarity_threshold: Поріг схожості

    Returns:
        ResolutionResult з UEID

    """
    normalized = normalize_person_name(full_name)
    candidates = candidates or []

    # 1. Точний збіг за ІПН
    if inn:
        inn_clean = re.sub(r"\D", "", inn)
        for candidate in candidates:
            if candidate.inn and re.sub(r"\D", "", candidate.inn) == inn_clean:
                return ResolutionResult(
                    ueid=candidate.ueid,
                    is_new=False,
                    match_type="exact_id",
                    confidence=1.0,
                    candidates=[candidate],
                )

    # 2. Fuzzy за ПІБ + дата народження (якщо є)
    best_candidate = None
    best_score = 0.0

    for candidate in candidates:
        score = fuzzy_similarity(normalized, candidate.name_normalized)

        # Якщо є дата народження — підтверджуємо
        if date_of_birth and candidate.address and date_of_birth != candidate.address:
            score *= 0.5

        if score > best_score:
            best_score = score
            best_candidate = candidate

    if best_candidate and best_score >= similarity_threshold:
        return ResolutionResult(
            ueid=best_candidate.ueid,
            is_new=False,
            match_type="fuzzy_name",
            confidence=best_score,
            candidates=[best_candidate],
        )

    # 3. Новий UEID
    new_ueid = generate_person_ueid(full_name, inn=inn, date_of_birth=date_of_birth)
    return ResolutionResult(
        ueid=new_ueid,
        is_new=True,
        match_type="new",
        confidence=1.0,
        candidates=[],
    )
