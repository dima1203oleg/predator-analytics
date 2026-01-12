# 📝 Changelog — Predator Analytics

Усі значущі зміни проєкту документуються тут.

Формат базується на [Keep a Changelog](https://keepachangelog.com/uk/1.1.0/),
та проєкт дотримується [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [25.0.0] — 2026-01-10

### ✨ Added

#### Core Features
- **Dimensional UI** — адаптивний інтерфейс з 4 Shells (Explorer, Operator, Commander, Architect)
- **Self-Healing Architecture** — 4-рівнева система автовідновлення
- **AI Orchestrator (SuperIntelligence)** — цикл Diagnose → Train → Promote
- **Hybrid Search** — OpenSearch (BM25) + Qdrant (SPLADE) з RRF fusion
- **LLM Router** — Groq → Gemini → Ollama fallback chain

#### Security
- **Post-Quantum Cryptography** — Kyber768 + Dilithium3 hybrid
- **Zero Trust Architecture** — mTLS між сервісами
- **Advanced RBAC** — 4 рівні доступу з data masking

#### Infrastructure
- **GitOps via ArgoCD** — автоматичний CD з rollback
- **Chaos Engineering** — LitmusChaos та Chaos Mesh інтеграція
- **Temporal.io** — durable workflows для критичних операцій

#### Data
- **Data Hub** — централізоване управління Sources/Datasets
- **Upload Wizard** — drag-and-drop з SSE прогресом
- **ETL via Kafka** — real-time data pipelines

#### Mobile
- **Tactical Mobile View** — PWA для польових операторів
- **Voice Input** — Web Speech API (uk-UA)
- **Offline Mode** — NetworkFirst caching

### 🔄 Changed

- **Frontend Stack** — міграція на Next.js 14 App Router
- **State Management** — Redux → Zustand
- **API Client** — Axios → TanStack Query
- **Styling** — CSS Modules → TailwindCSS
- **Auth** — Session-based → JWT + Refresh tokens

### 🗑️ Deprecated

- Legacy Dashboard (замінено на Dimensional UI)
- Python 3.10 support (мінімум 3.12)
- Redis Cluster mode (використовуємо Sentinel)

### 🐛 Fixed

- Memory leak в WebSocket handler
- Race condition в ETL worker
- SSL certificate rotation без downtime
- Timezone issues в scheduled jobs

### 🔒 Security

- CVE-2025-XXXX — SQL injection в search endpoint (fixed)
- Upgraded all dependencies to latest secure versions
- Enabled HSTS preload
- Added CSP headers

---

## [24.5.0] — 2025-10-15

### ✨ Added

- Multi-tenant support
- Custom dashboards builder
- Slack/Teams integration
- API rate limiting

### 🔄 Changed

- Database migration to PostgreSQL 16
- Improved search performance by 40%

### 🐛 Fixed

- Authentication timeout issues
- Export functionality for large datasets

---

## [24.0.0] — 2025-07-01

### ✨ Added

- Initial production release
- Core threat intelligence platform
- Basic search functionality
- User management
- REST API v1

---

## Version History

| Version | Date | Type | Notes |
|---------|------|------|-------|
| 25.0.0 | 2026-01-10 | Major | Dimensional UI, Self-Healing, PQC |
| 24.5.0 | 2025-10-15 | Minor | Multi-tenant, integrations |
| 24.0.0 | 2025-07-01 | Major | Initial release |

---

## Upgrade Guide

### From 24.x to 25.0

```bash
# 1. Backup database
make db-backup

# 2. Update dependencies
pip install -r requirements.txt --upgrade
npm install

# 3. Run migrations
make migrate

# 4. Restart services
make restart

# 5. Verify
make health-check
```

⚠️ **Breaking Changes:**
- API v1 endpoints moved to /api/v2
- JWT token format changed (re-auth required)
- Redis data structure updated (flush cache)

---

*© 2026 Predator Analytics. Усі права захищено.*
