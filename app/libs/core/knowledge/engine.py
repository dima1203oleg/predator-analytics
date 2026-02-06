"""PREDATOR Knowledge Pipeline v31 - Core Architecture

9 КРИТИЧНИХ ШАРІВ ІНЖЕНЕРІЇ РЕАЛЬНОСТІ:

1. Workflow / State Machine (FSM)
2. Data Quality Engine (DQ)
3. Entity Resolution Engine
4. Data Versioning & Reprocessing
5. Data Observability Layer
6. Rules / Policy Engine
7. Explainability & Audit Trail
8. Human-in-the-loop
9. Load / Cost Governor

Це не ETL. Це система формування знання з відповідальністю.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from collections.abc import Callable
from dataclasses import dataclass, field
import datetime
from enum import Enum
import hashlib
import json
from typing import Any, Dict, List, Optional
import uuid


# ═══════════════════════════════════════════════════════════════════════════
# 1️⃣ WORKFLOW / STATE MACHINE (FSM)
# ═══════════════════════════════════════════════════════════════════════════

class PipelineState(str, Enum):
    """Finite State Machine for Pipeline."""
    CREATED = "CREATED"
    SOURCE_CHECKED = "SOURCE_CHECKED"
    INGESTED = "INGESTED"
    QUALITY_CHECKED = "QUALITY_CHECKED"  # NEW!
    PARSED = "PARSED"
    ENTITIES_RESOLVED = "ENTITIES_RESOLVED"  # NEW!
    TRANSFORMED = "TRANSFORMED"
    LOADED = "LOADED"
    GRAPH_BUILT = "GRAPH_BUILT"
    INDEXED = "INDEXED"
    VECTORIZED = "VECTORIZED"
    READY = "READY"
    FAILED = "FAILED"
    ROLLED_BACK = "ROLLED_BACK"
    PAUSED = "PAUSED"


class StateTransition:
    """Defines valid state transitions with conditions."""

    TRANSITIONS: dict[PipelineState, list[PipelineState]] = {
        PipelineState.CREATED: [PipelineState.SOURCE_CHECKED, PipelineState.FAILED],
        PipelineState.SOURCE_CHECKED: [PipelineState.INGESTED, PipelineState.FAILED],
        PipelineState.INGESTED: [PipelineState.QUALITY_CHECKED, PipelineState.FAILED],
        PipelineState.QUALITY_CHECKED: [PipelineState.PARSED, PipelineState.FAILED, PipelineState.PAUSED],
        PipelineState.PARSED: [PipelineState.ENTITIES_RESOLVED, PipelineState.FAILED],
        PipelineState.ENTITIES_RESOLVED: [PipelineState.TRANSFORMED, PipelineState.FAILED],
        PipelineState.TRANSFORMED: [PipelineState.LOADED, PipelineState.FAILED],
        PipelineState.LOADED: [PipelineState.GRAPH_BUILT, PipelineState.FAILED],
        PipelineState.GRAPH_BUILT: [PipelineState.INDEXED, PipelineState.FAILED],
        PipelineState.INDEXED: [PipelineState.VECTORIZED, PipelineState.FAILED],
        PipelineState.VECTORIZED: [PipelineState.READY, PipelineState.FAILED],
        PipelineState.FAILED: [PipelineState.ROLLED_BACK, PipelineState.CREATED],  # Retry
        PipelineState.PAUSED: [PipelineState.PARSED, PipelineState.FAILED],
    }

    @classmethod
    def can_transition(cls, from_state: PipelineState, to_state: PipelineState) -> bool:
        """Check if transition is valid."""
        if from_state not in cls.TRANSITIONS:
            return False
        return to_state in cls.TRANSITIONS[from_state]

    @classmethod
    def get_next_states(cls, current: PipelineState) -> list[PipelineState]:
        """Get all possible next states."""
        return cls.TRANSITIONS.get(current, [])


@dataclass
class WorkflowEvent:
    """Tracks state transitions for audit."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str = ""
    from_state: str | None = None
    to_state: str = ""
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    duration_ms: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)
    triggered_by: str = "system"  # system, user, rule


