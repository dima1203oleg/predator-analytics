from __future__ import annotations


"""Telegram Channel Connector - Парсинг публічних та приватних каналів
Використовує Telethon для доступу до Telegram API.
"""
from dataclasses import dataclass
from datetime import UTC, datetime
import logging
import os
from typing import Any

from .base import BaseConnector, ConnectorResult, ConnectorStatus


logger = logging.getLogger(__name__)

# Спробуємо імпортувати Telethon
try:
    from telethon import TelegramClient
    from telethon.errors import ChannelPrivateError, UsernameNotOccupiedError
    from telethon.tl.functions.channels import GetFullChannelRequest
    from telethon.tl.functions.messages import GetHistoryRequest

    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False
    logger.warning("Telethon не встановлено. Telegram connector буде недоступний.")


@dataclass
class TelegramMessage:
    """Структура повідомлення з Telegram."""

    id: int
    channel_id: int
    channel_name: str
    text: str
    date: datetime
    views: int = 0
    forwards: int = 0
    media_type: str | None = None
    reply_to_id: int | None = None


class TelegramChannelConnector(BaseConnector):
    """Connector для парсингу Telegram каналів.

    Підтримує:
    - Публічні канали (за username)
    - Приватні канали (за invite link або ID, якщо бот в них є)
    - Історія повідомлень
    - Real-time моніторинг (через polling)

    Потребує Telegram API credentials:
    - TELEGRAM_API_ID
    - TELEGRAM_API_HASH
    - TELEGRAM_SESSION_NAME (опціонально)
    """

    def __init__(self):
        super().__init__(
            name="Telegram Channels", base_url="https://api.telegram.org", timeout=60.0
        )

        self.api_id = os.getenv("TELEGRAM_API_ID")
        self.api_hash = os.getenv("TELEGRAM_API_HASH")
        self.session_name = os.getenv("TELEGRAM_SESSION_NAME", "predator_telegram_session")
        self.phone = os.getenv("TELEGRAM_PHONE")

        self._client: TelegramClient | None = None
        self._connected = False

        # Кеш каналів для швидкого доступу
        self._channel_cache: dict[str, Any] = {}

    @property
    def is_configured(self) -> bool:
        """Перевірка чи налаштований connector."""
        return bool(self.api_id and self.api_hash and TELETHON_AVAILABLE)

    async def _get_client(self) -> TelegramClient | None:
        """Ініціалізація та підключення клієнта Telethon."""
        if not self.is_configured:
            logger.error(
                "Telegram connector не налаштований. Встановіть TELEGRAM_API_ID та TELEGRAM_API_HASH"
            )
            return None

        if self._client is None:
            self._client = TelegramClient(self.session_name, int(self.api_id), self.api_hash)

        if not self._connected:
            await self._client.start(phone=self.phone)
            self._connected = True
            logger.info("Telethon клієнт підключено успішно")

        return self._client

    async def close(self):
        """Закриття з'єднання."""
        if self._client and self._connected:
            await self._client.disconnect()
            self._connected = False
            logger.info("Telethon клієнт відключено")

    async def search(self, query: str, limit: int = 50, **kwargs) -> ConnectorResult:
        """Пошук повідомлень у каналі.

        Args:
            query: Username каналу або текст для пошуку
            limit: Максимальна кількість повідомлень

        Kwargs:
            channel_username: Конкретний канал для пошуку
            date_from: Дата початку (ISO format)
            date_to: Дата кінця (ISO format)
        """
        if not self.is_configured:
            return ConnectorResult(
                success=False,
                data=None,
                error="Telegram connector не налаштований",
                source=self.name,
            )

        try:
            client = await self._get_client()
            if not client:
                return ConnectorResult(
                    success=False, data=None, error="Не вдалося підключитися", source=self.name
                )

            channel_username = kwargs.get("channel_username", query)
            date_from = kwargs.get("date_from")
            date_to = kwargs.get("date_to")

            # Парсимо дати
            offset_date = None
            if date_to:
                offset_date = datetime.fromisoformat(date_to)

            # Отримуємо канал
            try:
                entity = await client.get_entity(channel_username)
            except UsernameNotOccupiedError:
                return ConnectorResult(
                    success=False,
                    data=None,
                    error=f"Канал {channel_username} не знайдено",
                    source=self.name,
                )
            except ChannelPrivateError:
                return ConnectorResult(
                    success=False,
                    data=None,
                    error=f"Канал {channel_username} приватний",
                    source=self.name,
                )

            # Отримуємо історію
            messages = []
            async for message in client.iter_messages(entity, limit=limit, offset_date=offset_date):
                if message.text:
                    # Фільтруємо за query якщо він не є username
                    if query != channel_username and query.lower() not in message.text.lower():
                        continue

                    # Фільтруємо за датою початку
                    if date_from:
                        msg_date = message.date.replace(tzinfo=UTC)
                        filter_date = datetime.fromisoformat(date_from)
                        if msg_date < filter_date:
                            break

                    msg_data = TelegramMessage(
                        id=message.id,
                        channel_id=entity.id,
                        channel_name=getattr(entity, "username", str(entity.id)),
                        text=message.text,
                        date=message.date,
                        views=message.views or 0,
                        forwards=message.forwards or 0,
                        media_type=type(message.media).__name__ if message.media else None,
                        reply_to_id=message.reply_to_msg_id if message.reply_to else None,
                    )
                    messages.append(msg_data.__dict__)

            logger.info(f"Знайдено {len(messages)} повідомлень у каналі {channel_username}")

            return ConnectorResult(
                success=True, data=messages, source=self.name, records_count=len(messages)
            )

        except Exception as e:
            logger.exception(f"Помилка пошуку в Telegram: {e}")
            return ConnectorResult(success=False, data=None, error=str(e), source=self.name)

    async def get_by_id(self, channel_username: str) -> ConnectorResult:
        """Отримати інформацію про канал.

        Args:
            channel_username: Username каналу (без @)
        """
        if not self.is_configured:
            return ConnectorResult(
                success=False, data=None, error="Telegram не налаштований", source=self.name
            )

        try:
            client = await self._get_client()
            if not client:
                return ConnectorResult(
                    success=False, data=None, error="Не вдалося підключитися", source=self.name
                )

            entity = await client.get_entity(channel_username)

            # Отримуємо повну інформацію
            full_channel = await client(GetFullChannelRequest(entity))

            channel_info = {
                "id": entity.id,
                "username": getattr(entity, "username", None),
                "title": getattr(entity, "title", None),
                "participants_count": getattr(full_channel.full_chat, "participants_count", 0),
                "about": getattr(full_channel.full_chat, "about", None),
                "linked_chat_id": getattr(full_channel.full_chat, "linked_chat_id", None),
            }

            # Кешуємо
            self._channel_cache[channel_username] = channel_info

            return ConnectorResult(
                success=True, data=channel_info, source=self.name, records_count=1
            )

        except Exception as e:
            logger.exception(f"Помилка отримання каналу {channel_username}: {e}")
            return ConnectorResult(success=False, data=None, error=str(e), source=self.name)

    async def fetch_channel_history(
        self, channel_username: str, limit: int = 100, min_id: int = 0
    ) -> ConnectorResult:
        """Отримати історію повідомлень каналу для ETL.

        Args:
            channel_username: Username каналу
            limit: Максимальна кількість
            min_id: ID з якого почати (для інкрементального завантаження)
        """
        return await self.search(
            query=channel_username, limit=limit, channel_username=channel_username
        )

    async def subscribe_to_channel(self, channel_username: str) -> ConnectorResult:
        """Підписатися на канал для отримання нових повідомлень.
        Повертає конфігурацію для scheduler.
        """
        # Спочатку перевіряємо доступ до каналу
        info_result = await self.get_by_id(channel_username)
        if not info_result.success:
            return info_result

        subscription_config = {
            "channel_username": channel_username,
            "channel_id": info_result.data["id"],
            "poll_interval_seconds": 300,  # 5 хвилин
            "last_message_id": 0,
            "status": "active",
        }

        return ConnectorResult(success=True, data=subscription_config, source=self.name)

    async def health_check(self) -> ConnectorStatus:
        """Перевірка стану connector'а."""
        if not self.is_configured:
            self._status = ConnectorStatus.OFFLINE
            return self._status

        try:
            client = await self._get_client()
            if client and await client.is_user_authorized():
                self._status = ConnectorStatus.HEALTHY
            else:
                self._status = ConnectorStatus.DEGRADED
        except Exception as e:
            logger.exception(f"Telegram health check failed: {e}")
            self._status = ConnectorStatus.OFFLINE

        self._last_check = datetime.now(UTC)
        return self._status


# Singleton екземпляр
telegram_channel_connector = TelegramChannelConnector()
