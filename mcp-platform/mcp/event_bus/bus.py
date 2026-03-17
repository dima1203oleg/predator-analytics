"""Event Bus на базі in-memory pub/sub для локального тестування."""
from __future__ import annotations

import asyncio
import uuid
from typing import Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime


class EventType(Enum):
    """Типи подій."""

    CODE_ANALYSIS_STARTED = "code.analysis.started"
    CODE_ANALYSIS_COMPLETED = "code.analysis.completed"
    QUALITY_ISSUE_DETECTED = "quality.issue.detected"
    SECURITY_ISSUE_DETECTED = "security.issue.detected"
    DECISION_MADE = "decision.made"
    WORKFLOW_STARTED = "workflow.started"
    WORKFLOW_COMPLETED = "workflow.completed"


@dataclass
class Event:
    """Подія в системі."""

    id: str
    type: EventType
    timestamp: datetime
    source: str
    payload: dict[str, Any]
    metadata: dict[str, Any] | None = None


class EventBusError(Exception):
    """Базова помилка для Event Bus."""

    pass


class EventBus:
    """In-memory Event Bus для публікації та підписування на події."""

    def __init__(self) -> None:
        """Ініціалізувати Event Bus."""
        self.subscribers: dict[str, list[Callable]] = {}
        self.event_history: list[Event] = []
        self.connected = False

    async def connect(self) -> None:
        """Підключитися до Event Bus.

        Для in-memory реалізації це просто встановлює флаг.
        """
        self.connected = True

    async def disconnect(self) -> None:
        """Відключитися від Event Bus."""
        self.connected = False

    async def publish(self, event: Event) -> None:
        """Опублікувати подію.

        Args:
            event: Подія для публікації

        Raises:
            EventBusError: Якщо не підключено
        """
        if not self.connected:
            raise EventBusError("Event Bus не підключен")

        self.event_history.append(event)

        # Отримати усі підписники для цього типу eventi
        topic = event.type.value
        if topic in self.subscribers:
            for handler in self.subscribers[topic]:
                try:
                    if asyncio.iscoroutinefunction(handler):
                        await handler(event)
                    else:
                        handler(event)
                except Exception as e:
                    print(f"Помилка обробника для {topic}: {str(e)}")

    async def subscribe(self, topic: str, handler: Callable) -> None:
        """Підписатися на подію.

        Args:
            topic: Тема/тип eventi
            handler: Функція-обробник
        """
        if topic not in self.subscribers:
            self.subscribers[topic] = []

        self.subscribers[topic].append(handler)

    async def unsubscribe(self, topic: str, handler: Callable) -> None:
        """Відписатися від eventi.

        Args:
            topic: Тема/тип eventi
            handler: Функція-обробник
        """
        if topic in self.subscribers:
            self.subscribers[topic].remove(handler)
            if not self.subscribers[topic]:
                del self.subscribers[topic]

    def get_event_history(self) -> list[Event]:
        """Отримати історію подій.

        Returns:
            Список опублікованих подій
        """
        return self.event_history.copy()

    def clear_history(self) -> None:
        """Очистити історію подій."""
        self.event_history.clear()

    def get_subscribers_count(self, topic: str) -> int:
        """Отримати кількість підписників на тему.

        Args:
            topic: Тема

        Returns:
            Кількість підписників
        """
        return len(self.subscribers.get(topic, []))


class EventPublisher:
    """Publisher для простого публікування подій."""

    def __init__(self, event_bus: EventBus, source: str) -> None:
        """Ініціалізувати Publisher.

        Args:
            event_bus: Event Bus для публікування
            source: Назва джерела подій
        """
        self.event_bus = event_bus
        self.source = source

    async def publish_code_analysis_started(self, file_path: str) -> Event:
        """Опублікувати подію про начало аналізу коду.

        Args:
            file_path: Шлях до файлу

        Returns:
            Опублікована подія
        """
        event = Event(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            type=EventType.CODE_ANALYSIS_STARTED,
            timestamp=datetime.now(),
            source=self.source,
            payload={"file_path": file_path},
        )
        await self.event_bus.publish(event)
        return event

    async def publish_code_analysis_completed(
        self, file_path: str, metrics: dict[str, Any]
    ) -> Event:
        """Опублікувати подію про завершення аналізу коду.

        Args:
            file_path: Шлях до файлу
            metrics: Метрики аналізу

        Returns:
            Опублікована подія
        """
        event = Event(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            type=EventType.CODE_ANALYSIS_COMPLETED,
            timestamp=datetime.now(),
            source=self.source,
            payload={"file_path": file_path, "metrics": metrics},
        )
        await self.event_bus.publish(event)
        return event

    async def publish_issue_detected(
        self, issue_type: str, severity: str, description: str
    ) -> Event:
        """Опублікувати подію про виявлене питання.

        Args:
            issue_type: Тип питання (quality, security)
            severity: Рівень серйозності (low, medium, high, critical)
            description: Опис питання

        Returns:
            Опублікована подія
        """
        event_type = (
            EventType.SECURITY_ISSUE_DETECTED
            if issue_type == "security"
            else EventType.QUALITY_ISSUE_DETECTED
        )
        event = Event(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            type=event_type,
            timestamp=datetime.now(),
            source=self.source,
            payload={
                "issue_type": issue_type,
                "severity": severity,
                "description": description,
            },
        )
        await self.event_bus.publish(event)
        return event

    async def publish_decision_made(
        self, decision_id: str, action: str, confidence: float
    ) -> Event:
        """Опублікувати подію про прийняте рішення.

        Args:
            decision_id: ID рішення
            action: Дія
            confidence: Впевненість (0-1)

        Returns:
            Опублікована подія
        """
        event = Event(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            type=EventType.DECISION_MADE,
            timestamp=datetime.now(),
            source=self.source,
            payload={
                "decision_id": decision_id,
                "action": action,
                "confidence": confidence,
            },
        )
        await self.event_bus.publish(event)
        return event
