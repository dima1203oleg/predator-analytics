# 🏛️ SOVEREIGN OBSERVER MODULE (SOM) - ТЕХНІЧНА СПЕЦИФІКАЦІЯ

## Версія: 1.0
## Статус: Конституційний Гіпервізор для Predator Analytics v45-S
## Дата: 2026-01-12

---

# 1. АРХІТЕКТУРА SOM

## 1.1 Високорівнева Архітектура

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SOVEREIGN OBSERVER MODULE (SOM)                          │
│                        Конституційний Гіпервізор                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                    CENTRAL OVERSIGHT CORE                             │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐   │ │
│  │  │ State Model │  │  Anomaly    │  │   Constitutional           │   │ │
│  │  │   (Graph)   │──│  Detector   │──│   Compliance Monitor       │   │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │              MULTI-AGENT ORCHESTRATOR                                 │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │ │
│  │  │ Architect │  │ Engineer  │  │  Auditor  │  │    Negotiator     │  │ │
│  │  │   Agent   │──│   Agent   │──│   Agent   │──│      Agent        │  │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │           AUTONOMOUS IMPROVEMENT ENGINE                               │ │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────────────┐  │ │
│  │  │  Digital  │  │   Chaos   │  │  Bench-   │  │      Idea         │  │ │
│  │  │   Twin    │──│  Testing  │──│  marking  │──│     Garden        │  │ │
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                     │
│  ┌───────────────────────────────────┼───────────────────────────────────┐ │
│  │           HUMAN SOVEREIGNTY INTERFACE                                 │ │
│  │  ┌───────────────┐  ┌─────────────────┐  ┌───────────────────────┐   │ │
│  │  │   Approval    │  │   Red Button    │  │   Explainability      │   │ │
│  │  │   Gateway     │──│   Protocol      │──│   Dashboard           │   │ │
│  │  └───────────────┘  └─────────────────┘  └───────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   AZR Engine    │  │  Arbiter Court  │  │   Truth Ledger  │
│                 │  │                 │  │                 │
│  (Execution)    │  │  (Decisions)    │  │  (Audit Trail)  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 1.2 Принцип Трьох Кілець Контролю

```yaml
Three_Rings_of_Control:

  inner_ring:
    name: "SOM Core"
    description: "Автоматичне виявлення аномалій та генерація не-критичних патчів"
    automation_level: "HIGH"
    human_involvement: "NONE"
    scope:
      - "Виявлення аномалій та дрейфу"
      - "Генерація документації"
      - "Простий рефакторинг коду"
      - "Оновлення залежностей (minor/patch)"
      - "Оптимізація параметрів"

    constraints:
      - "Не може змінювати код безпеки"
      - "Не може змінювати конституційні аксіоми"
      - "Не може видаляти дані"
      - "Максимальний ризик: LOW (< 5%)"

  middle_ring:
    name: "Arbiter Contour"
    description: "Зміни, що стосуються безпеки, архітектури або конституції"
    automation_level: "MEDIUM"
    human_involvement: "REVIEW"
    scope:
      - "Архітектурний рефакторинг"
      - "Зміни в алгоритмах"
      - "Міграції схем даних"
      - "Оновлення залежностей (major)"
      - "Зміни в конфігурації безпеки"

    constraints:
      - "Потребує схвалення Arbiter Court"
      - "Human-in-the-Loop для критичних рішень"
      - "Обов'язкове тестування в Digital Twin"
      - "Максимальний ризик: MEDIUM (< 15%)"

  outer_ring:
    name: "Human Sovereignty"
    description: "Абсолютний людський контроль"
    automation_level: "NONE"
    human_involvement: "MANDATORY"
    scope:
      - "Зміни конституційних аксіом"
      - "Видалення критичних даних"
      - "Інтеграція з зовнішніми системами"
      - "Зміни в правах доступу"
      - "Emergency protocols"

    mechanisms:
      - "Red Button (3 рівні)"
      - "Approval Gateway"
      - "Veto власника системи"
      - "Physical key override"
```

