import logging
import httpx
import html
from typing import Dict, Any

from app.config import CORE_API_URL, WEB_UI_URL

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
                return f"✅ <b>Всі системи ONLINE</b>\n\nДеталі:\nCore API: {html.escape(str(data.get('status', 'OK')))}\nВерсія: {html.escape(str(data.get('version', 'v56.5')))}"
            return f"⚠️ <b>Увага:</b> Core API повернув статус {response.status_code}"
    except Exception as e:
        logger.error(f"Помилка перевірки статусу: {e}")
        return "❌ <b>Система недоступна!</b>\nНе вдалося підключитись до Core API."

async def perform_search(query: str, search_type: str) -> str:
    """Виконує гібридний пошук через API."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{CORE_API_URL}/api/v1/search?q={query}&limit=5", headers=HEADERS, timeout=10.0)
            if response.status_code == 200:
                results = response.json()
                if not results:
                    return f"🔍 За запитом <code>{html.escape(query)}</code> нічого не знайдено."
                
                res_str = f"🔍 <b>Результати пошуку ({html.escape(search_type)}):</b>\n\n"
                for i, res in enumerate(results[:5]):
                    name = html.escape(str(res.get('name') or res.get('title') or 'Невідома сутність'))
                    uid = html.escape(str(res.get('id') or res.get('ueid') or 'N/A'))
                    res_str += f"{i+1}. <b>{name}</b> (ID: <code>{uid}</code>)\n"
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
                return f"🧠 <b>AI Відповідь:</b>\n\n{html.escape(str(data.get('reply', 'Немає відповіді')))}"
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
                
                res_str = "🚨 <b>Останні Активні Загрози:</b>\n\n"
                for a in alerts:
                    title = html.escape(str(a.get('title', 'Без назви')))
                    severity = html.escape(str(a.get('severity', 'UNKNOWN')))
                    desc = html.escape(str(a.get('description', '')))
                    res_str += f"❗️ <b>{title}</b> ({severity})\n{desc}\n\n"
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
                status = html.escape(str(data.get('status', 'triggered')))
                return f"🌐 <b>OSINT Розвідка запущена!</b>\n\nЦіль: <code>{html.escape(entity)}</code>\nСтатус пайплайну: <b>{status}</b>\nСистема почала глибокий збір даних."
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
                    return f"🕸 У графі не знайдено зв'язків для <code>{html.escape(query)}</code>."
                
                res_str = f"🕸 <b>Граф-аналіз для <code>{html.escape(query)}</code>:</b>\n\nЗнайдено вузлів: {len(nodes)}\nЗнайдено зв'язків: {len(edges)}\n\n"
                for n in nodes[:5]:
                    label = html.escape(str(n.get('label', 'Вузол')))
                    name = html.escape(str(n.get('name', 'N/A')))
                    res_str += f"- {label}: <b>{name}</b>\n"
                
                res_str += f'\nПовний граф: <a href="{WEB_UI_URL}/graph/{html.escape(query)}">Відкрити у Web UI</a>'
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
                        return f"❌ Ризик-скори для <code>{html.escape(ueid)}</code> не знайдено."
                    s = scores[0]
                    entity_name = html.escape(str(s.get('entity_name', ueid)))
                    cers = html.escape(str(s.get('cers', 0)))
                    interp = html.escape(str(s.get('interpretation', 'Невідомо')))
                    res_str = f"📄 <b>Ризик-звіт для {entity_name}</b>\n\n"
                    res_str += f"CERS Індекс: <b>{cers}/100</b>\n"
                    res_str += f"Статус: <b>{interp}</b>\n\n"
                    res_str += f'<a href="{WEB_UI_URL}/reports">Завантажити PDF (Web UI)</a>'
                    return res_str
                else:
                    insight = html.escape(str(data.get('insight', 'Дані відсутні')))
                    return f"💰 <b>Фінансовий Інсайт для <code>{html.escape(ueid)}</code>:</b>\n\n{insight}"
            elif response.status_code == 404:
                 return f"❌ Сутність <code>{html.escape(ueid)}</code> не знайдена в базі."
            return f"⚠️ Помилка генерації звіту (Код: {response.status_code})"
    except Exception as e:
        logger.error(f"Помилка звіту: {e}")
        return "❌ Сервіс генерації звітів (Risk Engine) недоступний."