class WorkflowOrchestrator:
    """FSM Orchestrator with Redis + PostgreSQL persistence."""

    def __init__(self, redis_client, db_session):
        self.redis = redis_client
        self.db = db_session
        self.state_handlers: dict[PipelineState, Callable] = {}

    async def transition(self, job_id: str, to_state: PipelineState, metadata: dict = None) -> bool:
        """Execute state transition with validation."""
        current = await self._get_current_state(job_id)

        if not StateTransition.can_transition(current, to_state):
            raise InvalidStateTransition(f"Cannot transition from {current} to {to_state}")

        # Create event for audit
        event = WorkflowEvent(
            job_id=job_id,
            from_state=current.value if current else None,
            to_state=to_state.value,
            metadata=metadata or {}
        )

        # Persist to Redis (UI truth)
        await self._set_redis_state(job_id, to_state, event)

        # Persist to PostgreSQL (audit)
        await self._log_event(event)

        # Execute state handler if exists
        if to_state in self.state_handlers:
            await self.state_handlers[to_state](job_id, metadata)

        return True

    async def _get_current_state(self, job_id: str) -> PipelineState | None:
        """Get current state from Redis."""
        state_str = await self.redis.get(f"pipeline:state:{job_id}")
        if state_str:
            return PipelineState(state_str.decode() if isinstance(state_str, bytes) else state_str)
        return None

    async def _set_redis_state(self, job_id: str, state: PipelineState, event: WorkflowEvent):
        """Persist state to Redis with event metadata."""
        await self.redis.hset(
            f"pipeline:state:{job_id}",
            mapping={
                "state": state.value,
                "timestamp": event.timestamp,
                "event_id": event.id
            }
        )

    async def _log_event(self, event: WorkflowEvent):
        """Persist event to PostgreSQL for audit."""
        # Implementation: INSERT into workflow_events table


class InvalidStateTransition(Exception):
    pass


# ═══════════════════════════════════════════════════════════════════════════
# 2️⃣ DATA QUALITY ENGINE (DQ)
# ═══════════════════════════════════════════════════════════════════════════

class QualityCheckResult(str, Enum):
    PASSED = "PASSED"
    WARNING = "WARNING"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


@dataclass
class QualityRule:
    """A single data quality rule."""
    id: str
    name: str
    description: str
    severity: str  # critical, warning, info
    check_fn: str  # Reference to validation function
    parameters: dict[str, Any] = field(default_factory=dict)
    enabled: bool = True


@dataclass
class QualityReport:
    """Full quality report for a dataset."""
    job_id: str
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    total_rows: int = 0
    valid_rows: int = 0
    invalid_rows: int = 0
    warnings: int = 0
    checks: list[dict[str, Any]] = field(default_factory=list)
    anomalies: list[dict[str, Any]] = field(default_factory=list)
    profile: dict[str, Any] = field(default_factory=dict)

    @property
    def quality_score(self) -> float:
        """0-100 quality score."""
        if self.total_rows == 0:
            return 0.0
        return round((self.valid_rows / self.total_rows) * 100, 2)


