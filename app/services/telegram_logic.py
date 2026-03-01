from __future__ import annotations


"""Telegram Logic Service - Telegram bot business logic
Handles message processing and response generation.
"""
from datetime import UTC, datetime
import logging

from .ai_engine import ai_engine


logger = logging.getLogger(__name__)


class TelegramLogic:
    """Telegram Bot Logic Handler
    Processes messages and generates responses.
    """

    def __init__(self):
        self.commands = {
            "/start": self._handle_start,
            "/help": self._handle_help,
            "/check": self._handle_check,
            "/search": self._handle_search,
            "/status": self._handle_status,
        }

        self.welcome_message = """
🔍 *Predator Analytics Bot*

Вітаю! Я допоможу вам з аналізом українських бізнес-даних.

Доступні команди:
/check <ЄДРПОУ> - Перевірка компанії
/search <запит> - Пошук в реєстрах
/status - Статус системи
/help - Допомога
        """

    async def process_message(self, text: str, user_id: int, chat_id: int) -> str:
        """Process incoming message.

        Args:
            text: Message text
            user_id: Telegram user ID
            chat_id: Chat ID

        Returns:
            Response text
        """
        text = text.strip()

        # Check for commands
        if text.startswith("/"):
            parts = text.split(maxsplit=1)
            command = parts[0].lower()
            args = parts[1] if len(parts) > 1 else ""

            handler = self.commands.get(command)
            if handler:
                return await handler(args, user_id)
            return "❌ Невідома команда. Використайте /help"

        # Free-form query
        return await self._handle_query(text, user_id)

    async def _handle_start(self, args: str, user_id: int) -> str:
        """Handle /start command."""
        return self.welcome_message

    async def _handle_help(self, args: str, user_id: int) -> str:
        """Handle /help command."""
        return """
📖 *Допомога*

*Команди:*
• `/check 12345678` - Перевірка компанії за ЄДРПОУ
• `/search Назва компанії` - Пошук в реєстрах
• `/status` - Статус системи

*Вільний запит:*
Просто напишіть ваше питання, і я спробую допомогти.
        """

    async def _handle_check(self, args: str, user_id: int) -> str:
        """Handle /check command."""
        if not args:
            return "❌ Вкажіть ЄДРПОУ. Приклад: `/check 12345678`"

        edrpou = args.strip()
        if not edrpou.isdigit() or len(edrpou) != 8:
            return "❌ ЄДРПОУ має містити 8 цифр"

        try:
            result = await ai_engine.quick_check(edrpou)

            if result["found"]:
                return f"""
✅ *Компанія знайдена*

ЄДРПОУ: `{edrpou}`
Дані: Знайдено в реєстрі

Для детального аналізу використайте `/search {edrpou}`
                """
            return f"❌ Компанію з ЄДРПОУ `{edrpou}` не знайдено"

        except Exception as e:
            logger.exception(f"Check error: {e}")
            return "❌ Помилка перевірки. Спробуйте пізніше."

    async def _handle_search(self, args: str, user_id: int) -> str:
        """Handle /search command."""
        if not args:
            return "❌ Вкажіть запит для пошуку"

        try:
            result = await ai_engine.analyze(args, depth="quick")

            sources_text = ""
            for source in result.sources[:3]:
                sources_text += f"\n• {source['name']}: {source['count']} записів"

            return f"""
🔍 *Результати пошуку*

Запит: {args}
{sources_text}

*Аналіз:*
{result.answer[:500]}...
            """

        except Exception as e:
            logger.exception(f"Search error: {e}")
            return "❌ Помилка пошуку. Спробуйте пізніше."

    async def _handle_status(self, args: str, user_id: int) -> str:
        """Handle /status command."""
        from .connector_registry import connector_registry

        # Get real health status
        health = await connector_registry.health_check_all()

        # Format status
        api_status = "✅ Online"
        db_status = (
            "✅ Connected" if health.get("full_system_check", {}).get("database") else "⚠️ Degraded"
        )

        # Build connector status
        connectors_text = ""
        for name, status in health.items():
            if name == "full_system_check":
                continue
            icon = "✅" if status == "ONLINE" else ("⚠️" if status == "DEGRADED" else "❌")
            connectors_text += f"{icon} {name.upper()}: {status}\n"

        return f"""
📊 *Статус системи*

✅ API: {api_status}
{db_status} (Database)

*Інтеграції:*
{connectors_text}
Час: {datetime.now(UTC).strftime("%Y-%m-%d %H:%M:%S")} UTC
        """

    async def _handle_query(self, text: str, user_id: int) -> str:
        """Handle free-form query."""
        try:
            result = await ai_engine.analyze(text)
            return result.answer[:1000]
        except Exception as e:
            logger.exception(f"Query error: {e}")
            return "❌ Помилка обробки запиту"


# Singleton instance
telegram_logic = TelegramLogic()
