"""🔍 Pydantic схеми для Due Diligence — PREDATOR Analytics v4.1.

Схеми запитів та відповідей для /api/v1/diligence.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

# ── Вкладені об'єкти ─────────────────────────────────────────

class PersonInfo(BaseModel):
    """Інформація про фізичну особу."""

    id: str
    type: str = "Person"
    label: str  # ПІБ
    properties: dict[str, Any] = Field(default_factory=dict)


class SanctionRecord(BaseModel):
    """Запис у санкційному списку."""

    list_name: str  # РНБО, EU, OFAC
    date_added: str
    reason: str
    is_active: bool = True


class AnomalyRecord(BaseModel):
    """Виявлена аномалія."""

    type: str  # price, volume, pattern
    score: float = Field(ge=0, le=1)
    description: str
    date_detected: str


# ── Відповіді ────────────────────────────────────────────────

class CompanyProfileResponse(BaseModel):
    """Повний профіль компанії для Due Diligence."""

    edrpou: str
    name: str
    status: str
    registration_date: str | None = None
    risk_score: float = Field(ge=0, le=100)
    sanctions: list[SanctionRecord] = Field(default_factory=list)
    anomalies: list[AnomalyRecord] = Field(default_factory=list)
    directors: list[PersonInfo] = Field(default_factory=list)
    owners: list[PersonInfo] = Field(default_factory=list)
    ultimate_beneficiaries: list[PersonInfo] = Field(default_factory=list)
    related_companies: list[dict[str, Any]] = Field(default_factory=list)

    model_config = {"from_attributes": True}
