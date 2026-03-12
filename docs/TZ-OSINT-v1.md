# PREDATOR Analytics — Технічне Завдання OSINT Integration v1.0

> **Версія**: 1.0  
> **Дата**: 2026-03-11  
> **Автор**: PREDATOR Engineering Team  
> **Статус**: DRAFT → REVIEW

---

## 📋 Зміст

1. [Вступ та Мета](#1-вступ-та-мета)
2. [Архітектура OSINT Layer](#2-архітектура-osint-layer)
3. [Пріоритетні Інструменти](#3-пріоритетні-інструменти)
4. [Фази Реалізації](#4-фази-реалізації)
5. [API Специфікація](#5-api-специфікація)
6. [Data Models](#6-data-models)
7. [Інтеграція з Існуючими Сервісами](#7-інтеграція-з-існуючими-сервісами)
8. [Безпека та Compliance](#8-безпека-та-compliance)
9. [Моніторинг та Observability](#9-моніторинг-та-observability)
10. [Deployment](#10-deployment)

---

## 1. Вступ та Мета

### 1.1 Бізнес-контекст

PREDATOR Analytics розширюється до повноцінної OSINT-платформи рівня Palantir/ShadowDragon, інтегруючи найкращі open-source інструменти розвідки з власним AI-ядром.

### 1.2 Цілі

| ID | Ціль | Метрика успіху |
|----|------|----------------|
| G-01 | Автоматизований збір OSINT даних | >50 джерел, <5 хв на entity |
| G-02 | Єдиний граф зв'язків | Neo4j з >1M nodes |
| G-03 | Real-time моніторинг | Latency <30s для alerts |
| G-04 | AI-збагачення | Confidence >0.85 для entity resolution |
| G-05 | Compliance UA | Відповідність законодавству України |

### 1.3 Scope

**В Scope:**
- Інтеграція 25+ OSINT інструментів
- Unified Entity Graph
- AI-агенти для автоматичного розслідування
- Real-time alerting
- Митна/корпоративна розвідка

**Out of Scope:**
- Dark Web crawling (Phase 3+)
- Offensive security tools
- Прямий доступ до закритих баз

---

## 2. Архітектура OSINT Layer

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PREDATOR OSINT LAYER                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │   DOMAIN    │  │   PERSON    │  │   COMPANY   │  │   GEOINT    ││
│  │  RECON      │  │   SEARCH    │  │   INTEL     │  │   LAYER     ││
│  │             │  │             │  │             │  │             ││
│  │ • Amass     │  │ • Sherlock  │  │ • OpenCorp  │  │ • ExifTool  ││
│  │ • Subfinder │  │ • Maigret   │  │ • FOCA      │  │ • GeoSpy    ││
│  │ • Photon    │  │ • GHunt     │  │ • SpiderFoot│  │ • Creepy    ││
│  │ • Harvester │  │ • SocialAn  │  │ • Datasploit│  │             ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│
│         │                │                │                │       │
│         └────────────────┴────────────────┴────────────────┘       │
│                                   │                                 │
│                    ┌──────────────▼──────────────┐                 │
│                    │     OSINT ORCHESTRATOR      │                 │
│                    │                             │                 │
│                    │  • Task Queue (Celery)      │                 │
│                    │  • Rate Limiting            │                 │
│                    │  • Result Aggregation       │                 │
│                    │  • Deduplication            │                 │
│                    └──────────────┬──────────────┘                 │
│                                   │                                 │
├───────────────────────────────────┼─────────────────────────────────┤
│                    ┌──────────────▼──────────────┐                 │
│                    │      DATA FUSION LAYER      │                 │
│                    │                             │                 │
│                    │  • Entity Resolution        │                 │
│                    │  • Link Analysis            │                 │
│                    │  • Confidence Scoring       │                 │
│                    │  • UEID Generation          │                 │
│                    └──────────────┬──────────────┘                 │
│                                   │                                 │
├───────────────────────────────────┼─────────────────────────────────┤
│                    ┌──────────────▼──────────────┐                 │
│                    │      STORAGE LAYER          │                 │
│                    │                             │                 │
│                    │  PostgreSQL │ Neo4j │ Qdrant│                 │
│                    │  OpenSearch │ MinIO │ Redis │                 │
│                    └─────────────────────────────┘                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Компоненти

| Компонент | Технологія | Призначення |
|-----------|------------|-------------|
| OSINT Orchestrator | Python + Celery | Координація OSINT задач |
| Tool Adapters | Python wrappers | Уніфікований інтерфейс до інструментів |
| Data Fusion | Python + ML | Entity resolution, deduplication |
| Graph Engine | Neo4j + GDS | Link analysis, pathfinding |
| Vector Store | Qdrant | Semantic search, embeddings |
| Event Bus | Kafka | Real-time streaming |
| Cache | Redis | Rate limiting, caching |

---

## 3. Пріоритетні Інструменти

### 3.1 Phase 1 — Core OSINT (MVP)

| # | Інструмент | Категорія | Пріоритет | Складність |
|---|------------|-----------|-----------|------------|
| 1 | **SpiderFoot** | All-in-one | P0 | Medium |
| 2 | **Amass** | Domain Recon | P0 | Low |
| 3 | **Sherlock** | Person Search | P0 | Low |
| 4 | **theHarvester** | Email/Domain | P0 | Low |
| 5 | **ExifTool** | Metadata | P0 | Low |
| 6 | **Photon** | Web Crawler | P1 | Low |
| 7 | **Maigret** | Username Search | P1 | Low |
| 8 | **Subfinder** | Subdomain | P1 | Low |

### 3.2 Phase 2 — Advanced OSINT

| # | Інструмент | Категорія | Пріоритет |
|---|------------|-----------|-----------|
| 9 | **Recon-ng** | Framework | P1 |
| 10 | **Osmedeus** | Automation | P1 |
| 11 | **GHunt** | Google OSINT | P1 |
| 12 | **Social Analyzer** | SOCMINT | P1 |
| 13 | **FOCA** | Document Meta | P2 |
| 14 | **Aquatone** | Screenshots | P2 |
| 15 | **Datasploit** | Multi-source | P2 |

### 3.3 Phase 3 — Specialized

| # | Інструмент | Категорія | Пріоритет |
|---|------------|-----------|-----------|
| 16 | **Twint** | Twitter OSINT | P2 |
| 17 | **Instaloader** | Instagram | P2 |
| 18 | **TikTok Scraper** | TikTok | P3 |
| 19 | **Creepy** | Geolocation | P2 |
| 20 | **LinkScope** | Visualization | P2 |

### 3.4 Спеціалізовані для Митниці/Фінансів

| # | Інструмент | Призначення | Джерело |
|---|------------|-------------|---------|
| 21 | **OpenCorporates API** | Company registry | API |
| 22 | **ICIJ Offshore Leaks** | Offshore entities | Dataset |
| 23 | **OpenSanctions** | Sanctions lists | API |
| 24 | **Clearbit** | Company enrichment | API |
| 25 | **FullContact** | Person enrichment | API |
| 26 | **Hunter.io** | Email finder | API |
| 27 | **MarineTraffic** | Ship tracking | API |
| 28 | **FlightAware** | Aircraft tracking | API |
| 29 | **ImportGenius** | Trade data | Dataset |
| 30 | **Panjiva** | Supply chain | API |

---

## 4. Фази Реалізації

### 4.1 Phase 1: Foundation (4 тижні)

```
Week 1-2: Infrastructure
├── OSINT Service skeleton
├── Celery task queue
├── Tool adapter interface
├── SpiderFoot integration
└── Basic API endpoints

Week 3-4: Core Tools
├── Amass integration
├── Sherlock integration
├── theHarvester integration
├── ExifTool integration
└── Data fusion pipeline
```

**Deliverables:**
- `services/osint-service/` — новий мікросервіс
- 5 інтегрованих інструментів
- REST API для OSINT запитів
- Kafka events для результатів

### 4.2 Phase 2: Enrichment (4 тижні)

```
Week 5-6: Advanced Tools
├── Recon-ng integration
├── Maigret integration
├── GHunt integration
└── Social Analyzer integration

Week 7-8: AI Enhancement
├── Entity Resolution ML model
├── Link prediction
├── Anomaly detection
└── Confidence scoring
```

**Deliverables:**
- 10+ інтегрованих інструментів
- ML-based entity resolution
- Neo4j graph enrichment
- Real-time alerts

### 4.3 Phase 3: Specialization (4 тижні)

```
Week 9-10: Domain-Specific
├── Customs/Trade tools
├── Financial tools
├── Maritime/Aviation
└── Sanctions screening

Week 11-12: Automation
├── AI Investigation agents
├── Auto-report generation
├── Scheduled monitoring
└── Alert workflows
```

**Deliverables:**
- 25+ інтегрованих інструментів
- AI агенти для розслідувань
- Automated reporting
- Full monitoring dashboard

---

## 5. API Специфікація

### 5.1 OSINT Endpoints

```yaml
# Base URL: /api/v1/osint

# ─── Domain Reconnaissance ───────────────────────────────
POST /osint/domain/scan:
  description: Повне сканування домену
  request:
    domain: string (required)
    depth: integer (1-3, default: 2)
    tools: array[string] (optional, default: all)
  response:
    scan_id: uuid
    status: "queued" | "running" | "completed" | "failed"
    estimated_time_seconds: integer

GET /osint/domain/{scan_id}:
  description: Результати сканування домену
  response:
    subdomains: array[Subdomain]
    dns_records: array[DNSRecord]
    emails: array[Email]
    technologies: array[Technology]
    certificates: array[Certificate]

# ─── Person Search ───────────────────────────────────────
POST /osint/person/search:
  description: Пошук особи за ідентифікаторами
  request:
    username: string (optional)
    email: string (optional)
    phone: string (optional)
    full_name: string (optional)
  response:
    search_id: uuid
    status: string

GET /osint/person/{search_id}:
  description: Результати пошуку особи
  response:
    profiles: array[SocialProfile]
    emails: array[Email]
    phones: array[Phone]
    locations: array[Location]
    connections: array[Connection]

# ─── Company Intelligence ────────────────────────────────
POST /osint/company/investigate:
  description: Розслідування компанії
  request:
    company_name: string (optional)
    edrpou: string (optional)
    domain: string (optional)
  response:
    investigation_id: uuid

GET /osint/company/{investigation_id}:
  description: Результати розслідування
  response:
    company: CompanyProfile
    officers: array[Person]
    shareholders: array[Shareholder]
    related_companies: array[Company]
    sanctions: array[Sanction]
    risk_indicators: array[RiskIndicator]

# ─── File Analysis ───────────────────────────────────────
POST /osint/file/analyze:
  description: Аналіз метаданих файлу
  request:
    file: binary (multipart)
  response:
    analysis_id: uuid
    metadata: FileMetadata
    hidden_data: array[HiddenData]
    geolocation: GeoLocation (optional)

# ─── Graph Queries ───────────────────────────────────────
POST /osint/graph/expand:
  description: Розширення графу від entity
  request:
    entity_ueid: string
    depth: integer (1-5)
    relationship_types: array[string]
  response:
    nodes: array[GraphNode]
    edges: array[GraphEdge]
    clusters: array[Cluster]

POST /osint/graph/path:
  description: Пошук шляху між entities
  request:
    source_ueid: string
    target_ueid: string
    max_hops: integer (default: 6)
  response:
    paths: array[Path]
    shortest_path: Path

# ─── Monitoring ──────────────────────────────────────────
POST /osint/monitor/create:
  description: Створення моніторингу entity
  request:
    entity_ueid: string
    triggers: array[Trigger]
    schedule: CronExpression
  response:
    monitor_id: uuid

GET /osint/monitor/{monitor_id}/alerts:
  description: Алерти моніторингу
  response:
    alerts: array[Alert]
```

### 5.2 WebSocket Events

```yaml
# WS: /ws/osint/stream

# Events from server:
osint.scan.started:
  scan_id: uuid
  tool: string
  target: string

osint.scan.progress:
  scan_id: uuid
  progress_pct: float
  current_tool: string
  findings_count: integer

osint.scan.completed:
  scan_id: uuid
  duration_seconds: float
  findings_count: integer

osint.alert.triggered:
  alert_id: uuid
  entity_ueid: string
  trigger_type: string
  severity: "low" | "medium" | "high" | "critical"
  details: object
```

---

## 6. Data Models

### 6.1 PostgreSQL Schema

```sql
-- OSINT Scans
CREATE TABLE osint_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    scan_type VARCHAR(50) NOT NULL, -- domain, person, company, file
    target JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    tools_used TEXT[] DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- OSINT Findings
CREATE TABLE osint_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES osint_scans(id),
    finding_type VARCHAR(50) NOT NULL,
    source_tool VARCHAR(50) NOT NULL,
    confidence FLOAT NOT NULL DEFAULT 0.5,
    data JSONB NOT NULL,
    entity_ueid VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Entity Monitors
CREATE TABLE osint_monitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    entity_ueid VARCHAR(64) NOT NULL,
    monitor_config JSONB NOT NULL,
    schedule VARCHAR(100), -- cron expression
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitor Alerts
CREATE TABLE osint_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monitor_id UUID NOT NULL REFERENCES osint_monitors(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    details JSONB NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_osint_scans_tenant ON osint_scans(tenant_id, created_at DESC);
CREATE INDEX idx_osint_findings_scan ON osint_findings(scan_id);
CREATE INDEX idx_osint_findings_entity ON osint_findings(entity_ueid);
CREATE INDEX idx_osint_monitors_entity ON osint_monitors(entity_ueid);
CREATE INDEX idx_osint_alerts_monitor ON osint_alerts(monitor_id, created_at DESC);

-- RLS
ALTER TABLE osint_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE osint_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE osint_monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE osint_alerts ENABLE ROW LEVEL SECURITY;
```

### 6.2 Neo4j Schema

```cypher
// Node Labels
(:Entity {
    ueid: String,
    type: String,  // person, company, domain, email, phone, ip, location
    name: String,
    properties: Map,
    confidence: Float,
    sources: List<String>,
    created_at: DateTime,
    updated_at: DateTime
})

(:OSINTSource {
    name: String,
    tool: String,
    scan_id: String,
    timestamp: DateTime
})

// Relationship Types
[:OWNS]           // company -> company, person -> company
[:WORKS_AT]       // person -> company
[:CONNECTED_TO]   // person -> person
[:USES_DOMAIN]    // company -> domain
[:HAS_EMAIL]      // person/company -> email
[:LOCATED_AT]     // entity -> location
[:FOUND_BY]       // entity -> OSINTSource
[:RELATED_TO]     // generic relationship

// Indexes
CREATE INDEX entity_ueid FOR (e:Entity) ON (e.ueid);
CREATE INDEX entity_type FOR (e:Entity) ON (e.type);
CREATE FULLTEXT INDEX entity_name FOR (e:Entity) ON EACH [e.name];
```

### 6.3 Pydantic Models

```python
# libs/predator-common/predator_common/osint_models.py

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from uuid import UUID

class ScanType(str, Enum):
    DOMAIN = "domain"
    PERSON = "person"
    COMPANY = "company"
    FILE = "file"
    CUSTOM = "custom"

class ScanStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class OSINTScanRequest(BaseModel):
    scan_type: ScanType
    target: Dict[str, Any]
    tools: Optional[List[str]] = None
    depth: int = Field(default=2, ge=1, le=5)
    options: Optional[Dict[str, Any]] = None

class OSINTScanResponse(BaseModel):
    scan_id: UUID
    status: ScanStatus
    estimated_time_seconds: Optional[int] = None
    progress_url: str

class OSINTFinding(BaseModel):
    id: UUID
    finding_type: str
    source_tool: str
    confidence: float = Field(ge=0.0, le=1.0)
    data: Dict[str, Any]
    entity_ueid: Optional[str] = None
    created_at: datetime

class DomainScanResult(BaseModel):
    scan_id: UUID
    domain: str
    subdomains: List[Dict[str, Any]] = []
    dns_records: List[Dict[str, Any]] = []
    emails: List[str] = []
    technologies: List[str] = []
    certificates: List[Dict[str, Any]] = []
    whois: Optional[Dict[str, Any]] = None

class PersonSearchResult(BaseModel):
    search_id: UUID
    query: Dict[str, str]
    profiles: List[Dict[str, Any]] = []
    emails: List[str] = []
    phones: List[str] = []
    locations: List[Dict[str, Any]] = []
    images: List[str] = []

class CompanyInvestigationResult(BaseModel):
    investigation_id: UUID
    company: Dict[str, Any]
    officers: List[Dict[str, Any]] = []
    shareholders: List[Dict[str, Any]] = []
    related_companies: List[Dict[str, Any]] = []
    sanctions: List[Dict[str, Any]] = []
    risk_indicators: List[Dict[str, Any]] = []
    documents: List[Dict[str, Any]] = []

class GraphNode(BaseModel):
    ueid: str
    type: str
    name: str
    properties: Dict[str, Any] = {}
    confidence: float = 1.0

class GraphEdge(BaseModel):
    source_ueid: str
    target_ueid: str
    relationship: str
    properties: Dict[str, Any] = {}
    confidence: float = 1.0

class OSINTAlert(BaseModel):
    id: UUID
    monitor_id: UUID
    alert_type: str
    severity: Severity
    title: str
    details: Dict[str, Any]
    entity_ueid: str
    is_read: bool = False
    created_at: datetime
```

---

## 7. Інтеграція з Існуючими Сервісами

### 7.1 Архітектура Інтеграції

```
┌─────────────────────────────────────────────────────────────────┐
│                     PREDATOR ANALYTICS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │  core-api   │────▶│osint-service│────▶│graph-service│       │
│  │  (FastAPI)  │     │  (FastAPI)  │     │  (FastAPI)  │       │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘       │
│         │                   │                   │               │
│         │            ┌──────▼──────┐            │               │
│         │            │   Celery    │            │               │
│         │            │   Workers   │            │               │
│         │            └──────┬──────┘            │               │
│         │                   │                   │               │
│  ┌──────▼───────────────────▼───────────────────▼──────┐       │
│  │                    Kafka                             │       │
│  │  predator.osint.scan.* │ predator.osint.finding.*   │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ PostgreSQL  │  │   Neo4j     │  │   Qdrant    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Kafka Topics

```yaml
# OSINT Events
predator.osint.scan.requested:
  description: Новий OSINT запит
  schema: OSINTScanRequest

predator.osint.scan.started:
  description: Сканування розпочато
  schema: { scan_id, tool, target }

predator.osint.scan.progress:
  description: Прогрес сканування
  schema: { scan_id, progress_pct, findings_count }

predator.osint.scan.completed:
  description: Сканування завершено
  schema: { scan_id, status, findings_count }

predator.osint.finding.new:
  description: Нова знахідка
  schema: OSINTFinding

predator.osint.entity.discovered:
  description: Виявлено нову entity
  schema: GraphNode

predator.osint.alert.triggered:
  description: Спрацював алерт
  schema: OSINTAlert
```

### 7.3 Інтеграція з Core API

```python
# services/core-api/app/routers/osint.py

from fastapi import APIRouter, Depends, BackgroundTasks
from app.dependencies import get_current_active_user, get_tenant_id
from app.services.kafka_service import get_kafka_service

router = APIRouter(prefix="/osint", tags=["OSINT"])

@router.post("/domain/scan")
async def scan_domain(
    request: DomainScanRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_current_active_user),
    tenant_id: str = Depends(get_tenant_id),
):
    """Запуск сканування домену."""
    kafka = get_kafka_service()
    
    scan_id = str(uuid.uuid4())
    
    # Відправляємо в Kafka для обробки osint-service
    await kafka.send_osint_scan_requested(
        scan_id=scan_id,
        scan_type="domain",
        target={"domain": request.domain},
        tools=request.tools,
        tenant_id=tenant_id,
        user_id=user["sub"],
    )
    
    return {
        "scan_id": scan_id,
        "status": "queued",
        "progress_url": f"/api/v1/osint/domain/{scan_id}",
    }
```

### 7.4 Інтеграція з Graph Service

```python
# services/graph-service/app/osint_integration.py

async def ingest_osint_finding(finding: OSINTFinding):
    """Інтеграція OSINT знахідки в граф."""
    
    # 1. Entity Resolution
    existing_entity = await resolve_entity(finding)
    
    if existing_entity:
        # Merge з існуючою entity
        await merge_entity_data(existing_entity, finding)
    else:
        # Створюємо нову entity
        entity = await create_entity_from_finding(finding)
    
    # 2. Створюємо зв'язки
    await create_relationships(entity, finding)
    
    # 3. Оновлюємо confidence scores
    await recalculate_confidence(entity)
    
    # 4. Перевіряємо тригери алертів
    await check_alert_triggers(entity)
```

---

## 8. Безпека та Compliance

### 8.1 Security Requirements

| ID | Вимога | Реалізація |
|----|--------|------------|
| SEC-01 | Шифрування at-rest | AES-256 для sensitive data |
| SEC-02 | Шифрування in-transit | TLS 1.3 |
| SEC-03 | API Authentication | JWT + API Keys |
| SEC-04 | Rate Limiting | Redis-based, per-tenant |
| SEC-05 | Audit Logging | Всі OSINT операції |
| SEC-06 | Data Retention | Configurable per tenant |
| SEC-07 | PII Masking | Автоматичне маскування |

### 8.2 Compliance

| Стандарт | Вимоги | Статус |
|----------|--------|--------|
| GDPR | Right to erasure, consent | Planned |
| UA Privacy Law | Персональні дані | Planned |
| SOC 2 | Security controls | Planned |

### 8.3 Ethical Guidelines

```yaml
# Заборонені операції:
- Збір даних без законних підстав
- Доступ до закритих систем
- Harassment або stalking
- Збір даних про неповнолітніх
- Порушення Terms of Service джерел

# Обов'язкові практики:
- Документування підстав для розслідування
- Audit trail всіх операцій
- Дотримання rate limits джерел
- Повідомлення про виявлені вразливості
```

---

## 9. Моніторинг та Observability

### 9.1 Prometheus Metrics

```python
# OSINT-specific metrics
osint_scans_total = Counter(
    "osint_scans_total",
    "Total OSINT scans",
    ["scan_type", "status", "tenant_id"]
)

osint_scan_duration_seconds = Histogram(
    "osint_scan_duration_seconds",
    "OSINT scan duration",
    ["scan_type", "tool"]
)

osint_findings_total = Counter(
    "osint_findings_total",
    "Total OSINT findings",
    ["finding_type", "source_tool"]
)

osint_tool_errors_total = Counter(
    "osint_tool_errors_total",
    "OSINT tool errors",
    ["tool", "error_type"]
)

osint_api_rate_limit_hits = Counter(
    "osint_api_rate_limit_hits",
    "External API rate limit hits",
    ["api_name"]
)
```

### 9.2 Grafana Dashboards

```yaml
OSINT Operations Dashboard:
  - Scans per hour (by type)
  - Average scan duration
  - Findings per scan
  - Tool success rate
  - API rate limit status
  - Queue depth
  - Active monitors
  - Alerts triggered

OSINT Data Quality Dashboard:
  - Entity resolution accuracy
  - Duplicate detection rate
  - Confidence score distribution
  - Source coverage
  - Data freshness
```

---

## 10. Deployment

### 10.1 Docker Compose (Development)

```yaml
# deploy/docker-compose.osint.yml

services:
  osint-service:
    build:
      context: ./services/osint-service
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql+asyncpg://predator:predator@postgres:5432/predator
      - REDIS_URL=redis://redis:6379/2
      - KAFKA_BOOTSTRAP_SERVERS=redpanda:9092
      - NEO4J_URI=bolt://neo4j:7687
      - CELERY_BROKER_URL=redis://redis:6379/3
    depends_on:
      - postgres
      - redis
      - redpanda
      - neo4j
    ports:
      - "8002:8000"
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2"

  osint-worker:
    build:
      context: ./services/osint-service
      dockerfile: Dockerfile
    command: celery -A app.celery_app worker -l info -Q osint
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/3
      - DATABASE_URL=postgresql+asyncpg://predator:predator@postgres:5432/predator
    depends_on:
      - redis
      - postgres
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 4G
          cpus: "2"

  # OSINT Tools (containerized)
  spiderfoot:
    image: spiderfoot/spiderfoot:latest
    ports:
      - "5001:5001"
    volumes:
      - spiderfoot_data:/var/lib/spiderfoot

volumes:
  spiderfoot_data:
```

### 10.2 Kubernetes (Production)

```yaml
# deploy/helm/predator/templates/osint-service.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: osint-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: osint-service
  template:
    spec:
      containers:
        - name: osint-service
          image: ghcr.io/predator/osint-service:v55.2
          resources:
            requests:
              memory: "1Gi"
              cpu: "500m"
            limits:
              memory: "2Gi"
              cpu: "2000m"
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: predator-secrets
                  key: database-url
```

---

## 📎 Додатки

### A. Список OSINT API Keys

| API | Безкоштовний ліміт | Платний план |
|-----|-------------------|--------------|
| Hunter.io | 25 req/month | $49/month |
| Clearbit | 50 req/month | Custom |
| FullContact | 100 req/month | $99/month |
| OpenCorporates | 500 req/month | £79/month |
| Shodan | 100 req/month | $59/month |
| VirusTotal | 500 req/day | $10k/year |
| Have I Been Pwned | 10 req/min | $3.50/month |

### B. Приклад Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant API as Core API
    participant K as Kafka
    participant OS as OSINT Service
    participant W as Celery Worker
    participant DB as PostgreSQL
    participant G as Neo4j

    U->>API: POST /osint/company/investigate
    API->>K: osint.scan.requested
    API-->>U: { scan_id, status: "queued" }
    
    K->>OS: Consume message
    OS->>W: Create Celery task
    W->>W: Run SpiderFoot
    W->>W: Run Amass
    W->>W: Run theHarvester
    
    W->>DB: Save findings
    W->>K: osint.finding.new (multiple)
    W->>G: Create/update entities
    
    K->>API: osint.scan.completed
    U->>API: GET /osint/company/{scan_id}
    API->>DB: Fetch results
    API-->>U: CompanyInvestigationResult
```

---

## ✅ Acceptance Criteria

### Phase 1 MVP

- [ ] OSINT Service запускається та відповідає на health check
- [ ] SpiderFoot інтегровано та працює
- [ ] Amass інтегровано та працює
- [ ] Sherlock інтегровано та працює
- [ ] theHarvester інтегровано та працює
- [ ] ExifTool інтегровано та працює
- [ ] API endpoints працюють згідно специфікації
- [ ] Результати зберігаються в PostgreSQL
- [ ] Entities створюються в Neo4j
- [ ] Kafka events відправляються
- [ ] Prometheus metrics експортуються
- [ ] Unit tests coverage >80%
- [ ] E2E tests для основних flows

---

**Документ підготовлено**: PREDATOR Engineering Team  
**Дата**: 2026-03-11  
**Версія**: 1.0
