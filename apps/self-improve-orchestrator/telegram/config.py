"""
Telegram Bot Configuration
Centralized storage for texts, keyboard layouts, and settings.
"""
import os
from enum import Enum

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
        [{"text": "🤖 AI Control", "callback_data": "menu_ai"}, {"text": "📊 Analytics", "callback_data": "menu_analytics"}],
        [{"text": "🛠 System", "callback_data": "menu_system"}, {"text": "🐙 Git Ops", "callback_data": "menu_git"}],
        [{"text": "🔍 Search", "callback_data": "menu_search"}, {"text": "📂 Knowledge", "callback_data": "menu_knowledge"}],
        [{"text": "💬 Chat with Copilot", "callback_data": "start_chat"}]
    ],
    "ai": [
        [{"text": "🧠 LLM Council", "callback_data": "ai_council"}, {"text": "⚡ Agents Status", "callback_data": "ai_agents"}],
        [{"text": "🔄 Run Self-Improvement", "callback_data": "ai_improve"}, {"text": "🔙 Back", "callback_data": "menu_main"}]
    ],
    "system": [
        [{"text": "🏥 Health Check", "callback_data": "sys_health"}, {"text": "📈 Resources", "callback_data": "sys_resources"}],
        [{"text": "🔄 Restart Services", "callback_data": "sys_restart"}, {"text": "🧹 Clear Cache", "callback_data": "sys_cache"}],
        [{"text": "🔙 Back", "callback_data": "menu_main"}]
    ],
    "git": [
        [{"text": "📥 Pull Updates", "callback_data": "git_pull"}, {"text": "📜 Status", "callback_data": "git_status"}],
        [{"text": "📝 Log", "callback_data": "git_log"}, {"text": "🔙 Back", "callback_data": "menu_main"}]
    ]
}

# Texts
MESSAGES = {
    "welcome": "🚀 *Predator Analytics v22.0*\n\nSystem operational.\nSelect a module to control:",
    "access_denied": "⛔ *Access Denied*\nYou are not authorized to use this bot.",
    "unknown_command": "❓ Unknown command.",
    "processing": "⏳ Processing...",
    "success": "✅ Operation successful.",
    "error": "❌ Error occurred: {error}",
    "chat_mode": "💬 *AI Chat Mode*\nSend me a message to start a conversation.\nType /cancel to exit.",
    "chat_exit": "👋 Chat ended.",
}
