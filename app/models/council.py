from __future__ import annotations

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, String, Text

from app.models.entities import Base


class CouncilSession(Base):
    """Records a session of the Neural Council (LLM Multi-Agent Debate)."""

    __tablename__ = "council_sessions"

    id = Column(String(255), primary_key=True)
    query = Column(Text, nullable=False)
    context = Column(Text)
    final_answer = Column(Text)
    confidence = Column(Float)
    participants = Column(JSON)  # List of model names
    dissenting_opinions = Column(JSON)
    peer_reviews = Column(JSON)
    meta_info = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)
