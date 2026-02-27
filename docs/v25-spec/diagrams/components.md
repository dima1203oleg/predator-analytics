# 🧩 Компоненти Системи — Predator Analytics v45.0

## Огляд Сервісів

| Компонент | Порт | Технологія | Призначення |
|-----------|------|------------|-------------|
| **predator-ui** | 80 | React + Vite | Dimensional UI |
| **api-gateway** | 8000 | FastAPI | REST API |
| **orchestrator** | 8001 | Python | Agent Orchestration |
| **celery-worker** | - | Celery | Background Jobs |
| **temporal** | 7233 | Temporal | Durable Workflows |
| **postgres** | 5432 | TimescaleDB | Main Database |
| **redis** | 6379 | Redis 7 | Cache/Broker |
| **qdrant** | 6333 | Qdrant | Vector Search |
| **opensearch** | 9200 | OpenSearch | Full-text |
| **kafka** | 9092 | Kafka | Event Streaming |
| **minio** | 9000 | MinIO | Object Storage |
| **prometheus** | 9090 | Prometheus | Metrics |
| **grafana** | 3000 | Grafana | Dashboards |
| **argocd** | 8080 | ArgoCD | GitOps |

## Dimensional UI Shells

```
┌─────────────────────────────────────────────────────────────────┐
│                      DIMENSIONAL UI                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │  EXPLORER   │  │  OPERATOR   │  │  COMMANDER  │  │ARCHITECT││
│  │    Shell    │  │    Shell    │  │    Shell    │  │  Shell  ││
│  ├─────────────┤  ├─────────────┤  ├─────────────┤  ├─────────┤│
│  │ • Search    │  │ • Agents    │  │ • Strategy  │  │ • Config││
│  │ • Analyze   │  │ • Missions  │  │ • KPIs      │  │ • Infra ││
│  │ • Data Hub  │  │ • Monitor   │  │ • Reports   │  │ • Logs  ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
│                                                                  │
│  Audience:        Audience:        Audience:        Audience:   │
│  Analysts         SOC Operators    CISO/Managers    DevOps      │
│                                                                  │
│  Mobile: ✅        Mobile: ⚠️       Mobile: ⚠️       Mobile: ❌  │
└─────────────────────────────────────────────────────────────────┘
```

## Security Components

```
┌─────────────────────────────────────────────────────────────────┐
│                   SECURITY LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              QUANTUM-RESISTANT CRYPTO                    │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │    │
│  │  │  Kyber    │  │ Dilithium │  │  Hybrid TLS 1.3   │   │    │
│  │  │  (KEM)    │  │  (Sign)   │  │  (Classic + PQC)  │   │    │
│  │  └───────────┘  └───────────┘  └───────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              ACCESS CONTROL                              │    │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐   │    │
│  │  │  JWT RS256│  │   RBAC    │  │  API Rate Limit   │   │    │
│  │  │  Tokens   │  │  Policies │  │  (Redis)          │   │    │
│  │  └───────────┘  └───────────┘  └───────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

*© 2026 Predator Analytics*
