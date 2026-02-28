"""Predator v55.0 — Data Fusion Engine.

Normalizes, cleans, and fuses data from multiple sources:
- Customs declarations (8 years)
- Tax invoices (5 years)
- EDR (Unified State Register)
- Courts, tenders, licenses
- Media, Telegram

Performs Entity Resolution → assigns UEID.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional

from app.core.ueid import UEIDResult, fingerprint_entity, normalize_name

logger = logging.getLogger("predator.engines.data_fusion")


class DataSource(str, Enum):
    """Supported data sources."""

    CUSTOMS = "customs"
    TAX = "tax"
    EDR = "edr"
    COURT = "court"
    TENDER = "tender"
    LICENSE = "license"
    MEDIA = "media"
    TELEGRAM = "telegram"
    ENERGY = "energy"
    LOGISTICS = "logistics"
    BUDGET = "budget"
    DEMOGRAPHIC = "demographic"


@dataclass
class FusedRecord:
    """A record after data fusion."""

    ueid: str
    source: DataSource
    raw_data: dict[str, Any]
    normalized_data: dict[str, Any]
    fingerprint: str
    quality_score: float = 0.0  # 0-1


@dataclass
class FusionResult:
    """Result of a data fusion operation."""

    records_processed: int = 0
    entities_resolved: int = 0
    entities_created: int = 0
    records_fused: list[FusedRecord] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)


def normalize_customs_record(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize a customs declaration record.

    Standardizes field names, formats, and units.
    """
    return {
        "importer_name": normalize_name(raw.get("importer", raw.get("name", ""))),
        "importer_edrpou": str(raw.get("edrpou", raw.get("code", ""))).strip(),
        "product_code": str(raw.get("hs_code", raw.get("product_code", ""))).strip(),
        "product_description": str(raw.get("description", "")).strip(),
        "country_origin": str(raw.get("country", raw.get("origin", ""))).strip(),
        "weight_kg": float(raw.get("weight", raw.get("weight_kg", 0))),
        "value_usd": float(raw.get("value", raw.get("customs_value", 0))),
        "declaration_date": raw.get("date", raw.get("declaration_date")),
        "customs_post": str(raw.get("post", raw.get("customs_post", ""))).strip(),
        "broker": normalize_name(raw.get("broker", "")),
        "country_sender": str(raw.get("sender_country", "")).strip(),
    }


def normalize_tax_record(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize a tax invoice record."""
    return {
        "seller_name": normalize_name(raw.get("seller", "")),
        "seller_edrpou": str(raw.get("seller_code", "")).strip(),
        "buyer_name": normalize_name(raw.get("buyer", "")),
        "buyer_edrpou": str(raw.get("buyer_code", "")).strip(),
        "amount": float(raw.get("amount", 0)),
        "tax_amount": float(raw.get("tax", 0)),
        "invoice_date": raw.get("date"),
        "invoice_number": str(raw.get("number", "")).strip(),
    }


def normalize_edr_record(raw: dict[str, Any]) -> dict[str, Any]:
    """Normalize an EDR (Unified State Register) record."""
    return {
        "name": normalize_name(raw.get("name", "")),
        "edrpou": str(raw.get("edrpou", raw.get("code", ""))).strip(),
        "status": str(raw.get("status", "")).strip(),
        "registration_date": raw.get("registration_date"),
        "address": str(raw.get("address", "")).strip(),
        "directors": raw.get("directors", []),
        "founders": raw.get("founders", []),
        "activities": raw.get("activities", []),
    }


NORMALIZERS: dict[DataSource, callable] = {
    DataSource.CUSTOMS: normalize_customs_record,
    DataSource.TAX: normalize_tax_record,
    DataSource.EDR: normalize_edr_record,
}


def fuse_record(
    raw: dict[str, Any],
    source: DataSource,
) -> FusedRecord:
    """Normalize and prepare a single record for fusion.

    Args:
        raw: Raw data record.
        source: Data source type.

    Returns:
        FusedRecord ready for entity resolution and indexing.
    """
    normalizer = NORMALIZERS.get(source)
    if normalizer:
        normalized = normalizer(raw)
    else:
        normalized = raw

    # Extract entity identifier
    name = normalized.get("importer_name") or normalized.get("name") or normalized.get("seller_name", "")
    edrpou = normalized.get("importer_edrpou") or normalized.get("edrpou") or normalized.get("seller_edrpou")

    fp = fingerprint_entity(name, edrpou)

    # Quality score: higher if more fields are populated
    total_fields = len(normalized)
    filled = sum(1 for v in normalized.values() if v)
    quality = filled / total_fields if total_fields > 0 else 0.0

    return FusedRecord(
        ueid="",  # Will be assigned by Entity Resolution
        source=source,
        raw_data=raw,
        normalized_data=normalized,
        fingerprint=fp,
        quality_score=round(quality, 2),
    )
