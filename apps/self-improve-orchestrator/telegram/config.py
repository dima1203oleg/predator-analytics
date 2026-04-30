"""Telegram Bot Configuration
Centralized storage for texts, keyboard layouts, and settings.
"""
from enum import Enum
import os

# Bot Token
BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
ADMIN_ID = int(os.getenv("TELEGRAM_ADMIN_ID", "0"))

# Constants
PAGINATION_SIZE = 10

class BotStates(Enum):
    MAIN_MENU = "MAIN_MENU"
    AWAITING_INPUT = "AWAITING_INPUT"
    CHAT_WITH_AI = "CHAT_WITH_AI"
    CONFIRMATION = "CONFIRMATION"

# Keyboard Layouts
MENUS = {
    "main": [
        [{"text": "🤖 Управління ШІ", "callback_data": "menu_ai"}, {"text": "📊 Аналітика", "callback_data": "menu_analytics"}],
        [{"text": "🛠 Система", "callback_data": "menu_system"}, {"text": "🐙 Git Ops", "callback_data": "menu_git"}],
        [{"text": "🔍 Пошук", "callback_data": "menu_search"}, {"text": "📂 База знань", "callback_data": "menu_knowledge"}],
        [{"text": "💬 Чат з Копілотом", "callback_data": "start_chat"}]
    ],
    "ai": [
        [{"text": "🧠 Рада LLM", "callback_data": "ai_council"}, {"text": "⚡ Статус агентів", "callback_data": "ai_agents"}],
        [{"text": "🔗 Потрійний ланцюг", "callback_data": "ai_triple_chain"}, {"text": "🔄 Самовдосконалення", "callback_data": "ai_improve"}],
        [{"text": "🔙 Назад", "callback_data": "menu_main"}]
    ],
    "system": [
        [{"text": "🏥 Перевірка стану", "callback_data": "sys_health"}, {"text": "📈 Prometheus", "callback_data": "sys_prometheus"}],
        [{"text": "📦 Деплой ArgoCD", "callback_data": "sys_deploy"}, {"text": "🧹 Очистити кеш", "callback_data": "sys_cache"}],
        [{"text": "🔙 Назад", "callback_data": "menu_main"}]
    ],
    "git": [
        [{"text": "📥 Оновити код", "callback_data": "git_pull"}, {"text": "📜 Статус", "callback_data": "git_status"}],
        [{"text": "📝 Логи", "callback_data": "git_log"}, {"text": "🔙 Назад", "callback_data": "menu_main"}]
    ]
}

# Texts
MESSAGES = {
    "welcome": "🚀 *Predator Analytics v45.0 - Omniscient Center*\n\nСистема активована. Канал зв'язку захищено.\nОберіть модуль для управління або надішліть голосову команду:",
    "access_denied": "⛔ *Доступ заборонено*\nВи не авторизовані для використання цієї системи.",
    "unknown_command": "❓ Невідома команда або інтент.",
    "processing": "⏳ Обробка запиту через Cortex...",
    "success": "✅ Операцію виконано успішно.",
    "error": "❌ Сталася помилка: {error}",
    "chat_mode": "💬 *Режим ШІ-чату*\nНадішліть повідомлення для початку діалогу.\nВведіть /cancel для виходу.",
    "chat_exit": "👋 Чат завершено.",
}
