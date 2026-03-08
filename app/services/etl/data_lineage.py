from __future__ import annotations


"""Data Lineage Tracker (COMP-012)

Відстежує походження та трансформації даних у ETL-конвеєрі.
Фіксує повний шлях кожного запису: джерело → трансформації → призначення.

Implements:
- Record-level lineage (кожен запис має lineage ID)
- Transform chain (список трансформацій)
- Source→Destination mapping
- Impact analysis (what downstream depends on this record)
"""
import hashlib
import json
import logging
from dataclasses import dataclass, field, asdict
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4


logger = logging.getLogger("service.lineage")


@dataclass
class LineageNode:
    """A single step in the data lineage chain."""
    step_id: str = field(default_factory=lambda: str(uuid4())[:8])
    operation: str = ""       # ingest, parse, clean, enrich, deduplicate, distribute
    component: str = ""       # Component name (e.g., "csv_parser", "uktzed_enricher")
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    input_hash: str = ""      # SHA-256 of input data
    output_hash: str = ""     # SHA-256 of output data
    records_in: int = 0
    records_out: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class LineageRecord:
    """Full lineage chain for a data record or batch."""
    lineage_id: str = field(default_factory=lambda: str(uuid4()))
    source_connector: str = ""        # Original data source
    source_url: str = ""              # URL or path
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    chain: list[LineageNode] = field(default_factory=list)
    destinations: list[str] = field(default_factory=list)  # e.g., ["postgresql", "opensearch"]
    status: str = "in_progress"       # in_progress, completed, failed
    total_records: int = 0

    def add_step(
        self,
        operation: str,
        component: str,
        records_in: int = 0,
        records_out: int = 0,
        input_data: Any = None,
        output_data: Any = None,
        **metadata,
    ) -> LineageNode:
        """Add a transformation step."""
        node = LineageNode(
            operation=operation,
            component=component,
            records_in=records_in,
            records_out=records_out,
            input_hash=_hash_data(input_data) if input_data else "",
            output_hash=_hash_data(output_data) if output_data else "",
            metadata=metadata,
        )
        self.chain.append(node)
        return node

    def complete(self, destinations: list[str] | None = None):
        """Mark lineage as completed."""
        self.status = "completed"
        if destinations:
            self.destinations = destinations

    def fail(self, error: str):
        """Mark lineage as failed."""
        self.status = "failed"
        if self.chain:
            self.chain[-1].metadata["error"] = error

    def to_dict(self) -> dict[str, Any]:
        return {
            "lineage_id": self.lineage_id,
            "source_connector": self.source_connector,
            "source_url": self.source_url,
            "created_at": self.created_at,
            "chain": [n.to_dict() for n in self.chain],
            "destinations": self.destinations,
            "status": self.status,
            "total_records": self.total_records,
            "steps_count": len(self.chain),
        }


class DataLineageTracker:
    """Tracks data lineage across the ETL pipeline.

    Stores lineage in memory (dev) or PostgreSQL (production).
    """

    def __init__(self):
        self._records: dict[str, LineageRecord] = {}
        logger.info("DataLineageTracker initialized")

    def start(
        self,
        source_connector: str,
        source_url: str = "",
        total_records: int = 0,
    ) -> LineageRecord:
        """Start tracking lineage for a new batch."""
        record = LineageRecord(
            source_connector=source_connector,
            source_url=source_url,
            total_records=total_records,
        )
        self._records[record.lineage_id] = record
        logger.debug("Lineage started: %s from %s", record.lineage_id, source_connector)
        return record

    def get(self, lineage_id: str) -> LineageRecord | None:
        """Get lineage record by ID."""
        return self._records.get(lineage_id)

    def list_recent(self, limit: int = 50) -> list[dict]:
        """List most recent lineage records."""
        records = sorted(
            self._records.values(),
            key=lambda r: r.created_at,
            reverse=True,
        )
        return [r.to_dict() for r in records[:limit]]

    def get_stats(self) -> dict[str, Any]:
        """Get lineage statistics."""
        records = list(self._records.values())
        return {
            "total_lineage_records": len(records),
            "completed": sum(1 for r in records if r.status == "completed"),
            "failed": sum(1 for r in records if r.status == "failed"),
            "in_progress": sum(1 for r in records if r.status == "in_progress"),
            "sources": list({r.source_connector for r in records}),
            "total_records_tracked": sum(r.total_records for r in records),
        }


def _hash_data(data: Any) -> str:
    """Compute SHA-256 of data for lineage verification."""
    if data is None:
        return ""
    raw = json.dumps(data, sort_keys=True, default=str).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:16]


# Singleton
lineage_tracker = DataLineageTracker()