class DataQualityEngine:
    """Data Quality validation layer."""

    # Built-in rules
    BUILTIN_RULES = {
        "not_null": lambda v, _: v is not None and v != "",
        "positive_number": lambda v, _: isinstance(v, (int, float)) and v > 0,
        "valid_country_code": lambda v, p: len(str(v)) == 2,
        "valid_hs_code": lambda v, p: len(str(v)) in [6, 8, 10],
        "sum_matches": lambda row, p: abs(row.get(p["sum_field"]) - sum(row.get(f) for f in p["addends"])) < 0.01,
        "no_duplicate": lambda row, ctx: row.get(ctx["key_field"]) not in ctx.get("seen_keys", set()),
        "date_not_future": lambda v, _: datetime.datetime.fromisoformat(str(v)) <= datetime.datetime.now() if v else True,
    }

    def __init__(self, rules: list[QualityRule] = None):
        self.rules = rules or []
        self.profile_stats = {}

    def validate_dataset(self, data: list[dict], job_id: str) -> QualityReport:
        """Run all quality checks on dataset."""
        report = QualityReport(job_id=job_id, total_rows=len(data))

        seen_keys = set()
        context = {"seen_keys": seen_keys}

        for i, row in enumerate(data):
            row_valid = True

            for rule in self.rules:
                if not rule.enabled:
                    continue

                result = self._check_rule(rule, row, context)

                if result == QualityCheckResult.FAILED:
                    report.checks.append({
                        "row": i,
                        "rule": rule.id,
                        "result": "FAILED",
                        "severity": rule.severity
                    })
                    if rule.severity == "critical":
                        row_valid = False

                elif result == QualityCheckResult.WARNING:
                    report.warnings += 1
                    report.checks.append({
                        "row": i,
                        "rule": rule.id,
                        "result": "WARNING"
                    })

            if row_valid:
                report.valid_rows += 1
            else:
                report.invalid_rows += 1

            # Track for duplicate detection
            key_field = row.get("declaration_id") or row.get("id")
            if key_field:
                seen_keys.add(key_field)

        # Generate profile
        report.profile = self._generate_profile(data)

        # Detect anomalies
        report.anomalies = self._detect_anomalies(data, report.profile)

        return report

    def _check_rule(self, rule: QualityRule, row: dict, context: dict) -> QualityCheckResult:
        """Execute a single rule check."""
        try:
            check_fn = self.BUILTIN_RULES.get(rule.check_fn)
            if not check_fn:
                return QualityCheckResult.SKIPPED

            # Merge context with rule parameters
            params = {**rule.parameters, **context}

            if check_fn(row, params):
                return QualityCheckResult.PASSED
            return QualityCheckResult.WARNING if rule.severity != "critical" else QualityCheckResult.FAILED
        except Exception:
            return QualityCheckResult.FAILED

    def _generate_profile(self, data: list[dict]) -> dict:
        """Statistical profile of the dataset."""
        if not data:
            return {}

        profile = {
            "row_count": len(data),
            "columns": list(data[0].keys()) if data else [],
            "null_counts": {},
            "unique_counts": {},
            "min_values": {},
            "max_values": {},
        }

        for col in profile["columns"]:
            values = [row.get(col) for row in data]
            non_null = [v for v in values if v is not None]

            profile["null_counts"][col] = len(values) - len(non_null)
            profile["unique_counts"][col] = len(set(str(v) for v in non_null))

            # Numeric stats
            numeric = [v for v in non_null if isinstance(v, (int, float))]
            if numeric:
                profile["min_values"][col] = min(numeric)
                profile["max_values"][col] = max(numeric)

        return profile

    def _detect_anomalies(self, data: list[dict], profile: dict) -> list[dict]:
        """Detect statistical anomalies."""
        anomalies = []

        # Example anomaly detection
        for col in profile.get("columns", []):
            null_ratio = profile["null_counts"].get(col, 0) / len(data) if data else 0
            if null_ratio > 0.5:
                anomalies.append({
                    "type": "high_null_rate",
                    "column": col,
                    "rate": null_ratio,
                    "message": f"Column '{col}' has {null_ratio*100:.1f}% null values"
                })

        return anomalies


# ═══════════════════════════════════════════════════════════════════════════
# 3️⃣ ENTITY RESOLUTION ENGINE
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class EntityMatch:
    """Result of entity matching."""
    source_id: str
    matched_id: str
    confidence: float  # 0.0 - 1.0
    match_type: str  # exact, fuzzy, graph
    evidence: list[str] = field(default_factory=list)


class EntityResolutionEngine:
    """Deduplication and entity merging."""

    def __init__(self, graph_db=None, similarity_threshold: float = 0.85):
        self.graph_db = graph_db
        self.threshold = similarity_threshold
        self.normalization_rules = [
            (r"ТОВ\s*['\"]?", "ТОВ "),
            (r"ПП\s*['\"]?", "ПП "),
            (r"\s+", " "),
            (r"['\"`]", ""),
            (r"^\s+|\s+$", ""),
        ]

    def normalize(self, name: str) -> str:
        """Normalize company/entity name."""
        import re
        result = name.upper()
        for pattern, replacement in self.normalization_rules:
            result = re.sub(pattern, replacement, result)
        return result.strip()

    def find_matches(self, entity: dict, entity_type: str) -> list[EntityMatch]:
        """Find matching entities in the system."""
        matches = []

        if entity_type == "company":
            matches.extend(self._match_company(entity))
        elif entity_type == "person":
            matches.extend(self._match_person(entity))
        elif entity_type == "product":
            matches.extend(self._match_product(entity))

        return sorted(matches, key=lambda m: m.confidence, reverse=True)

    def _match_company(self, entity: dict) -> list[EntityMatch]:
        """Match company entities."""
        matches = []

        name = entity.get("name", "")
        normalized = self.normalize(name)
        edrpou = entity.get("edrpou") or entity.get("code")

        # 1. Exact EDRPOU match (highest confidence)
        if edrpou:
            # Query graph for exact code match
            pass

        # 2. Normalized name match
        # TODO: Query graph for similar names

        # 3. Fuzzy matching with Levenshtein/Jaro-Winkler
        # TODO: Implement fuzzy matching

        return matches

    def _match_person(self, entity: dict) -> list[EntityMatch]:
        """Match person entities."""
        return []

    def _match_product(self, entity: dict) -> list[EntityMatch]:
        """Match product/HS code entities."""
        return []

    def merge_entities(self, primary_id: str, secondary_ids: list[str], reason: str) -> bool:
        """Merge multiple entity records into one."""
        # 1. Update graph relationships
        # 2. Log merge for audit
        # 3. Update search index
        return True

    def fingerprint(self, entity: dict, entity_type: str) -> str:
        """Create unique fingerprint for deduplication."""
        keys = []

        if entity_type == "company":
            keys = [
                self.normalize(entity.get("name", "")),
                str(entity.get("edrpou", "")),
                str(entity.get("country", "")),
            ]
        elif entity_type == "declaration":
            keys = [
                str(entity.get("declaration_number", "")),
                str(entity.get("date", "")),
                str(entity.get("exporter", "")),
            ]

        fingerprint_str = "|".join(keys)
        return hashlib.md5(fingerprint_str.encode()).hexdigest()


