"""Банк контрольних запитів для валідації AI RAG після імпорту Excel-файлів.

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Кожен запит має:
- query: текст запиту до AI
- expected_fields: поля, які повинні бути згадані у відповіді
- validation_type: тип перевірки (contains, numeric_range, count, not_empty)
- source_hint: підказка про джерело (для перевірки source attribution)
"""
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ControlQuery:
    """Контрольний запит для валідації AI RAG."""

    query: str
    expected_fields: list[str] = field(default_factory=list)
    validation_type: str = "not_empty"
    expected_min: float | None = None
    expected_max: float | None = None
    source_hint: str = ""
    category: str = "general"
    severity: str = "required"  # required | recommended | optional


def get_static_queries() -> list[ControlQuery]:
    """Фіксований набір запитів, що не залежать від вмісту файлу."""
    return [
        # ─── Загальні запити ─────────────────────────────────────────────────
        ControlQuery(
            query="Скільки декларацій було за березень 2024?",
            expected_fields=["кількість", "декларацій", "березень"],
            validation_type="numeric_range",
            expected_min=1,
            category="general",
            severity="required",
        ),
        ControlQuery(
            query="Яка загальна кількість записів у реєстрі за березень 2024?",
            expected_fields=["записів", "реєстр"],
            validation_type="numeric_range",
            expected_min=1,
            category="general",
            severity="required",
        ),
        ControlQuery(
            query="Покажи перші 5 декларацій із файлу Березень_2024.xlsx",
            expected_fields=["декларація"],
            validation_type="not_empty",
            source_hint="Березень_2024.xlsx",
            category="general",
            severity="required",
        ),
        ControlQuery(
            query="З якого файлу були завантажені останні дані?",
            expected_fields=["Березень_2024", "xlsx"],
            validation_type="contains",
            category="general",
            severity="required",
        ),
        # ─── Запити за компаніями ────────────────────────────────────────────
        ControlQuery(
            query="Які компанії імпортували товари у березні 2024?",
            expected_fields=["компані"],
            validation_type="not_empty",
            category="company",
            severity="required",
        ),
        ControlQuery(
            query="Покажи ТОП-10 компаній за кількістю декларацій",
            expected_fields=["компані"],
            validation_type="not_empty",
            category="company",
            severity="required",
        ),
        ControlQuery(
            query="Покажи ТОП-10 компаній за митною вартістю у березні 2024",
            expected_fields=["вартість", "компані"],
            validation_type="not_empty",
            category="company",
            severity="required",
        ),
        ControlQuery(
            query="Скільки унікальних компаній (ЄДРПОУ) є в реєстрі?",
            expected_fields=["ЄДРПОУ", "компані"],
            validation_type="numeric_range",
            expected_min=1,
            category="company",
            severity="required",
        ),
        # ─── Запити за товарами ──────────────────────────────────────────────
        ControlQuery(
            query="Які найпоширеніші товари були імпортовані у березні 2024?",
            expected_fields=["товар"],
            validation_type="not_empty",
            category="product",
            severity="required",
        ),
        ControlQuery(
            query="Покажи статистику імпорту по кодах УКТЗЕД",
            expected_fields=["УКТЗЕД", "код"],
            validation_type="not_empty",
            category="product",
            severity="recommended",
        ),
        ControlQuery(
            query="Які товари мають найбільшу митну вартість?",
            expected_fields=["товар", "вартість"],
            validation_type="not_empty",
            category="product",
            severity="required",
        ),
        # ─── Запити за вартістю ──────────────────────────────────────────────
        ControlQuery(
            query="Яка загальна митна вартість за березень 2024?",
            expected_fields=["вартість"],
            validation_type="numeric_range",
            expected_min=0.01,
            category="value",
            severity="required",
        ),
        ControlQuery(
            query="Яка середня вартість декларації у березні 2024?",
            expected_fields=["середн", "вартість"],
            validation_type="numeric_range",
            expected_min=0.01,
            category="value",
            severity="recommended",
        ),
        ControlQuery(
            query="Які декларації мають вартість більше 1 мільйона?",
            expected_fields=["вартість"],
            validation_type="not_empty",
            category="value",
            severity="recommended",
        ),
        ControlQuery(
            query="Покажи розподіл митної вартості по компаніях",
            expected_fields=["вартість", "компані"],
            validation_type="not_empty",
            category="value",
            severity="optional",
        ),
        # ─── Запити за географією ────────────────────────────────────────────
        ControlQuery(
            query="З яких країн були імпорти у березні 2024?",
            expected_fields=["країн"],
            validation_type="not_empty",
            category="geography",
            severity="required",
        ),
        ControlQuery(
            query="Покажи ТОП-5 країн-експортерів за кількістю декларацій",
            expected_fields=["країн"],
            validation_type="not_empty",
            category="geography",
            severity="required",
        ),
        ControlQuery(
            query="Через які митні пости проходили товари у березні 2024?",
            expected_fields=["митн"],
            validation_type="not_empty",
            category="geography",
            severity="recommended",
        ),
        ControlQuery(
            query="Покажи статистику імпорту по митницях",
            expected_fields=["митниц"],
            validation_type="not_empty",
            category="geography",
            severity="optional",
        ),
        # ─── Запити за вагою ─────────────────────────────────────────────────
        ControlQuery(
            query="Яка загальна вага імпортованих товарів у березні 2024?",
            expected_fields=["ваг"],
            validation_type="numeric_range",
            expected_min=0.01,
            category="weight",
            severity="recommended",
        ),
        ControlQuery(
            query="Які товари мають найбільшу вагу?",
            expected_fields=["ваг", "товар"],
            validation_type="not_empty",
            category="weight",
            severity="optional",
        ),
        # ─── Перехресні перевірки ────────────────────────────────────────────
        ControlQuery(
            query="Порівняй кількість декларацій у березні 2024 з попередніми місяцями",
            expected_fields=["березень"],
            validation_type="not_empty",
            category="cross_check",
            severity="optional",
        ),
        ControlQuery(
            query="Які компанії вперше з'явились у реєстрі у березні 2024?",
            expected_fields=["компані"],
            validation_type="not_empty",
            category="cross_check",
            severity="optional",
        ),
        ControlQuery(
            query="Чи є аномальні значення вартості у березні 2024?",
            expected_fields=["вартість"],
            validation_type="not_empty",
            category="cross_check",
            severity="optional",
        ),
        # ─── Source Attribution ──────────────────────────────────────────────
        ControlQuery(
            query="Поясни, з якого джерела ти отримав дані про імпорт за березень 2024",
            expected_fields=["джерел", "файл"],
            validation_type="contains",
            source_hint="Березень_2024",
            category="source_attribution",
            severity="required",
        ),
    ]


