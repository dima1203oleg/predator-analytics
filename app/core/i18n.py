"""Predator v55.0 — Backend Internationalization (Ukrainian primary).

All user-facing labels MUST be in Ukrainian.
All technical identifiers MUST be in English.
Russian language is FORBIDDEN.
"""

from __future__ import annotations

from enum import StrEnum

# ═══════════════════════════════════════════════════════════════
# CERS Risk Levels
# ═══════════════════════════════════════════════════════════════


class CERSLevel(StrEnum):
    STABLE = "stable"
    WATCHLIST = "watchlist"
    ELEVATED = "elevated"
    HIGH_ALERT = "high_alert"
    CRITICAL = "critical"


CERS_LEVELS_UA: dict[str, str] = {
    "stable": "Стабільний",
    "watchlist": "Під спостереженням",
    "elevated": "Підвищений",
    "high_alert": "Висока загроза",
    "critical": "Критичний",
}

CERS_LEVELS_EN: dict[str, str] = {
    "stable": "Stable",
    "watchlist": "Watchlist",
    "elevated": "Elevated",
    "high_alert": "High Alert",
    "critical": "Critical",
}


def get_cers_level(score: float) -> str:
    """Determine CERS level from numeric score (0-100)."""
    if score <= 20:
        return CERSLevel.STABLE
    if score <= 40:
        return CERSLevel.WATCHLIST
    if score <= 60:
        return CERSLevel.ELEVATED
    if score <= 80:
        return CERSLevel.HIGH_ALERT
    return CERSLevel.CRITICAL


def get_cers_label(level: str, lang: str = "uk") -> str:
    """Get localized label for CERS level."""
    labels = CERS_LEVELS_UA if lang == "uk" else CERS_LEVELS_EN
    return labels.get(level, level)


# ═══════════════════════════════════════════════════════════════
# Signal Types
# ═══════════════════════════════════════════════════════════════

SIGNAL_TYPES_UA: dict[str, str] = {
    "anomaly": "Аномалія",
    "alert": "Тривога",
    "warning": "Попередження",
    "info": "Інформація",
    "prediction": "Прогноз",
    "pattern": "Патерн",
    "correlation": "Кореляція",
    "trend": "Тренд",
}

SIGNAL_TYPES_EN: dict[str, str] = {
    "anomaly": "Anomaly",
    "alert": "Alert",
    "warning": "Warning",
    "info": "Information",
    "prediction": "Prediction",
    "pattern": "Pattern",
    "correlation": "Correlation",
    "trend": "Trend",
}


# ═══════════════════════════════════════════════════════════════
# Entity Types
# ═══════════════════════════════════════════════════════════════

ENTITY_TYPES_UA: dict[str, str] = {
    "company": "Компанія",
    "person": "Особа",
    "broker": "Брокер",
    "customs_post": "Митний пост",
    "product": "Товар",
    "regulatory_event": "Регуляторна подія",
    "tender": "Тендер",
    "media_mention": "Згадка в медіа",
}

ENTITY_TYPES_EN: dict[str, str] = {
    "company": "Company",
    "person": "Person",
    "broker": "Broker",
    "customs_post": "Customs Post",
    "product": "Product",
    "regulatory_event": "Regulatory Event",
    "tender": "Tender",
    "media_mention": "Media Mention",
}


# ═══════════════════════════════════════════════════════════════
# Index Names
# ═══════════════════════════════════════════════════════════════

INDEX_NAMES_UA: dict[str, str] = {
    "bvi": "Індекс поведінкової волатильності",
    "ass": "Швидкість адаптації",
    "cp": "Ймовірність колапсу",
    "aai": "Індекс адміністративної асиметрії",
    "pls": "Індекс лояльності до поста",
    "im": "Маса впливу",
    "hci": "Індекс прихованої концентрації",
    "mci": "Індекс відсутнього ланцюга",
    "pfi": "Індекс фантомного потоку",
    "cers": "Композитний індекс економічного ризику",
}


# ═══════════════════════════════════════════════════════════════
# Error Messages
# ═══════════════════════════════════════════════════════════════

ERRORS_UA: dict[str, str] = {
    "not_found": "Не знайдено",
    "unauthorized": "Не авторизовано",
    "forbidden": "Доступ заборонено",
    "validation_error": "Помилка валідації",
    "server_error": "Внутрішня помилка сервера",
    "file_too_large": "Файл занадто великий",
    "unsupported_format": "Непідтримуваний формат файлу",
    "connection_error": "Помилка з'єднання",
    "timeout": "Час очікування вичерпано",
    "entity_not_found": "Суб'єкт не знайдений",
    "duplicate_entity": "Суб'єкт вже існує",
    "ingestion_failed": "Помилка завантаження даних",
    "calculation_error": "Помилка обчислення",
    "insufficient_data": "Недостатньо даних для аналізу",
    "decision_immutable": "Рішення незмінне (WORM). UPDATE/DELETE заборонено.",
}


# ═══════════════════════════════════════════════════════════════
# Analytical Layers
# ═══════════════════════════════════════════════════════════════

LAYERS_UA: dict[str, str] = {
    "behavioral": "Поведінковий",
    "institutional": "Інституційний",
    "influence": "Впливовий",
    "structural": "Структурний",
    "predictive": "Прогностичний",
}


# ═══════════════════════════════════════════════════════════════
# Helper function
# ═══════════════════════════════════════════════════════════════


def t(key: str, lang: str = "uk", category: str = "errors") -> str:
    """Translate a key to the given language.

    Args:
        key: Translation key.
        lang: Language code ('uk' or 'en').
        category: One of 'errors', 'signals', 'entities', 'indices', 'layers', 'cers'.

    Returns:
        Localized string or the key itself as fallback.

    """
    catalogs: dict[str, dict[str, dict[str, str]]] = {
        "errors": {"uk": ERRORS_UA, "en": {}},
        "signals": {"uk": SIGNAL_TYPES_UA, "en": SIGNAL_TYPES_EN},
        "entities": {"uk": ENTITY_TYPES_UA, "en": ENTITY_TYPES_EN},
        "indices": {"uk": INDEX_NAMES_UA, "en": {}},
        "layers": {"uk": LAYERS_UA, "en": {}},
        "cers": {"uk": CERS_LEVELS_UA, "en": CERS_LEVELS_EN},
    }
    catalog = catalogs.get(category, {}).get(lang, {})
    return catalog.get(key, key)