# ═══════════════════════════════════════════════════════════════════════════
# 4️⃣ DATA VERSIONING & REPROCESSING
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class DataVersion:
    """Tracks versions of data and processing."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str = ""
    source_hash: str = ""  # SHA256 of source file
    parser_version: str = "1.0.0"
    transform_version: str = "1.0.0"
    rules_version: str = "1.0.0"
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    is_active: bool = True
    supersedes: str | None = None  # Previous version ID
    metadata: dict[str, Any] = field(default_factory=dict)


class VersioningEngine:
    """Data versioning and reprocessing control."""

    def __init__(self, redis_client, db_session, minio_client):
        self.redis = redis_client
        self.db = db_session
        self.minio = minio_client

    async def create_version(self, source_id: str, source_path: str) -> DataVersion:
        """Create new version for a source."""
        source_hash = await self._calculate_hash(source_path)

        # Get current active version
        current = await self._get_active_version(source_id)

        version = DataVersion(
            source_id=source_id,
            source_hash=source_hash,
            supersedes=current.id if current else None
        )

        # Store version
        await self._store_version(version)

        # Update Redis pointer
        await self.redis.set(f"version:active:{source_id}", version.id)

        return version

    async def should_reprocess(self, source_id: str, source_path: str) -> bool:
        """Check if source needs reprocessing."""
        current = await self._get_active_version(source_id)
        if not current:
            return True  # No version exists

        new_hash = await self._calculate_hash(source_path)
        return new_hash != current.source_hash

    async def reprocess_stage(self, job_id: str, from_stage: PipelineState) -> str:
        """Trigger reprocessing from a specific stage."""
        # 1. Mark current results as superseded
        # 2. Reset job state to specified stage
        # 3. Return new job id for tracking
        return str(uuid.uuid4())

    async def _calculate_hash(self, path: str) -> str:
        """Calculate SHA256 hash of file."""
        import aiofiles
        sha256 = hashlib.sha256()
        async with aiofiles.open(path, 'rb') as f:
            while chunk := await f.read(8192):
                sha256.update(chunk)
        return sha256.hexdigest()

    async def _get_active_version(self, source_id: str) -> DataVersion | None:
        """Get current active version."""
        version_id = await self.redis.get(f"version:active:{source_id}")
        if not version_id:
            return None
        # Load from PostgreSQL
        return None

    async def _store_version(self, version: DataVersion):
        """Persist version to PostgreSQL."""


# ═══════════════════════════════════════════════════════════════════════════
# 5️⃣ DATA OBSERVABILITY LAYER
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class DataMetrics:
    """Data-specific metrics for observability."""
    job_id: str
    stage: str
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    rows_in: int = 0
    rows_out: int = 0
    rows_dropped: int = 0
    latency_ms: int = 0
    errors: int = 0
    anomalies: int = 0
    custom: dict[str, Any] = field(default_factory=dict)

    @property
    def drop_rate(self) -> float:
        if self.rows_in == 0:
            return 0.0
        return self.rows_dropped / self.rows_in


class DataObservabilityLayer:
    """Observability for data, not just services."""

    def __init__(self, prometheus_registry=None, redis_client=None):
        self.registry = prometheus_registry
        self.redis = redis_client
        self._init_metrics()

    def _init_metrics(self):
        """Initialize Prometheus metrics for data."""
        from prometheus_client import Counter, Gauge, Histogram

        self.rows_processed = Counter(
            'data_rows_processed_total',
            'Total rows processed',
            ['job_id', 'stage', 'status']
        )

        self.rows_dropped = Counter(
            'data_rows_dropped_total',
            'Total rows dropped',
            ['job_id', 'stage', 'reason']
        )

        self.data_latency = Histogram(
            'data_stage_latency_seconds',
            'Data processing latency per stage',
            ['stage'],
            buckets=[0.1, 0.5, 1, 2, 5, 10, 30, 60, 120]
        )

        self.quality_score = Gauge(
            'data_quality_score',
            'Current data quality score (0-100)',
            ['job_id']
        )

        self.anomalies_detected = Counter(
            'data_anomalies_detected_total',
            'Total anomalies detected',
            ['job_id', 'anomaly_type']
        )

    def record_stage(self, metrics: DataMetrics):
        """Record metrics for a pipeline stage."""
        self.rows_processed.labels(
            job_id=metrics.job_id,
            stage=metrics.stage,
            status="processed"
        ).inc(metrics.rows_in)

        self.rows_dropped.labels(
            job_id=metrics.job_id,
            stage=metrics.stage,
            reason="validation"
        ).inc(metrics.rows_dropped)

        self.data_latency.labels(stage=metrics.stage).observe(metrics.latency_ms / 1000)

    def set_quality_score(self, job_id: str, score: float):
        """Set current quality score for job."""
        self.quality_score.labels(job_id=job_id).set(score)

    def record_anomaly(self, job_id: str, anomaly_type: str):
        """Record detected anomaly."""
        self.anomalies_detected.labels(
            job_id=job_id,
            anomaly_type=anomaly_type
        ).inc()

    async def get_pipeline_health(self, job_id: str) -> dict:
        """Get overall pipeline health for a job."""
        # Aggregate metrics from Redis
        return {
            "job_id": job_id,
            "status": "healthy",
            "stages_completed": 0,
            "total_rows": 0,
            "dropped_rows": 0,
            "quality_score": 0.0,
            "anomalies": 0
        }


# ═══════════════════════════════════════════════════════════════════════════
# 6️⃣ RULES / POLICY ENGINE
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Rule:
    """A business/fraud rule definition."""
    id: str
    name: str
    description: str
    version: str = "1.0.0"
    enabled: bool = True
    category: str = "general"  # fraud, customs, sanctions, business
    priority: int = 0
    conditions: list[dict[str, Any]] = field(default_factory=list)
    actions: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class RuleEngine:
    """No-code rules execution engine."""

    def __init__(self, rules_path: str = None):
        self.rules: dict[str, Rule] = {}
        self.operators = {
            "eq": lambda a, b: a == b,
            "ne": lambda a, b: a != b,
            "gt": lambda a, b: a > b,
            "gte": lambda a, b: a >= b,
            "lt": lambda a, b: a < b,
            "lte": lambda a, b: a <= b,
            "in": lambda a, b: a in b,
            "contains": lambda a, b: b in str(a),
            "regex": lambda a, b: bool(__import__("re").match(b, str(a))),
            "between": lambda a, b: b[0] <= a <= b[1],
        }

        if rules_path:
            self.load_rules(rules_path)

    def load_rules(self, path: str):
        """Load rules from YAML/JSON file."""
        import yaml
        with open(path) as f:
            data = yaml.safe_load(f)

        for rule_data in data.get("rules", []):
            rule = Rule(**rule_data)
            self.rules[rule.id] = rule

    def evaluate(self, entity: dict, context: dict = None) -> list[dict]:
        """Evaluate all rules against an entity."""
        results = []
        context = context or {}

        for rule in sorted(self.rules.values(), key=lambda r: r.priority, reverse=True):
            if not rule.enabled:
                continue

            if self._evaluate_conditions(rule.conditions, entity, context):
                result = {
                    "rule_id": rule.id,
                    "rule_name": rule.name,
                    "category": rule.category,
                    "triggered": True,
                    "actions": rule.actions,
                    "timestamp": datetime.datetime.now().isoformat()
                }
                results.append(result)

                # Execute actions
                self._execute_actions(rule.actions, entity, context)

        return results

    def _evaluate_conditions(self, conditions: list[dict], entity: dict, context: dict) -> bool:
        """Evaluate all conditions (AND logic by default)."""
        for condition in conditions:
            field = condition.get("field")
            operator = condition.get("operator", "eq")
            value = condition.get("value")

            # Get entity value (supports nested paths)
            entity_value = self._get_nested_value(entity, field)

            # Resolve value references (e.g., $context.threshold)
            if isinstance(value, str) and value.startswith("$"):
                value = self._resolve_reference(value, entity, context)

            # Apply operator
            op_fn = self.operators.get(operator)
            if not op_fn:
                continue

            if not op_fn(entity_value, value):
                return False

        return True

    def _execute_actions(self, actions: list[dict], entity: dict, context: dict):
        """Execute rule actions."""
        for action in actions:
            action_type = action.get("type")

            if action_type == "flag":
                entity["_flags"] = entity.get("_flags", [])
                entity["_flags"].append(action.get("flag"))

            elif action_type == "alert":
                # Trigger alert system
                pass

            elif action_type == "score":
                entity["_risk_score"] = entity.get("_risk_score", 0)
                entity["_risk_score"] += action.get("points", 0)

    def _get_nested_value(self, obj: dict, path: str) -> Any:
        """Get value from nested dict using dot notation."""
        parts = path.split(".")
        current = obj
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
        return current

    def _resolve_reference(self, ref: str, entity: dict, context: dict) -> Any:
        """Resolve $references in rule values."""
        if ref.startswith("$entity."):
            return self._get_nested_value(entity, ref[8:])
        if ref.startswith("$context."):
            return self._get_nested_value(context, ref[9:])
        return ref


# ═══════════════════════════════════════════════════════════════════════════
# 7️⃣ EXPLAINABILITY & AUDIT TRAIL
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class Explanation:
    """Explanation of a system decision."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    entity_id: str = ""
    decision_type: str = ""  # risk_flag, entity_merge, rule_trigger
    confidence: float = 0.0
    factors: list[dict[str, Any]] = field(default_factory=list)
    evidence: list[dict[str, Any]] = field(default_factory=list)
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().isoformat())

    def to_natural_language(self) -> str:
        """Generate human-readable explanation."""
        lines = [f"Рішення: {self.decision_type}"]
        lines.append(f"Впевненість: {self.confidence * 100:.1f}%")
        lines.append("\nПричини:")

        for i, factor in enumerate(self.factors, 1):
            lines.append(f"  {i}. {factor.get('description', 'N/A')}")
            if factor.get('weight'):
                lines.append(f"     Вага: {factor['weight']}")

        if self.evidence:
            lines.append("\nДокази:")
            for ev in self.evidence:
                lines.append(f"  - {ev.get('type')}: {ev.get('value')}")

        return "\n".join(lines)