---

# 2. КОМПОНЕНТИ SOM

## 2.1 Central Oversight Core

### System-Wide State Model
```python
# services/som/app/core/state_model.py

from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from datetime import datetime
import networkx as nx
import json

@dataclass
class SystemComponent:
    """Represents a component in the system state graph"""
    id: str
    type: str  # service, agent, database, queue, etc.
    name: str
    status: str  # healthy, degraded, unhealthy, unknown
    metrics: Dict[str, float] = field(default_factory=dict)
    dependencies: List[str] = field(default_factory=list)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

class SystemStateModel:
    """
    Graph-based model of the entire system state.
    Updated in real-time from monitoring data.
    """

    def __init__(self):
        self.graph = nx.DiGraph()
        self.component_registry: Dict[str, SystemComponent] = {}
        self.event_history: List[Dict] = []
        self.state_snapshots: List[Dict] = []

    def register_component(self, component: SystemComponent):
        """Register a new component in the state model"""
        self.component_registry[component.id] = component
        self.graph.add_node(
            component.id,
            type=component.type,
            name=component.name,
            status=component.status
        )

        # Add dependency edges
        for dep_id in component.dependencies:
            self.graph.add_edge(component.id, dep_id, type="depends_on")

        self._record_event("component_registered", component.id)

    def update_component_status(self, component_id: str, status: str, metrics: Dict = None):
        """Update component status and metrics"""
        if component_id in self.component_registry:
            component = self.component_registry[component_id]
            old_status = component.status
            component.status = status
            component.last_updated = datetime.utcnow()

            if metrics:
                component.metrics.update(metrics)

            self.graph.nodes[component_id]["status"] = status

            if old_status != status:
                self._record_event("status_changed", component_id, {
                    "old_status": old_status,
                    "new_status": status
                })

    def get_component_health(self, component_id: str) -> Dict:
        """Get detailed health information for a component"""
        if component_id not in self.component_registry:
            return {"error": "Component not found"}

        component = self.component_registry[component_id]

        # Check dependency health
        dep_health = []
        for dep_id in component.dependencies:
            if dep_id in self.component_registry:
                dep = self.component_registry[dep_id]
                dep_health.append({
                    "id": dep_id,
                    "status": dep.status,
                    "healthy": dep.status == "healthy"
                })

        return {
            "component_id": component_id,
            "status": component.status,
            "metrics": component.metrics,
            "dependencies": dep_health,
            "last_updated": component.last_updated.isoformat(),
            "overall_health": self._calculate_overall_health(component, dep_health)
        }

    def get_system_topology(self) -> Dict:
        """Get full system topology as a serializable structure"""
        return {
            "nodes": [
                {
                    "id": node,
                    **self.graph.nodes[node]
                }
                for node in self.graph.nodes
            ],
            "edges": [
                {
                    "source": edge[0],
                    "target": edge[1],
                    **self.graph.edges[edge]
                }
                for edge in self.graph.edges
            ],
            "statistics": {
                "total_components": len(self.graph.nodes),
                "total_dependencies": len(self.graph.edges),
                "healthy_components": sum(
                    1 for c in self.component_registry.values()
                    if c.status == "healthy"
                )
            }
        }

    def detect_cascading_failure_risk(self) -> List[Dict]:
        """Identify components that could cause cascading failures"""
        risks = []

        # Find components with many dependents
        for node in self.graph.nodes:
            dependents = list(self.graph.predecessors(node))
            if len(dependents) > 3:
                component = self.component_registry.get(node)
                if component and component.status != "healthy":
                    risks.append({
                        "component_id": node,
                        "status": component.status,
                        "dependent_count": len(dependents),
                        "dependents": dependents,
                        "risk_level": "HIGH" if len(dependents) > 5 else "MEDIUM"
                    })

        return sorted(risks, key=lambda x: x["dependent_count"], reverse=True)

    def take_snapshot(self) -> str:
        """Take a snapshot of current system state"""
        snapshot_id = f"snapshot_{datetime.utcnow().isoformat()}"
        snapshot = {
            "id": snapshot_id,
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                cid: {
                    "status": c.status,
                    "metrics": c.metrics.copy()
                }
                for cid, c in self.component_registry.items()
            }
        }
        self.state_snapshots.append(snapshot)
        return snapshot_id

    def _record_event(self, event_type: str, component_id: str, details: Dict = None):
        self.event_history.append({
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type,
            "component_id": component_id,
            "details": details or {}
        })

    def _calculate_overall_health(self, component: SystemComponent, dep_health: List[Dict]) -> float:
        """Calculate overall health score 0.0 - 1.0"""
        status_scores = {
            "healthy": 1.0,
            "degraded": 0.5,
            "unhealthy": 0.0,
            "unknown": 0.3
        }

        component_score = status_scores.get(component.status, 0.3)

        if not dep_health:
            return component_score

        dep_score = sum(
            1.0 if d["healthy"] else 0.0
            for d in dep_health
        ) / len(dep_health)

        # Component contributes 60%, dependencies 40%
        return component_score * 0.6 + dep_score * 0.4
```

