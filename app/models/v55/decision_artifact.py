"""Predator v55.0 — Decision Artifact Pydantic Models.

Decision Artifacts are immutable (WORM) records of every AI decision.
Spec 3.3: retention 7+ years, trigger forbids UPDATE/DELETE.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DecisionArtifactCreate(BaseModel):
    """Request to record a decision artifact."""

    decision_type: str = Field(description="Type of decision (signal, cers, prediction, etc.)")
    tenant_id: str | None = None
    trace_id: str | None = None
    input_fingerprint: str = Field(description="SHA-256 of input data")
    model_fingerprint: str | None = Field(None, description="SHA-256 of model used")
    output_fingerprint: str = Field(description="SHA-256 of output data")
    confidence_score: float = Field(ge=0, le=1)
    explanation: dict[str, Any] | None = None
    sources: list[str] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class DecisionArtifactResponse(BaseModel):
    """Recorded decision artifact (immutable)."""

    decision_id: str
    timestamp: datetime
    decision_type: str
    tenant_id: str | None = None
    trace_id: str | None = None
    input_fingerprint: str
    model_fingerprint: str | None = None
    output_fingerprint: str
    confidence_score: float
    explanation: dict[str, Any] | None = None
    sources: list[str] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class DecisionArtifactListResponse(BaseModel):
    """List of decision artifacts."""

    total: int
    items: list[DecisionArtifactResponse]
