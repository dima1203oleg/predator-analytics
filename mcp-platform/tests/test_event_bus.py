"""Тести для Event Bus та Messaging."""

import pytest
from mcp.event_bus.bus import EventBus, Event, EventType, EventPublisher


class TestEventBus:
    """Тести EventBus."""

    @pytest.fixture
    def event_bus(self):
        """Фікстура EventBus."""
        return EventBus()

    @pytest.mark.asyncio
    async def test_init(self, event_bus):
        """Тест ініціалізації."""
        assert not event_bus.connected
        assert len(event_bus.event_history) == 0

    @pytest.mark.asyncio
    async def test_connect_disconnect(self, event_bus):
        """Тест підключення та відключення."""
        await event_bus.connect()
        assert event_bus.connected
        
        await event_bus.disconnect()
        assert not event_bus.connected

    @pytest.mark.asyncio
    async def test_publish_event(self, event_bus):
        """Тест публікування eventi."""
        await event_bus.connect()
        
        event = Event(
            id="evt_1",
            type=EventType.CODE_ANALYSIS_STARTED,
            timestamp=None,
            source="test",
            payload={"file": "test.py"},
        )
        
        await event_bus.publish(event)
        
        assert len(event_bus.event_history) == 1
        assert event_bus.event_history[0].id == "evt_1"

    @pytest.mark.asyncio
    async def test_publish_without_connection(self, event_bus):
        """Тест публікування без підключення."""
        event = Event(
            id="evt_1",
            type=EventType.CODE_ANALYSIS_STARTED,
            timestamp=None,
            source="test",
            payload={},
        )
        
        with pytest.raises(Exception):
            await event_bus.publish(event)

    @pytest.mark.asyncio
    async def test_subscribe_and_handle_event(self, event_bus):
        """Тест підписки та обробки eventi."""
        await event_bus.connect()
        
        received_events = []
        
        async def handler(event: Event):
            received_events.append(event)
        
        topic = EventType.CODE_ANALYSIS_STARTED.value
        await event_bus.subscribe(topic, handler)
        
        event = Event(
            id="evt_1",
            type=EventType.CODE_ANALYSIS_STARTED,
            timestamp=None,
            source="test",
            payload={},
        )
        
        await event_bus.publish(event)
        
        # Дати час на обробку
        await asyncio.sleep(0.01)
        
        assert len(received_events) == 1
        assert received_events[0].id == "evt_1"

    @pytest.mark.asyncio
    async def test_multiple_subscribers(self, event_bus):
        """Тест кількох підписників."""
        await event_bus.connect()
        
        handler1_calls = []
        handler2_calls = []
        
        async def handler1(event: Event):
            handler1_calls.append(event)
        
        async def handler2(event: Event):
            handler2_calls.append(event)
        
        topic = EventType.SECURITY_ISSUE_DETECTED.value
        await event_bus.subscribe(topic, handler1)
        await event_bus.subscribe(topic, handler2)
        
        event = Event(
            id="evt_1",
            type=EventType.SECURITY_ISSUE_DETECTED,
            timestamp=None,
            source="test",
            payload={"severity": "high"},
        )
        
        await event_bus.publish(event)
        await asyncio.sleep(0.01)
        
        assert len(handler1_calls) == 1
        assert len(handler2_calls) == 1

    @pytest.mark.asyncio
    async def test_unsubscribe(self, event_bus):
        """Тест відписки."""
        await event_bus.connect()
        
        received_events = []
        
        async def handler(event: Event):
            received_events.append(event)
        
        topic = EventType.WORKFLOW_STARTED.value
        await event_bus.subscribe(topic, handler)
        await event_bus.unsubscribe(topic, handler)
        
        event = Event(
            id="evt_1",
            type=EventType.WORKFLOW_STARTED,
            timestamp=None,
            source="test",
            payload={},
        )
        
        await event_bus.publish(event)
        await asyncio.sleep(0.01)
        
        assert len(received_events) == 0

    def test_get_event_history(self, event_bus):
        """Тест отримання історії подій."""
        assert len(event_bus.get_event_history()) == 0

    def test_clear_history(self, event_bus):
        """Тест очищення історії."""
        event = Event(
            id="evt_1",
            type=EventType.CODE_ANALYSIS_STARTED,
            timestamp=None,
            source="test",
            payload={},
        )
        event_bus.event_history.append(event)
        
        event_bus.clear_history()
        assert len(event_bus.event_history) == 0

    def test_get_subscribers_count(self, event_bus):
        """Тест отримання кількості підписників."""
        topic = EventType.CODE_ANALYSIS_COMPLETED.value
        assert event_bus.get_subscribers_count(topic) == 0


class TestEventPublisher:
    """Тести EventPublisher."""

    @pytest.fixture
    def publisher(self):
        """Фікстура EventPublisher."""
        event_bus = EventBus()
        return EventPublisher(event_bus, "test_source")

    @pytest.mark.asyncio
    async def test_init(self, publisher):
        """Тест ініціалізації."""
        assert publisher.event_bus is not None
        assert publisher.source == "test_source"

    @pytest.mark.asyncio
    async def test_publish_code_analysis_started(self, publisher):
        """Тест публікування почала аналізу коду."""
        await publisher.event_bus.connect()
        
        event = await publisher.publish_code_analysis_started("test.py")
        
        assert event.type == EventType.CODE_ANALYSIS_STARTED
        assert event.payload["file_path"] == "test.py"

    @pytest.mark.asyncio
    async def test_publish_code_analysis_completed(self, publisher):
        """Тест публікування завершення аналізу коду."""
        await publisher.event_bus.connect()
        
        metrics = {"maintainability": 85, "complexity": 3}
        event = await publisher.publish_code_analysis_completed("test.py", metrics)
        
        assert event.type == EventType.CODE_ANALYSIS_COMPLETED
        assert event.payload["file_path"] == "test.py"
        assert event.payload["metrics"] == metrics

    @pytest.mark.asyncio
    async def test_publish_security_issue(self, publisher):
        """Тест публікування питання безпеки."""
        await publisher.event_bus.connect()
        
        event = await publisher.publish_issue_detected(
            "security", "critical", "SQL Injection vulnerability"
        )
        
        assert event.type == EventType.SECURITY_ISSUE_DETECTED
        assert event.payload["severity"] == "critical"

    @pytest.mark.asyncio
    async def test_publish_quality_issue(self, publisher):
        """Тест публікування питання якості."""
        await publisher.event_bus.connect()
        
        event = await publisher.publish_issue_detected(
            "quality", "high", "High cyclomatic complexity"
        )
        
        assert event.type == EventType.QUALITY_ISSUE_DETECTED
        assert event.payload["severity"] == "high"

    @pytest.mark.asyncio
    async def test_publish_decision_made(self, publisher):
        """Тест публікування прийнятого рішення."""
        await publisher.event_bus.connect()
        
        event = await publisher.publish_decision_made(
            "dec_1", "Refactor module", 0.92
        )
        
        assert event.type == EventType.DECISION_MADE
        assert event.payload["confidence"] == 0.92


# Import asyncio for testing
import asyncio