### Anomaly Detector
```python
# services/som/app/core/anomaly_detector.py

from dataclasses import dataclass
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import deque
import statistics
import logging

logger = logging.getLogger("som.anomaly_detector")

@dataclass
class Anomaly:
    id: str
    type: str  # performance_drift, error_spike, resource_exhaustion, etc.
    component_id: str
    severity: str  # info, warning, high, critical
    description: str
    detected_at: datetime
    metrics: Dict[str, Any]
    suggested_action: Optional[str] = None
    auto_remediation_eligible: bool = False

class AnomalyDetector:
    """
    Detects anomalies in system behavior using statistical methods
    and pattern recognition.
    """

    def __init__(self, state_model):
        self.state_model = state_model
        self.metric_history: Dict[str, deque] = {}
        self.history_window = 1000  # Keep last 1000 data points
        self.baseline: Dict[str, Dict] = {}
        self.detected_anomalies: List[Anomaly] = []

    async def analyze(self) -> List[Anomaly]:
        """Run full anomaly detection cycle"""
        anomalies = []

        for component_id, component in self.state_model.component_registry.items():
            # Update metric history
            self._update_history(component_id, component.metrics)

            # Detect different anomaly types
            anomalies.extend(await self._detect_performance_drift(component_id, component))
            anomalies.extend(await self._detect_resource_exhaustion(component_id, component))
            anomalies.extend(await self._detect_error_spike(component_id, component))
            anomalies.extend(await self._detect_dependency_issues(component_id, component))

        # Record detected anomalies
        self.detected_anomalies.extend(anomalies)

        return anomalies

    async def _detect_performance_drift(self, component_id: str, component) -> List[Anomaly]:
        """Detect gradual performance degradation"""
        anomalies = []

        for metric_name, current_value in component.metrics.items():
            history_key = f"{component_id}:{metric_name}"

            if history_key not in self.metric_history:
                continue

            history = list(self.metric_history[history_key])
            if len(history) < 10:
                continue

            # Calculate baseline statistics
            mean = statistics.mean(history)
            stdev = statistics.stdev(history) if len(history) > 1 else 0

            # Check for significant deviation
            if stdev > 0:
                z_score = (current_value - mean) / stdev

                if abs(z_score) > 3:  # More than 3 standard deviations
                    severity = "critical" if abs(z_score) > 5 else "high"
                    anomalies.append(Anomaly(
                        id=f"perf_drift_{component_id}_{metric_name}_{datetime.utcnow().timestamp()}",
                        type="performance_drift",
                        component_id=component_id,
                        severity=severity,
                        description=f"Metric {metric_name} deviated {z_score:.2f} std from baseline",
                        detected_at=datetime.utcnow(),
                        metrics={
                            "metric_name": metric_name,
                            "current_value": current_value,
                            "baseline_mean": mean,
                            "baseline_stdev": stdev,
                            "z_score": z_score
                        },
                        suggested_action="Investigate root cause of performance change",
                        auto_remediation_eligible=False
                    ))

        return anomalies

    async def _detect_resource_exhaustion(self, component_id: str, component) -> List[Anomaly]:
        """Detect resource exhaustion patterns"""
        anomalies = []

        resource_metrics = {
            "cpu_usage": 0.90,      # 90% threshold
            "memory_usage": 0.85,   # 85% threshold
            "disk_usage": 0.90,     # 90% threshold
            "connection_pool": 0.80  # 80% threshold
        }

        for metric, threshold in resource_metrics.items():
            if metric in component.metrics:
                value = component.metrics[metric]
                if value > threshold:
                    severity = "critical" if value > 0.95 else "high"
                    anomalies.append(Anomaly(
                        id=f"resource_{component_id}_{metric}_{datetime.utcnow().timestamp()}",
                        type="resource_exhaustion",
                        component_id=component_id,
                        severity=severity,
                        description=f"{metric} at {value*100:.1f}% (threshold: {threshold*100:.0f}%)",
                        detected_at=datetime.utcnow(),
                        metrics={
                            "metric": metric,
                            "value": value,
                            "threshold": threshold
                        },
                        suggested_action=f"Scale or optimize {component_id}",
                        auto_remediation_eligible=metric != "disk_usage"
                    ))

        return anomalies

    async def _detect_error_spike(self, component_id: str, component) -> List[Anomaly]:
        """Detect sudden increase in errors"""
        anomalies = []

        if "error_rate" in component.metrics:
            error_rate = component.metrics["error_rate"]

            if error_rate > 0.05:  # More than 5% error rate
                severity = "critical" if error_rate > 0.20 else "high"
                anomalies.append(Anomaly(
                    id=f"error_spike_{component_id}_{datetime.utcnow().timestamp()}",
                    type="error_spike",
                    component_id=component_id,
                    severity=severity,
                    description=f"Error rate at {error_rate*100:.1f}%",
                    detected_at=datetime.utcnow(),
                    metrics={"error_rate": error_rate},
                    suggested_action="Check logs and recent deployments",
                    auto_remediation_eligible=False
                ))

        return anomalies

    async def _detect_dependency_issues(self, component_id: str, component) -> List[Anomaly]:
        """Detect issues with component dependencies"""
        anomalies = []

        for dep_id in component.dependencies:
            if dep_id in self.state_model.component_registry:
                dep = self.state_model.component_registry[dep_id]
                if dep.status == "unhealthy":
                    anomalies.append(Anomaly(
                        id=f"dep_issue_{component_id}_{dep_id}_{datetime.utcnow().timestamp()}",
                        type="dependency_failure",
                        component_id=component_id,
                        severity="high",
                        description=f"Dependency {dep_id} is unhealthy",
                        detected_at=datetime.utcnow(),
                        metrics={"dependency_id": dep_id, "dependency_status": dep.status},
                        suggested_action=f"Investigate {dep_id} issues first",
                        auto_remediation_eligible=False
                    ))

        return anomalies

    def _update_history(self, component_id: str, metrics: Dict):
        """Update metric history for baseline calculation"""
        for metric_name, value in metrics.items():
            if not isinstance(value, (int, float)):
                continue

            history_key = f"{component_id}:{metric_name}"

            if history_key not in self.metric_history:
                self.metric_history[history_key] = deque(maxlen=self.history_window)

            self.metric_history[history_key].append(value)
```

