"""Telegram Bot Configuration — PREDATOR Analytics v56.5
Централізоване зберігання текстів, клавіатур та налаштувань.
"""
from enum import Enum
import os

# ═══════════════════════════════════════════════════════════════════════════
# ІДЕНТИФІКАЦІЯ
# ═══════════════════════════════════════════════════════════════════════════

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

def _parse_admin_ids() -> set[int]:
    """Парсинг списку адмін ID з env (через кому або пробіл)."""
    raw = os.getenv("TELEGRAM_ADMIN_ID", "") or os.getenv("TELEGRAM_ADMIN_IDS", "")
    ids: set[int] = set()
    for part in raw.replace(",", " ").split():
        part = part.strip()
        if part.isdigit():
            ids.add(int(part))
    return ids

ADMIN_IDS: set[int] = _parse_admin_ids()

# Гарантуємо, що основний оператор завжди має доступ
_FALLBACK_ADMIN = 449035630
if _FALLBACK_ADMIN not in ADMIN_IDS:
    ADMIN_IDS.add(_FALLBACK_ADMIN)

# Для зворотної сумісності
ADMIN_ID: int = next(iter(ADMIN_IDS), 0)

# ═══════════════════════════════════════════════════════════════════════════
# КОНСТАНТИ
# ═══════════════════════════════════════════════════════════════════════════

PAGINATION_SIZE = 10
BOT_VERSION = "v56.5-ELITE"

class BotStates(Enum):
    MAIN_MENU = "MAIN_MENU"
    AWAITING_INPUT = "AWAITING_INPUT"
    CHAT_WITH_AI = "CHAT_WITH_AI"
    CONFIRMATION = "CONFIRMATION"

# ═══════════════════════════════════════════════════════════════════════════
# ТЕКСТИ (100% УКРАЇНСЬКОЮ — HR-04)
# ═══════════════════════════════════════════════════════════════════════════

MESSAGES = {
    "welcome": (
        f"🦅 *PREDATOR Analytics {BOT_VERSION}*\n"
        "━━━━━━━━━━━━━━━━━━━━━\n"
        "Система активована. Канал захищено.\n\n"
        "Оберіть модуль або надішліть текстовий запит:"
    ),
    "help": (
        "📋 *Доступні команди:*\n\n"
        "/start — Головне меню\n"
        "/help — Ця довідка\n"
        "/status — Статус системи\n"
        "/search `<запит>` — Швидкий пошук\n"
        "/ai `<запит>` — Запитати ШІ\n"
        "/osint `<запит>` — OSINT Розвідка\n"
        "/report — Згенерувати звіт\n\n"
        "💡 Також можна просто надіслати текст — ШІ обробить запит автоматично."
    ),
    "access_denied": "⛔ *Доступ заборонено*\nВи не авторизовані для використання цієї системи.",
    "unknown_command": "❓ Невідома команда. Спробуйте /help",
    "processing": "⏳ Обробка запиту через Cortex...",
    "success": "✅ Операцію виконано успішно.",
    "error": "❌ Сталася помилка: {error}",
    "no_query": "⚠️ Вкажіть запит після команди.\nПриклад: `/search митниця Одеса`",
}
