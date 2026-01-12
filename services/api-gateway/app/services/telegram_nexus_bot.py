"""
[DEPRECATED] Consolidation in progress.
Logic moved to apps/telegram-bot microservice.
Please use that instead.
"""
"""
Predator Analytics Nexus Telegram Bot - Інтелектуальний пульт управління
Інтеграція з мультиагентною системою, оркестрацією та арбітражем
"""
import os
import logging
from typing import Dict, Any, Optional
import httpx

from .telegram_assistant import TelegramAssistant
from .triple_agent_service import triple_agent_service
from .monitoring_service import monitoring_service

logger = logging.getLogger(__name__)


class NexusTelegramBot(TelegramAssistant):
    """
    Розширений Telegram бот з інтеграцією в Nexus Core
    - Природномовні команди через LLM
    - Оркестрація агентів
    - Арбітраж між моделями
    - Автономне прийняття рішень
    """

    def __init__(self, token: str):
        super().__init__(token)
        self.nexus_api_url = os.getenv("NEXUS_API_URL", "http://localhost:8000")
        self.enable_autonomous = os.getenv("TELEGRAM_AUTONOMOUS_MODE", "true").lower() == "true"

        # Додаткові команди для Nexus
        self.system_commands.update({
            # Агенти та оркестрація
            "agents": self._cmd_agents_status,
            "orchestrate": self._cmd_orchestrate,
            "arbiter": self._cmd_arbiter_status,

            # Датасети та аналітика
            "datasets": self._cmd_datasets_list,
            "analyze": self._cmd_analyze_dataset,
            "anomalies": self._cmd_find_anomalies,
            "forecast": self._cmd_forecast,

            # ML та моделі
            "models": self._cmd_models_status,
            "train": self._cmd_train_model,
            "inference": self._cmd_run_inference,

            # Система
            "health": self._cmd_system_health,
            "metrics": self._cmd_system_metrics,
            "queues": self._cmd_queues_status,
            "triple": self._cmd_triple_agent,
            "self_improve": self._cmd_self_improvement,
        })

    async def _process_natural_language(self, text: str, user_id: int) -> str:
        """
        Обробка природномовних команд через LLM
        Визначає намір користувача та викликає відповідні агенти
        """
        try:
            # Використовуємо Triple Agent Orchestrator для обробки запиту
            logger.info(f"Processing command via Triple Agent: {text}")
            result = await triple_agent_service.process_command(text)

            if not result.get("success"):
                error_msg = result.get("error", "Unknown error")
                audit = result.get("audit_report", "")
                return f"⚠️ **Помилка за протоколом Triple Agent**\n\nПричина: {error_msg}\n\nЗвіт аудиту:\n{audit}"

            # Format plan if it is a list
            plan_str = result.get('plan', [])
            if isinstance(plan_str, list):
                plan_str = "\n".join([f"- {step}" for step in plan_str])

            response = f"🎯 **Інтент:** {result.get('intent')}\n\n"
            response += f"📋 **План:**\n{plan_str}\n\n"
            response += f"💻 **Згенерований код:**\n```python\n{result.get('code')}\n```\n\n"
            response += f"🛡 **Звіт аудиту (Aider):**\n{result.get('audit_report')}\n\n"
            response += f"🚀 **Статус:** {result.get('status')}"

            return response

        except Exception as e:
            logger.error(f"Triple Agent processing error: {e}")
            return f"❌ Помилка обробки запиту: {str(e)}\n\nСпробуйте переформулювати або використайте команду /help"

    async def _execute_orchestrated_task(self, intent_data: Dict[str, Any]) -> str:
        """
        Виконує задачу через оркестрацію агентів
        """
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"{self.nexus_api_url}/api/v1/orchestrate",
                    json={
                        "intent": intent_data.get("intent"),
                        "agents": intent_data.get("agents", []),
                        "params": intent_data.get("params", {}),
                        "use_arbiter": True
                    }
                )
                result = response.json()

                return self._format_orchestration_result(result)

        except Exception as e:
            logger.error(f"Orchestration error: {e}")
            return f"❌ Помилка оркестрації: {str(e)}"

    async def _cmd_agents_status(self, args: str) -> str:
        """Статус всіх агентів системи"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.nexus_api_url}/api/v1/agents/status")
                agents = response.json()

                result = "🤖 **Статус агентів Predator Analytics**\n\n"

                for agent in agents.get("agents", []):
                    status_emoji = "✅" if agent["status"] == "active" else "⚠️"
                    result += f"{status_emoji} **{agent['name']}**\n"
                    result += f"  └ Статус: {agent['status']}\n"
                    result += f"  └ Задач виконано: {agent.get('tasks_completed', 0)}\n"
                    result += f"  └ Успішність: {agent.get('success_rate', 0):.1f}%\n\n"

                return result

        except Exception as e:
            return f"❌ Помилка отримання статусу агентів: {str(e)}"

    async def _cmd_orchestrate(self, args: str) -> str:
        """Запуск оркестрації агентів для складної задачі"""
        if not args:
            return """🎭 **Оркестрація агентів**

Використання:
```
/orchestrate <опис задачі>
```

Приклад:
```
/orchestrate проаналізуй аномалії в імпорті електроніки за 2024 рік
```

