"""Integration Schemas"""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


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
    endpoint: Optional[str] = None
    last_sync: Optional[datetime] = None


class WebhookPayload(BaseModel):
    event: str
    data: Dict[str, Any]
    timestamp: datetime
