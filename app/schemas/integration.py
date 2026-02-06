from __future__ import annotations


"""Integration Schemas."""
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel


class IntegrationType(str, Enum):
    WEBHOOK = "webhook"
    API = "api"
    DATABASE = "database"
    STREAM = "stream"


class IntegrationStatus(str, Enum):
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