@dataclass
class AuditEntry:
    """Immutable audit log entry."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    actor: str = "system"  # system, user:id, rule:id
    action: str = ""  # created, modified, merged, flagged, reviewed
    entity_type: str = ""
    entity_id: str = ""
    changes: dict[str, Any] = field(default_factory=dict)
    reason: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


class ExplainabilityEngine:
    """Audit trail and decision explanation."""

    def __init__(self, db_session):
        self.db = db_session
        self.audit_log = []  # In-memory buffer, flush to PostgreSQL

    def explain_decision(
        self,
        entity_id: str,
        decision_type: str,
        rules_triggered: list[dict],
        graph_paths: list[dict] = None,
        embedding_matches: list[dict] = None
    ) -> Explanation:
        """Generate explanation for a decision."""
        factors = []
        evidence = []
        total_weight = 0.0

        # Factor 1: Rules
        for rule in rules_triggered:
            weight = rule.get("weight", 0.3)
            factors.append({
                "type": "rule",
                "id": rule.get("rule_id"),
                "description": f"Спрацювало правило: {rule.get('rule_name')}",
                "weight": weight
            })
            total_weight += weight
            evidence.append({
                "type": "rule_trigger",
                "value": rule.get("rule_id")
            })

        # Factor 2: Graph connections
        if graph_paths:
            for path in graph_paths:
                factors.append({
                    "type": "graph",
                    "description": f"Зв'язок у графі: {path.get('description')}",
                    "weight": path.get("weight", 0.2)
                })
                total_weight += path.get("weight", 0.2)

        # Factor 3: Embedding similarity
        if embedding_matches:
            for match in embedding_matches:
                factors.append({
                    "type": "semantic",
                    "description": f"Семантична схожість з {match.get('matched_id')}",
                    "weight": match.get("similarity", 0.0) * 0.3
                })
                total_weight += match.get("similarity", 0.0) * 0.3

        # Normalize confidence
        confidence = min(total_weight, 1.0)

        explanation = Explanation(
            entity_id=entity_id,
            decision_type=decision_type,
            confidence=confidence,
            factors=factors,
            evidence=evidence
        )

        # Log to audit
        self._log_explanation(explanation)

        return explanation

    def log_action(
        self,
        actor: str,
        action: str,
        entity_type: str,
        entity_id: str,
        changes: dict = None,
        reason: str = ""
    ) -> AuditEntry:
        """Log an action to audit trail."""
        entry = AuditEntry(
            actor=actor,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            changes=changes or {},
            reason=reason
        )

        self.audit_log.append(entry)

        # Async flush to PostgreSQL
        if len(self.audit_log) >= 100:
            self._flush_audit_log()

        return entry

    def get_entity_history(self, entity_id: str) -> list[AuditEntry]:
        """Get full audit history for an entity."""
        return [e for e in self.audit_log if e.entity_id == entity_id]

    def _log_explanation(self, explanation: Explanation):
        """Log explanation to audit."""
        self.log_action(
            actor="system",
            action="decision_made",
            entity_type="entity",
            entity_id=explanation.entity_id,
            changes={"explanation_id": explanation.id},
            reason=explanation.decision_type
        )

    def _flush_audit_log(self):
        """Flush audit log to PostgreSQL."""


# ═══════════════════════════════════════════════════════════════════════════
# 8️⃣ HUMAN-IN-THE-LOOP
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class ReviewTask:
    """A task for human review."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    task_type: str = ""  # entity_merge, false_positive, rule_feedback
    priority: str = "normal"  # critical, high, normal, low
    status: str = "pending"  # pending, assigned, completed, rejected
    entity_id: str = ""
    entity_type: str = ""
    context: dict[str, Any] = field(default_factory=dict)
    suggestion: dict[str, Any] = field(default_factory=dict)
    assigned_to: str | None = None
    created_at: str = field(default_factory=lambda: datetime.datetime.now().isoformat())
    completed_at: str | None = None
    feedback: dict[str, Any] | None = None


