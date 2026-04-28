"""Тести Event Schemas — PREDATOR Analytics v58.2-WRAITH.

Перевірка серіалізації/десеріалізації Kafka подій.
"""


from predator_common.event_schemas import (
    DLQEvent,
    EntityResolvedEvent,
    EventHeader,
    EventPriority,
    EventType,
    IngestionCleanedEvent,
    IngestionRawEvent,
    RiskScoreUpdatedEvent,
    SanctionsHitEvent,
)


class TestEventSchemas:
    """Тести Kafka Event Schemas."""

    def test_event_header_creation(self) -> None:
        """Створення заголовку події."""
        header = EventHeader(
            event_id="test-uuid",
            event_type=EventType.INGESTION_RAW,
            tenant_id="tenant-123",
        )
        assert header.event_type == EventType.INGESTION_RAW
        assert header.tenant_id == "tenant-123"
        assert header.priority == EventPriority.NORMAL
        assert header.version == "1.0"

    def test_ingestion_raw_event(self) -> None:
        """Серіалізація IngestionRawEvent."""
        event = IngestionRawEvent(
            header=EventHeader(
                event_id="raw-001",
                event_type=EventType.INGESTION_RAW,
                tenant_id="t-1",
            ),
            payload=IngestionRawEvent.IngestionPayload(
                job_id="job-001",
                file_name="declarations.xlsx",
                file_path="/uploads/declarations.xlsx",
                record_index=0,
                raw_record={"col1": "val1"},
            ),
        )

        data = event.model_dump()
        assert data["header"]["event_type"] == "ingestion.raw"
        assert data["payload"]["file_name"] == "declarations.xlsx"

    def test_entity_resolved_event(self) -> None:
        """Entity Resolution подія."""
        event = EntityResolvedEvent(
            header=EventHeader(
                event_id="er-001",
                event_type=EventType.ENTITY_RESOLVED,
                tenant_id="t-1",
            ),
            payload=EntityResolvedEvent.EntityPayload(
                ueid="ueid-abc123",
                entity_type="company",
                name="ТОВ Ромашка",
                name_normalized="romashka",
                match_type="exact_id",
                confidence=1.0,
                is_new=False,
            ),
        )

        data = event.model_dump()
        assert data["payload"]["ueid"] == "ueid-abc123"
        assert data["payload"]["confidence"] == 1.0

    def test_risk_score_event(self) -> None:
        """Подія оновлення ризику."""
        event = RiskScoreUpdatedEvent(
            header=EventHeader(
                event_id="risk-001",
                event_type=EventType.RISK_SCORE_UPDATED,
                tenant_id="t-1",
                priority=EventPriority.HIGH,
            ),
            payload=RiskScoreUpdatedEvent.RiskPayload(
                entity_ueid="ueid-xyz",
                entity_type="company",
                previous_score=45.0,
                new_score=78.0,
                cers_level="high",
                components={"behavioral": 85.0, "institutional": 70.0},
                alert_triggered=True,
            ),
        )

        data = event.model_dump()
        assert data["payload"]["alert_triggered"] is True
        assert data["header"]["priority"] == "high"

    def test_sanctions_hit_event(self) -> None:
        """Подія збігу в санкційних списках."""
        event = SanctionsHitEvent(
            header=EventHeader(
                event_id="sanc-001",
                event_type=EventType.SANCTIONS_HIT,
                tenant_id="t-1",
                priority=EventPriority.CRITICAL,
            ),
            payload=SanctionsHitEvent.SanctionsPayload(
                entity_ueid="ueid-sanc",
                entity_name="Підозріла Компанія",
                list_name="RNBO",
                match_score=0.95,
                matched_entry="Підозріла Компанія ЛТД",
            ),
        )

        assert event.header.priority == EventPriority.CRITICAL
        assert event.payload.list_name == "RNBO"

    def test_dlq_event(self) -> None:
        """Dead Letter Queue подія."""
        event = DLQEvent(
            header=EventHeader(
                event_id="dlq-001",
                event_type=EventType.DLQ,
                tenant_id="t-1",
            ),
            payload=DLQEvent.DLQPayload(
                original_topic="tenant.t-1.ingestion.raw",
                original_event_id="raw-failed-001",
                error_message="Validation failed: invalid EDRPOU",
                error_type="validation",
                retry_count=3,
            ),
        )

        assert event.payload.retry_count == 3
        assert event.payload.error_type == "validation"

    def test_event_json_serialization(self) -> None:
        """Повна JSON серіалізація/десеріалізація."""
        event = IngestionCleanedEvent(
            header=EventHeader(
                event_id="clean-001",
                event_type=EventType.INGESTION_CLEANED,
                tenant_id="t-1",
            ),
            payload=IngestionCleanedEvent.CleanedPayload(
                job_id="job-001",
                record_index=5,
                declaration_number="UA2024/001234",
                customs_value_usd=15000.50,
                validation_flags=["price_anomaly", "new_counterpart"],
            ),
        )

        json_str = event.model_dump_json()
        restored = IngestionCleanedEvent.model_validate_json(json_str)

        assert restored.payload.declaration_number == "UA2024/001234"
        assert restored.payload.customs_value_usd == 15000.50
        assert "price_anomaly" in restored.payload.validation_flags