---

# 3. API ENDPOINTS

## 3.1 SOM REST API

```yaml
SOM_API_Endpoints:

  # Health & Status
  health:
    method: GET
    path: /api/v1/som/health
    response: { status: healthy, version: "28.0.0" }

  status:
    method: GET
    path: /api/v1/som/status
    response:
      active: true
      ring_level: "inner"
      pending_proposals: 5
      last_analysis: "2026-01-12T22:30:00Z"

  # State Model
  topology:
    method: GET
    path: /api/v1/som/topology
    response: { nodes: [...], edges: [...], statistics: {...} }

  component_health:
    method: GET
    path: /api/v1/som/components/{id}/health
    response: { component_id, status, metrics, dependencies, overall_health }

  # Anomaly Detection
  anomalies:
    method: GET
    path: /api/v1/som/anomalies
    query: { severity: "high", since: "2026-01-12T00:00:00Z" }
    response: { anomalies: [...], total: 23 }

  analyze_now:
    method: POST
    path: /api/v1/som/analyze
    response: { analysis_id, anomalies_found, duration_ms }

  # Improvement Engine
  proposals:
    method: GET
    path: /api/v1/som/proposals
    query: { status: "pending" }
    response: { proposals: [...], total: 5 }

  submit_proposal:
    method: POST
    path: /api/v1/som/proposals
    body: { type, description, target_component, changes }
    response: { proposal_id, status: "submitted", estimated_review_time }

  proposal_detail:
    method: GET
    path: /api/v1/som/proposals/{id}
    response: { proposal details, simulation_results, risk_assessment }

  approve_proposal:
    method: POST
    path: /api/v1/som/proposals/{id}/approve
    body: { approver_id, authority_level, notes }
    response: { approved: true, execution_scheduled }

  reject_proposal:
    method: POST
    path: /api/v1/som/proposals/{id}/reject
    body: { rejector_id, reason }
    response: { rejected: true, archived: true }

  # Human Sovereignty Interface
  red_button:
    method: POST
    path: /api/v1/som/emergency
    body: { level: 1|2|3, operator_id, confirmation_code }
    response: { activated: true, affected_components: [...] }

  pending_approvals:
    method: GET
    path: /api/v1/som/approvals/pending
    response: { approvals: [...], urgent_count: 2 }

  decision_history:
    method: GET
    path: /api/v1/som/decisions
    query: { limit: 50, offset: 0 }
    response: { decisions: [...], total: 156 }
```

