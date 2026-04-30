from __future__ import annotations

"""Integration Schemas."""
from enum import StrEnum
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

if TYPE_CHECKING:
    from datetime import datetime


class IntegrationType(StrEnum):
    WEBHOOK = "webhook"
    API = "api"
    DATABASE = "database"
    STREAM = "stream"


class IntegrationStatus(StrEnum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    ERROR = "ERROR"


class Integration(BaseModel):
    id: str
    name: str
    type: IntegrationType
    status: IntegrationStatus
    endpoint: str | None = None
    last_sync: datetime | None = None


class WebhookPayload(BaseModel):
    event: str
    data: dict[str, Any]
    timestamp: datetime
