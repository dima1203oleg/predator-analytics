"""Predator v55.0 — Universal Economic ID (UEID) System.

UEID is the core entity resolution mechanism that assigns a unique identifier
to every economic subject (company, person, broker, customs post, etc.).

Resolution strategy:
1. Exact match by EDRPOU/INN
2. Fuzzy match by normalized name (trigram similarity > 0.85)
3. Create new entity if no match found
"""

from __future__ import annotations

import hashlib
import logging
import re
import uuid

from pydantic import BaseModel, Field

logger = logging.getLogger("predator.core.ueid")


class UEIDResult(BaseModel):
    """Result of UEID resolution."""

    ueid: str = Field(description="Universal Economic ID (UUID)")
    entity_type: str = Field(description="company | person | broker | customs_post")
    name: str
    name_normalized: str
    edrpou: str | None = None
    inn: str | None = None
    is_new: bool = Field(default=False, description="True if entity was just created")
    confidence: float = Field(ge=0, le=1, description="Match confidence")


def normalize_name(name: str) -> str:
    """Normalize entity name for matching.

    - Lowercase
    - Remove quotes, extra spaces
    - Transliterate common variations
    - Strip legal form suffixes (ТОВ, ПП, ФОП, etc.)
    """
    if not name:
        return ""

    result = name.strip().lower()

    # Remove quotes and extra punctuation
    result = re.sub(r'[«»"\'`]', "", result)

    # Normalize legal forms
    legal_forms = [
        r"\bтов\b",
        r"\bтдв\b",
        r"\bпат\b",
        r"\bпрат\b",
        r"\bпп\b",
        r"\bфоп\b",
        r"\bат\b",
        r"\bкт\b",
        r"\bдп\b",
        r"\bкп\b",
        r"\bнп\b",
        r"\bllc\b",
        r"\bltd\b",
        r"\binc\b",
        r"\bcorp\b",
    ]
    for form in legal_forms:
        result = re.sub(form, "", result)

    # Collapse whitespace
    return re.sub(r"\s+", " ", result).strip()


def validate_edrpou(code: str) -> bool:
    """Validate Ukrainian EDRPOU code (8 digits for legal entities, 10 for individuals)."""
    if not code:
        return False
    clean = code.strip()
    return bool(re.match(r"^\d{8}$", clean) or re.match(r"^\d{10}$", clean))


def generate_ueid() -> str:
    """Generate a new UEID (UUID v4)."""
    return str(uuid.uuid4())


def generate_deterministic_ueid(edrpou: str) -> str:
    """Generate a deterministic UEID from EDRPOU using UUID v5 (SHA-1 namespace)."""
    namespace = uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890")
    return str(uuid.uuid5(namespace, edrpou))


def fingerprint_entity(name: str, edrpou: str | None = None) -> str:
    """Create a SHA-256 fingerprint for entity deduplication."""
    normalized = normalize_name(name)
    key = f"{edrpou or ''}:{normalized}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


def parse_ueid(ueid: str | uuid.UUID) -> uuid.UUID:
    """Safely parse UEID into a UUID object.

    Raises:
        ValueError: If ueid is not a valid UUID string.

    """
    if isinstance(ueid, uuid.UUID):
        return ueid
    try:
        return uuid.UUID(str(ueid))
    except (ValueError, AttributeError) as e:
        logger.error(f"Invalid UEID format: {ueid}")
        raise ValueError(f"Invalid UEID format: {ueid}") from e