Система автоматично:
1. Визначить потрібні агенти
2. Розподілить задачі
3. Зберуть результати через арбітраж
4. Поверне аналітичний звіт"""

        return await self._process_natural_language(args, self.requesting_user_id)

    async def _cmd_arbiter_status(self, args: str) -> str:
        """Статус арбітра моделей"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.nexus_api_url}/api/v1/arbiter/status")
                data = response.json()

                result = "⚖️ **Статус Арбітра**\n\n"
                result += f"Активних моделей: {data.get('active_models', 0)}\n"
                result += f"Запитів оброблено: {data.get('requests_processed', 0)}\n"
                result += f"Середня якість: {data.get('avg_quality', 0):.2f}\n\n"

                result += "**Топ моделей:**\n"
                for model in data.get("top_models", [])[:5]:
                    result += f"  • {model['name']}: {model['score']:.2f}\n"

                return result

        except Exception as e:
            return f"❌ Помилка: {str(e)}"

    async def _cmd_datasets_list(self, args: str) -> str:
        """Список доступних датасетів"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.nexus_api_url}/api/v1/datasets")
                datasets = response.json()

                result = "📊 **Датасети**\n\n"
                for ds in datasets.get("datasets", [])[:10]:
                    result += f"• **{ds['name']}**\n"
                    result += f"  └ Записів: {ds.get('records', 0):,}\n"
                    result += f"  └ Оновлено: {ds.get('updated_at', 'N/A')}\n\n"

                return result

        except Exception as e:
            return f"❌ Помилка: {str(e)}"

    async def _cmd_system_health(self, args: str) -> str:
        """Загальний стан системи"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"{self.nexus_api_url}/api/v1/health")
                health = response.json()

                result = "🏥 **Стан системи Predator Analytics v25.0**\n\n"

                components = health.get("components", {})
                for name, status in components.items():
                    emoji = "✅" if status == "healthy" else "❌"
                    result += f"{emoji} {name}: {status}\n"

                # Додаємо метрики з Prometheus
                prom_metrics = await monitoring_service.get_system_metrics()
                result += "\n📊 **Prometheus Метрики:**\n"
                result += f"  └ Load: {prom_metrics['cpu_load']:.1f}%\n"
                result += f"  └ RAM: {prom_metrics['memory_usage']:.1f}%\n"
                result += f"  └ Latency: {prom_metrics['latency']:.1f}ms\n"

                result += f"\n⏱️ Uptime: {health.get('uptime', 'N/A')}\n"

                return result

        except Exception as e:
            return f"❌ Помилка: {str(e)}"

    async def _cmd_self_improvement(self, args: str) -> str:
        """Запуск циклу самовдосконалення"""
        if not self._is_requesting_user_authorized():
            return "❌ Тільки авторизовані користувачі можуть запускати самовдосконалення"

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    f"{self.nexus_api_url}/api/v1/self-improve/start",
                    json={"mode": args or "auto"}
                )
                result = response.json()

                return f"""🔄 **Самовдосконалення запущено**

Режим: {result.get('mode', 'auto')}
Етапи:
  1. ✅ Діагностика
  2. 🔄 Аналіз дрейфу
  3. 🔄 Генерація датасетів
  4. 🔄 Тренування моделей
  5. ⏳ Валідація

Прогрес буде надсилатись автоматично."""

        except Exception as e:
            return f"❌ Помилка: {str(e)}"

    async def _cmd_queues_status(self, args: str) -> str:
        """Статус черг RabbitMQ"""
        queues = await monitoring_service.get_queue_status()
        if not queues:
            return "📭 Черги порожні або RabbitMQ недоступний."

        result = "🐰 **Статус черг RabbitMQ**\n\n"
        for q in queues:
            result += f"📦 **{q['name']}**\n"
            result += f"  └ Повідомлень: {q['messages']}\n"
            result += f"  └ Consumers: {q['consumers']}\n\n"
        return result

    async def _cmd_triple_agent(self, args: str) -> str:
        """Запуск Triple Agent Chain вручну"""
        if not args:
            return "Використання: `/triple <команда>`"
        return await self._process_natural_language(args, self.requesting_user_id)

    def _parse_json_response(self, text: str) -> Dict[str, Any]:
        """Парсинг JSON відповіді від LLM"""
        import json
        import re

        # Шукаємо JSON блок
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except:
                pass

        return {}

    def _format_orchestration_result(self, result: Dict[str, Any]) -> str:
        """Форматування результату оркестрації"""
        output = "🎭 **Результат оркестрації**\n\n"

        if result.get("success"):
            output += "✅ Задача виконана успішно\n\n"
            output += "**Використані агенти:**\n"
            for agent in result.get("agents_used", []):
                output += f"  • {agent}\n"

            output += f"\n**Результат:**\n{result.get('result', 'N/A')}\n"

            if result.get("arbiter_score"):
                output += f"\n⚖️ Оцінка арбітра: {result['arbiter_score']:.2f}\n"
        else:
            output += f"❌ Помилка: {result.get('error', 'Unknown')}\n"

        return output

    async def _handle_query(self, text: str, chat_id: int, user_id: int) -> tuple:
        """
        Обробка природномовних запитів через LLM та оркестрацію
        """
        # Спочатку пробуємо обробити через природну мову
        if self.enable_autonomous:
            response = await self._process_natural_language(text, user_id)
            return response, None
        else:
            # Fallback на базову обробку
            return await super()._handle_query(text, chat_id, user_id)


# Глобальний інстанс
_nexus_bot: Optional[NexusTelegramBot] = None


def init_nexus_bot(token: str) -> NexusTelegramBot:
    """Ініціалізація Nexus бота"""
    global _nexus_bot
    _nexus_bot = NexusTelegramBot(token)
    logger.info("✅ Nexus Telegram Bot initialized")
    return _nexus_bot


def get_nexus_bot() -> Optional[NexusTelegramBot]:
    """Отримання інстансу Nexus бота"""
    return _nexus_bot