class HumanInTheLoopController:
    """Human feedback and correction layer."""

    def __init__(self, db_session, notification_service=None):
        self.db = db_session
        self.notifications = notification_service
        self.tasks: dict[str, ReviewTask] = {}

    def request_review(
        self,
        task_type: str,
        entity_id: str,
        entity_type: str,
        suggestion: dict,
        priority: str = "normal",
        context: dict = None
    ) -> ReviewTask:
        """Create a review task for human."""
        task = ReviewTask(
            task_type=task_type,
            priority=priority,
            entity_id=entity_id,
            entity_type=entity_type,
            suggestion=suggestion,
            context=context or {}
        )

        self.tasks[task.id] = task

        # Notify if critical
        if priority in ["critical", "high"] and self.notifications:
            self.notifications.send(
                channel="review_queue",
                message=f"Нове завдання на огляд: {task_type} ({priority})"
            )

        return task

    def submit_feedback(
        self,
        task_id: str,
        decision: str,  # approve, reject, modify
        corrections: dict = None,
        notes: str = ""
    ) -> bool:
        """Submit human feedback on a task."""
        task = self.tasks.get(task_id)
        if not task:
            return False

        task.status = "completed"
        task.completed_at = datetime.datetime.now().isoformat()
        task.feedback = {
            "decision": decision,
            "corrections": corrections or {},
            "notes": notes
        }

        # Apply corrections
        if decision == "approve":
            self._apply_suggestion(task)
        elif decision == "modify":
            self._apply_corrections(task, corrections)
        elif decision == "reject":
            self._log_rejection(task)

        return True

    def get_pending_tasks(self, user_id: str = None, priority: str = None) -> list[ReviewTask]:
        """Get pending review tasks."""
        tasks = [t for t in self.tasks.values() if t.status == "pending"]

        if priority:
            tasks = [t for t in tasks if t.priority == priority]

        return sorted(tasks, key=lambda t: (
            {"critical": 0, "high": 1, "normal": 2, "low": 3}.get(t.priority, 99),
            t.created_at
        ))

    def _apply_suggestion(self, task: ReviewTask):
        """Apply the system's suggestion."""
        # Depends on task type
        if task.task_type == "entity_merge":
            # Merge entities
            pass
        elif task.task_type == "false_positive":
            # Disable rule for this entity
            pass

    def _apply_corrections(self, task: ReviewTask, corrections: dict):
        """Apply human corrections."""

    def _log_rejection(self, task: ReviewTask):
        """Log rejection for analytics."""