---

# 4. КОНТРОЛЬ ДОСТУПУ

```yaml
SOM_Access_Control:

  roles:
    viewer:
      permissions:
        - "som:status:read"
        - "som:anomalies:read"
        - "som:topology:read"

    operator:
      inherits: viewer
      permissions:
        - "som:proposals:read"
        - "som:analyze:trigger"
        - "som:approvals:read"

    admin:
      inherits: operator
      permissions:
        - "som:proposals:approve"
        - "som:proposals:reject"
        - "som:emergency:level1"
        - "som:emergency:level2"

    sovereign:
      inherits: admin
      permissions:
        - "som:emergency:level3"
        - "som:constitution:modify"
        - "som:override:all"

  api_authentication:
    method: "JWT"
    issuer: "predator-auth"
    audience: "predator-som"
    token_lifetime: "1 hour"
    refresh_enabled: true

  rate_limits:
    read_endpoints: "100 requests/minute"
    write_endpoints: "20 requests/minute"
    emergency_endpoints: "no limit"
```

---

# 5. МОНІТОРИНГ ТА МЕТРИКИ

```yaml
SOM_Metrics:

  performance:
    - "som_analysis_duration_seconds"
    - "som_anomalies_detected_total"
    - "som_proposals_generated_total"
    - "som_proposals_approved_total"
    - "som_proposals_rejected_total"

  health:
    - "som_state_model_components_count"
    - "som_healthy_components_ratio"
    - "som_pending_approvals_count"
    - "som_emergency_activations_total"

  quality:
    - "som_false_positive_rate"
    - "som_remediation_success_rate"
    - "som_human_override_rate"

  alerts:
    critical:
      - "som_unavailable"
      - "som_red_button_activated"
      - "som_constitution_violation"

    high:
      - "som_pending_approvals > 10"
      - "som_anomaly_rate_high"
      - "som_proposal_rejection_rate > 50%"
```
