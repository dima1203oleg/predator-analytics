import logging
import httpx
from typing import Dict, Any

from app.config import CORE_API_URL

logger = logging.getLogger(__name__)

# Заголовки для HTTP-запитів до Core API
HEADERS = {"Content-Type": "application/json"}

async def get_system_status() -> str:
    """Отримує статус системи з Core API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CORE_API_URL}/api/v1/health", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                return f"✅ **Всі системи ONLINE**\n\nДеталі:\nCore API: {data.get('status', 'OK')}\nВерсія: {data.get('version', 'v56.5')}"
            return f"⚠️ **Увага:** Core API повернув статус {response.status_code}"
    except Exception as e:
        logger.error(f"Помилка перевірки статусу: {e}")
        return "❌ **Система недоступна!**\nНе вдалося підключитись до Core API."

async def perform_search(query: str, search_type: str) -> str:
    """Виконує гібридний пошук через API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CORE_API_URL}/api/v1/search?q={query}&limit=5", headers=HEADERS, timeout=10.0)
            if response.status_code == 200:
                results = response.json()
                if not results:
                    return f"🔍 За запитом `{query}` нічого не знайдено."
                
                res_str = f"🔍 **Результати пошуку ({search_type}):**\n\n"
                for i, res in enumerate(results[:5]):
                    name = res.get('name') or res.get('title') or 'Невідома сутність'
                    uid = res.get('id') or res.get('ueid') or 'N/A'
                    res_str += f"{i+1}. **{name}** (ID: `{uid}`)\n"
                return res_str
            return f"⚠️ Помилка пошуку (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка пошуку: {e}")
        return "❌ Сталася помилка при пошуку (перевірте підключення до API)."

async def ask_ai_copilot(query: str) -> str:
    """Запит до AI Copilot (DeepSeek/Nemotron)."""
    try:
        payload = {"message": query, "history": []}
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{CORE_API_URL}/api/v1/copilot/chat", json=payload, headers=HEADERS, timeout=30.0)
            if response.status_code == 200:
                data = response.json()
                return f"🧠 **AI Відповідь:**\n\n{data.get('reply', 'Немає відповіді')}"
            return f"⚠️ Помилка AI (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка AI: {e}")
        return "❌ AI наразі недоступний."

async def get_active_alerts() -> str:
    """Отримання активних загроз з бази даних."""
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
            return f"⚠️ Не вдалося отримати алерти (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка отримання алертів: {e}")
        return "❌ Не вдалося з'єднатися з базою алертів."

async def trigger_osint(entity: str) -> str:
    """Запуск процесу Ingestion Pipeline для сутності."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{CORE_API_URL}/api/v1/ingestion/trigger?source={entity}", headers=HEADERS, timeout=10.0)
            if response.status_code in (200, 202):
                data = response.json()
                status = data.get('status', 'triggered')
                return f"🌐 **OSINT Розвідка запущена!**\n\nЦіль: `{entity}`\nСтатус пайплайну: **{status}**\nСистема почала глибокий збір даних."
            return f"⚠️ Помилка ініціалізації OSINT (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка OSINT: {e}")
        return "❌ Не вдалося запустити Ingestion Worker."

async def analyze_graph_connections(query: str) -> str:
    """Пошук зв'язків у графі (Trinity Graph Engine)."""
    try:
        payload = {"q": query, "limit": 2}
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{CORE_API_URL}/api/v1/graph/search", json=payload, headers=HEADERS, timeout=15.0)
            if response.status_code == 200:
                data = response.json()
                nodes = data.get('nodes', [])
                edges = data.get('edges', [])
                
                if not nodes:
                    return f"🕸 У графі не знайдено зв'язків для `{query}`."
                
                res_str = f"🕸 **Граф-аналіз для `{query}`:**\n\nЗнайдено вузлів: {len(nodes)}\nЗнайдено зв'язків: {len(edges)}\n\n"
                for n in nodes[:5]:
                    res_str += f"- {n.get('label', 'Вузол')}: **{n.get('name', 'N/A')}**\n"
                
                res_str += f"\nПовний граф: [Відкрити у Web UI](http://194.177.1.240:3030/graph/{query})"
                return res_str
            return f"⚠️ Помилка Графу (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка Графу: {e}")
        return "❌ Neo4j Graph Engine недоступний."

async def generate_risk_report(ueid: str, report_type: str) -> str:
    """Генерація ризикового або фінансового звіту (використовує Risk API)."""
    try:
        if report_type == "Ризик-аналіз":
            url = f"{CORE_API_URL}/api/v1/risk/score?entities={ueid}"
        else:
            url = f"{CORE_API_URL}/api/v1/risk/insight/{ueid}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS, timeout=20.0)
            if response.status_code == 200:
                data = response.json()
                
                if report_type == "Ризик-аналіз":
                    scores = data.get('scores', [])
                    if not scores:
                        return f"❌ Ризик-скори для `{ueid}` не знайдено."
                    s = scores[0]
                    res_str = f"📄 **Ризик-звіт для {s.get('entity_name', ueid)}**\n\n"
                    res_str += f"CERS Індекс: **{s.get('cers', 0)}/100**\n"
                    res_str += f"Статус: **{s.get('interpretation', 'Невідомо')}**\n\n"
                    res_str += "[Завантажити PDF (Web UI)](http://194.177.1.240:3030/reports)"
                    return res_str
                else:
                    insight = data.get('insight', 'Дані відсутні')
                    return f"💰 **Фінансовий Інсайт для `{ueid}`:**\n\n{insight}"
            elif response.status_code == 404:
                 return f"❌ Сутність `{ueid}` не знайдена в базі."
            return f"⚠️ Помилка генерації звіту (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка звіту: {e}")
        return "❌ Сервіс генерації звітів (Risk Engine) недоступний."