# ═══════════════════════════════════════════════════════════════════════════
# 9️⃣ LOAD / COST GOVERNOR
# ═══════════════════════════════════════════════════════════════════════════

@dataclass
class ResourceBudget:
    """Budget configuration for a resource type."""
    resource_type: str  # llm, embedding, telegram, scraping
    daily_limit: float = 100.0
    hourly_limit: float = 10.0
    concurrent_limit: int = 5
    cost_per_unit: float = 0.0
    priority: int = 0  # Higher = more important


class LoadCostGovernor:
    """Rate limiting, budgeting, and degradation control."""

    def __init__(self, redis_client):
        self.redis = redis_client
        self.budgets: dict[str, ResourceBudget] = {}
        self.degradation_mode = False

    def configure_budget(self, budget: ResourceBudget):
        """Configure budget for a resource."""
        self.budgets[budget.resource_type] = budget

    async def can_proceed(self, resource_type: str, units: float = 1.0) -> bool:
        """Check if operation can proceed within budget."""
        budget = self.budgets.get(resource_type)
        if not budget:
            return True  # No budget = no limit

        # Check concurrent limit
        concurrent = await self._get_concurrent(resource_type)
        if concurrent >= budget.concurrent_limit:
            return False

        # Check hourly limit
        hourly = await self._get_usage(resource_type, "hour")
        if hourly + units > budget.hourly_limit:
            return False

        # Check daily limit
        daily = await self._get_usage(resource_type, "day")
        if daily + units > budget.daily_limit:
            return False

        return True

    async def record_usage(self, resource_type: str, units: float = 1.0, cost: float = 0.0):
        """Record resource usage."""
        now = datetime.datetime.now()
        hour_key = f"usage:{resource_type}:hour:{now.strftime('%Y%m%d%H')}"
        day_key = f"usage:{resource_type}:day:{now.strftime('%Y%m%d')}"

        await self.redis.incrbyfloat(hour_key, units)
        await self.redis.expire(hour_key, 7200)  # 2 hours

        await self.redis.incrbyfloat(day_key, units)
        await self.redis.expire(day_key, 172800)  # 2 days

        # Track costs
        if cost > 0:
            cost_key = f"cost:{resource_type}:day:{now.strftime('%Y%m%d')}"
            await self.redis.incrbyfloat(cost_key, cost)
            await self.redis.expire(cost_key, 172800)

    async def enter_degradation_mode(self, reason: str):
        """Enable degradation mode (reduce non-critical operations)."""
        self.degradation_mode = True
        await self.redis.set("system:degradation", json.dumps({
            "enabled": True,
            "reason": reason,
            "timestamp": datetime.datetime.now().isoformat()
        }))

    async def exit_degradation_mode(self):
        """Exit degradation mode."""
        self.degradation_mode = False
        await self.redis.delete("system:degradation")

    def get_priority_queue_key(self, resource_type: str, priority: int) -> str:
        """Get queue key for prioritized processing."""
        return f"queue:{resource_type}:p{priority}"

    async def _get_concurrent(self, resource_type: str) -> int:
        """Get current concurrent operations."""
        key = f"concurrent:{resource_type}"
        val = await self.redis.get(key)
        return int(val) if val else 0

    async def _get_usage(self, resource_type: str, period: str) -> float:
        """Get usage for period."""
        now = datetime.datetime.now()
        if period == "hour":
            key = f"usage:{resource_type}:hour:{now.strftime('%Y%m%d%H')}"
        else:
            key = f"usage:{resource_type}:day:{now.strftime('%Y%m%d')}"

        val = await self.redis.get(key)
        return float(val) if val else 0.0

    async def get_cost_summary(self) -> dict:
        """Get cost summary for today."""
        now = datetime.datetime.now()
        summary = {"date": now.strftime("%Y-%m-%d"), "resources": {}}

        for resource_type in self.budgets:
            cost_key = f"cost:{resource_type}:day:{now.strftime('%Y%m%d')}"
            cost = await self.redis.get(cost_key)
            summary["resources"][resource_type] = float(cost) if cost else 0.0

        summary["total"] = sum(summary["resources"].values())
        return summary


# ═══════════════════════════════════════════════════════════════════════════
# EXPORTS
# ═══════════════════════════════════════════════════════════════════════════

__all__ = [
    # State Machine
    "PipelineState",
    "StateTransition",
    "WorkflowOrchestrator",
    "WorkflowEvent",

    # Data Quality
    "DataQualityEngine",
    "QualityRule",
    "QualityReport",

    # Entity Resolution
    "EntityResolutionEngine",
    "EntityMatch",

    # Versioning
    "VersioningEngine",
    "DataVersion",

    # Observability
    "DataObservabilityLayer",
    "DataMetrics",

    # Rules Engine
    "RuleEngine",
    "Rule",

    # Explainability
    "ExplainabilityEngine",
    "Explanation",
    "AuditEntry",

    # Human-in-the-loop
    "HumanInTheLoopController",
    "ReviewTask",

    # Cost Governor
    "LoadCostGovernor",
    "ResourceBudget",
]
