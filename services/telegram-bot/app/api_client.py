import logging
import httpx
from typing import Dict, Any

from app.config import CORE_API_URL

logger = logging.getLogger(__name__)

# TODO: Для production використання тут слід використовувати реальний JWT токен
# Оскільки бот headless і в закритій мережі, ми розраховуємо на MOCK або внутрішній Bypass.
HEADERS = {"Content-Type": "application/json"}

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
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CORE_API_URL}/api/v1/search?q={query}&limit=5", headers=HEADERS, timeout=10.0)
            if response.status_code == 200:
                results = response.json()
                if not results:
                    return f"🔍 За запитом `{query}` нічого не знайдено."
                
                res_str = f"🔍 **Результати пошуку ({search_type}):**\n\n"
                for i, res in enumerate(results[:5]):
                    res_str += f"{i+1}. **{res.get('name', 'Невідомо')}** (ID: {res.get('id', 'N/A')})\n"
                return res_str
            else:
                return f"⚠️ Помилка пошуку (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка пошуку: {e}")
        return "❌ Сталася помилка при пошуку (перевірте підключення до API)."

async def ask_ai_copilot(query: str) -> str:
    """Запит до AI Copilot."""
    try:
        payload = {"message": query, "history": []}
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{CORE_API_URL}/api/v1/copilot/chat", json=payload, headers=HEADERS, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                return f"🧠 **AI Відповідь:**\n\n{data.get('reply', 'Немає відповіді')}"
            else:
                return f"⚠️ Помилка AI (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка AI: {e}")
        return "❌ AI наразі недоступний."

async def get_active_alerts() -> str:
    """Отримання активних загроз."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CORE_API_URL}/api/v1/alerts?limit=5", headers=HEADERS, timeout=5.0)
            if response.status_code == 200:
                alerts = response.json()
                if not alerts:
                    return "✅ Немає активних загроз."
                
                res_str = "🚨 **Останні Активні Загрози:**\n\n"
                for a in alerts:
                    res_str += f"❗️ **{a.get('title', 'Без назви')}** ({a.get('severity', 'UNKNOWN')})\n{a.get('description', '')}\n\n"
                return res_str
            else:
                return f"⚠️ Не вдалося отримати алерти (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка отримання алертів: {e}")
        return "❌ Не вдалося з'єднатися з базою алертів."

async def trigger_osint(entity: str) -> str:
    """Запуск OSINT-розвідки (моковано до підключення Ingestion API)."""
    return f"🌐 **OSINT Розвідка запущена**\n\nЦіль: `{entity}`\nСистема почала збір даних з відкритих джерел, реєстрів та соцмереж. Ви отримаєте сповіщення по завершенню."