def generate_dynamic_queries(
    file_metadata: dict[str, Any],
) -> list[ControlQuery]:
    """Генерує динамічні запити на основі вмісту файлу.

    Args:
        file_metadata: Метадані файлу (file_name, total_rows, sheets тощо).

    Returns:
        Список контрольних запитів, специфічних для файлу.
    """
    queries: list[ControlQuery] = []
    file_name = file_metadata.get("file_name", "")
    total_rows = file_metadata.get("total_rows", 0)

    # Запит на точну кількість записів
    queries.append(
        ControlQuery(
            query=f"Скільки записів було завантажено з файлу {file_name}?",
            expected_fields=["записів"],
            validation_type="numeric_range",
            expected_min=max(1, total_rows - 10),
            expected_max=total_rows + 10,
            source_hint=file_name,
            category="dynamic",
            severity="required",
        )
    )

    # Запити по аркушах
    sheet_count = file_metadata.get("sheet_count", 1)
    if sheet_count > 1:
        for sheet_name in file_metadata.get("sheet_names", []):
            queries.append(
                ControlQuery(
                    query=f"Покажи дані з аркуша '{sheet_name}' файлу {file_name}",
                    expected_fields=[sheet_name],
                    validation_type="not_empty",
                    category="dynamic",
                    severity="recommended",
                )
            )

    return queries


def get_all_queries(
    file_metadata: dict[str, Any] | None = None,
) -> list[ControlQuery]:
    """Повертає повний набір контрольних запитів.

    Комбінує статичні (фіксовані) та динамічні (згенеровані) запити.

    Args:
        file_metadata: Опціональні метадані файлу для динамічних запитів.

    Returns:
        Повний список контрольних запитів.
    """
    queries = get_static_queries()
    if file_metadata:
        queries.extend(generate_dynamic_queries(file_metadata))
    return queries
