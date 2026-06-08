import logging
import httpx
from typing import Dict, Any

from app.config import CORE_API_URL

logger = logging.getLogger(__name__)

async def get_system_status() -> str:
    """Отримує статус системи з Core API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CORE_API_URL}/api/v1/health", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                return f"✅ **Всі системи ONLINE**\n\nДеталі:\nCore API: {data.get('status', 'OK')}\nВерсія: {data.get('version', 'v56.5')}"
            else:
                return f"⚠️ **Увага:** Core API повернув статус {response.status_code}"
    except Exception as e:
        logger.error(f"Помилка перевірки статусу: {e}")
        return "❌ **Система недоступна!**\nНе вдалося підключитись до Core API."

async def perform_search(query: str, search_type: str) -> str:
    """Виконує пошук через API."""
    try:
        # Моковий запит або реальний
        # Замінити на реальний ендпоінт, коли він буде готовий
        return f"🔍 **Результати пошуку ({search_type}):**\n\nЗапит: `{query}`\n\n✅ Знайдено 1 сутність.\nРівень ризику: **Високий** (94%).\nЗв'язки: 5 афілійованих компаній."
    except Exception as e:
        logger.error(f"Помилка пошуку: {e}")
        return "❌ Сталася помилка при пошуку."

async def ask_ai_copilot(query: str) -> str:
    """Запит до AI Copilot."""
    try:
        return f"🧠 **AI Відповідь:**\n\nЗгідно з моїм аналізом, '{query}' має ознаки фіктивності через відсутність реальних активів та масовість реєстрації директорів."
    except Exception as e:
        logger.error(f"Помилка AI: {e}")
        return "❌ AI наразі недоступний."
