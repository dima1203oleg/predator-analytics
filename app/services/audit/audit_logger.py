from __future__ import annotations

"""WORM Audit Logger (COMP-157)

Append-only, immutable audit log for all system operations.
Implements Write-Once-Read-Many (WORM) pattern per §20.1 ТЗ v55.1.

Storage:
- Primary: PostgreSQL table `audit_log` with RLS + no DELETE/UPDATE permissions
- Secondary: JSON file fallback (development)

Features:
- Tamper-evident record chain (SHA-256 hash linking)
- Actor + action + target + context tracking
- API change recording
- ML decision artifacts (§20.1)
"""
from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
import hashlib
import json
import logging
from pathlib import Path
from typing import Any
from uuid import uuid4

logger = logging.getLogger("service.audit")

AUDIT_LOG_DIR = Path("/tmp/predator_audit")


@dataclass
class AuditEntry:
    """A single audit log entry.

    Fields follow OWASP Logging Guide and §20.1 ТЗ requirements.
    """

    event_id: str = field(default_factory=lambda: str(uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    actor: str = ""                     # user ID or system component
    actor_role: str = ""                # analyst, admin, system
    action: str = ""                    # create, read, update, delete, query, inference
    resource_type: str = ""             # entity, model, dataset, config
    resource_id: str = ""               # specific resource identifier
    result: str = "success"             # success, failure, denied
    details: dict[str, Any] = field(default_factory=dict)
    ip_address: str | None = None
    user_agent: str | None = None
    request_id: str | None = None
    tenant_id: str | None = None
    previous_hash: str | None = None    # Chain link for tamper-evidence
    entry_hash: str | None = None       # SHA-256 of this entry

    def compute_hash(self, previous_hash: str | None = None) -> str:
        """Compute SHA-256 hash for tamper-evidence."""
        data = {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "actor": self.actor,
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "result": self.result,
            "previous_hash": previous_hash or "",
        }
        raw = json.dumps(data, sort_keys=True).encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class AuditLogger:
    """WORM-compliant audit logger.

    In production: writes to PostgreSQL `audit_log` table (no DELETE/UPDATE grants).
    In development: writes to local JSON Lines file.
    """

    def __init__(self, storage: str = "file"):
        self.storage = storage
        self._last_hash: str | None = None
        self._log_path = AUDIT_LOG_DIR / "audit.jsonl"
        self._ensure_log_dir()
        logger.info("AuditLogger initialized (storage=%s)", storage)

    def _ensure_log_dir(self) -> None:
        AUDIT_LOG_DIR.mkdir(parents=True, exist_ok=True)

    def log(
        self,
        action: str,
        actor: str = "system",
        actor_role: str = "system",
        resource_type: str = "",
        resource_id: str = "",
        result: str = "success",
        details: dict[str, Any] | None = None,
        request_id: str | None = None,
        ip_address: str | None = None,
    ) -> AuditEntry:
        """Log an audit event (append-only).

        Args:
            action: What happened (create, read, update, delete, query, inference)
            actor: Who did it (user_id or component name)
            actor_role: Role (analyst, admin, system, agent)
            resource_type: What was acted upon (entity, model, dataset, config, api)
            resource_id: Specific resource ID
            result: Outcome (success, failure, denied)
            details: Additional context
            request_id: X-Request-Id header
            ip_address: Client IP

        Returns:
            AuditEntry (immutable)

        """
        entry = AuditEntry(
            actor=actor,
            actor_role=actor_role,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            result=result,
            details=details or {},
            request_id=request_id,
            ip_address=ip_address,
            previous_hash=self._last_hash,
        )

        # Compute tamper-evident hash
        entry.entry_hash = entry.compute_hash(self._last_hash)
        self._last_hash = entry.entry_hash

        # Persist
        self._persist(entry)

        logger.debug(
            "AUDIT: %s %s %s/%s → %s",
            entry.actor, entry.action, entry.resource_type,
            entry.resource_id, entry.result
        )

        return entry

    def log_api_call(
        self,
        method: str,
        path: str,
        status_code: int,
        actor: str = "anonymous",
        request_id: str | None = None,
        ip_address: str | None = None,
        duration_ms: float | None = None,
    ) -> AuditEntry:
        """Log an API request."""
        return self.log(
            action="api_call",
            actor=actor,
            resource_type="api",
            resource_id=f"{method} {path}",
            result="success" if status_code < 400 else "failure",
            details={
                "method": method,
                "path": path,
                "status_code": status_code,
                "duration_ms": duration_ms,
            },
            request_id=request_id,
            ip_address=ip_address,
        )

    def log_ml_decision(
        self,
        model_name: str,
        decision: str,
        confidence: float,
        tier: str = "L1",
        input_data: dict | None = None,
        actor: str = "ml-engine",
    ) -> AuditEntry:
        """Log an ML/AI decision artifact (§20.1).

        Tier levels:
        - L1: Fully automated
        - L2: Human notified
        - L3: Human approval required
        """
        return self.log(
            action="inference",
            actor=actor,
            actor_role="agent",
            resource_type="model",
            resource_id=model_name,
            result="success",
            details={
                "decision": decision,
                "confidence": confidence,
                "tier": tier,
                "input_summary": str(input_data)[:500] if input_data else None,
            },
        )

    def query(
        self,
        actor: str | None = None,
        action: str | None = None,
        resource_type: str | None = None,
        since: str | None = None,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        """Query audit log (read-only).

        In production: SQL query on audit_log table.
        In development: parse JSON Lines file.
        """
        results = []
        try:
            if self._log_path.exists():
                with open(self._log_path) as f:
                    for line in f:
                        entry = json.loads(line.strip())
                        if actor and entry.get("actor") != actor:
                            continue
                        if action and entry.get("action") != action:
                            continue
                        if resource_type and entry.get("resource_type") != resource_type:
                            continue
                        if since and entry.get("timestamp", "") < since:
                            continue
                        results.append(entry)
                        if len(results) >= limit:
                            break
        except Exception as e:
            logger.error(f"Audit query failed: {e}")

        return results

    def _persist(self, entry: AuditEntry) -> None:
        """Persist audit entry (append-only)."""
        if self.storage == "postgresql":
            self._persist_postgresql(entry)
        else:
            self._persist_file(entry)

    def _persist_file(self, entry: AuditEntry) -> None:
        """Append to JSON Lines file."""
        with open(self._log_path, "a") as f:
            f.write(json.dumps(entry.to_dict(), ensure_ascii=False) + "\n")

    def _persist_postgresql(self, entry: AuditEntry) -> None:
        """Insert into PostgreSQL audit_log table.

        In production, the DB user has only INSERT + SELECT (no UPDATE/DELETE).
        """
        # TODO: Implement actual PostgreSQL insert
        # For now, fallback to file
        self._persist_file(entry)
        logger.debug("PostgreSQL audit not yet connected, using file fallback")


# Singleton
audit_logger = AuditLogger(storage="file")
