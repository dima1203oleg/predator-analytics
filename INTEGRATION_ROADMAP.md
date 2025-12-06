# 🎯 Інтеграція ТЗ Семантичної Пошукової Платформи - ROADMAP

## Поточний Стан vs ТЗ

### ✅ Що Є (80% готово)
- Backend FastAPI + Celery workers
- PostgreSQL (staging/gold schemas)
- OpenSearch + Qdrant
- ETL Pipeline (Parser→Processor→Indexer)
- React Frontend
- Docker Compose + K8s/Helm

### ❌ Критичні Gap'и

#### ML/AI Components
- [ ] Cross-Encoder Reranker (ms-marco-MiniLM)
- [ ] Summarizer (T5/BART)
- [ ] H2O LLM Studio
- [ ] Data Augmentor (NLPAug)

#### Integrations
- [ ] Slack API (OAuth + export)
- [ ] Notion API (OAuth + export)
- [ ] Google Drive (OAuth + import)

#### Search Enhancements
- [ ] Hybrid Search Fusion (RRF)
- [ ] Query Auto-complete
- [ ] Click tracking

#### Security & Ops
- [ ] Rate Limiting (free/premium tiers)
- [ ] RBAC (user/admin roles)
- [ ] Backup automation
- [ ] GDPR compliance

---

## 🚀 SPRINT PLAN (Week-by-Week)

### Week 1-2: ML Foundation
**Goal**: Reranker + Summarizer operational

```bash
# Day 1-3: Reranker Service
ua-sources/app/services/ml/reranker_service.py
ua-sources/app/api/v1/ml.py (endpoint)

# Day 4-6: Integrate to Search
Modify /api/v1/search?rerank=true

# Day 7-10: Summarizer
services/ml/summarizer_service.py
/documents/{id}/summary endpoint

# Day 11-14: Testing
pytest coverage, benchmarks
```

### Week 3: Hybrid Search
```bash
# RRF Implementation
services/search_fusion.py
Update search router with fusion logic

# Auto-complete
/search/suggest endpoint
OpenSearch completion suggester
```

### Week 4: Integrations (Slack)
```bash
# OAuth Flow
services/integrations/slack_service.py
/integrations/slack/oauth callback
/integrations/slack/notify endpoint

# DB Schema
CREATE TABLE user_tokens (encrypted tokens)
```

### Week 5-6: Analytics + Security
```bash
# Search Logs
search_logs table + OpenSearch index
Click tracking endpoint

# Rate Limiting
Redis-based limiter
Plan enforcement (free=100/day)

# RBAC
Role-based dependencies
Admin endpoints protected
```

---

## 📦 Нові Залежності

### requirements.txt
```txt
# ML
sentence-transformers>=3.0.0  # ✅ є
transformers==4.37.0  # ✅ є
spacy>=3.7.0  # 🆕
uk-core-news-sm  # 🆕 (Ukrainian model)
nlpaug>=1.1.11  # 🆕

# Integrations
slack-sdk>=3.27.0  # 🆕
notion-client>=2.2.0  # 🆕
google-api-python-client>=2.100.0  # 🆕

# Security
argon2-cffi>=23.1.0  # 🆕
```

---

## 🗂️ Нова Структура Файлів

```
ua-sources/app/
├── services/
│   ├── ml/  # 🆕
│   │   ├── reranker_service.py
│   │   ├── summarizer_service.py
│   │   └── data_augmentor.py
│   ├── integrations/  # 🆕
│   │   ├── slack_service.py
│   │   ├── notion_service.py
│   │   └── gdrive_service.py
│   └── search_fusion.py  # 🆕
├── api/v1/
│   ├── ml.py  # 🆕
│   └── integrations.py  # розширити
```

---

## 🎯 Immediate Actions (TODAY)

1. **Install ML Dependencies**
```bash
cd /Users/dima-mac/Documents/Predator_21/ua-sources
echo "spacy>=3.7.0" >> requirements.txt
echo "nlpaug>=1.1.11" >> requirements.txt
pip install -r requirements.txt
```

2. **Create Reranker Scaffold**
```bash
mkdir -p app/services/ml
touch app/services/ml/__init__.py
touch app/services/ml/reranker_service.py
```

3. **Database Migration**
```sql
-- infra/postgres/migrations/005_ml_tables.sql
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id UUID REFERENCES users(id),
    service VARCHAR(50),
    access_token TEXT,
    refresh_token TEXT,
    PRIMARY KEY(user_id, service)
);

CREATE TABLE IF NOT EXISTS search_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID,
    query TEXT,
    filters JSONB,
    results_count INT,
    latency_ms INT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 📊 Success Criteria (MVP)

- [ ] Search latency P95 < 1s (with reranker)
- [ ] Reranker improves NDCG@10 by ≥10%
- [ ] Summarizer generates <100 word summaries
- [ ] Rate limiter blocks after 100 req/day (free)
- [ ] Slack export works end-to-end

---

## 📞 Next Steps

**Start NOW**: Week 1 Sprint
**Review**: Weekly sync every Friday
**Launch**: MVP in 6 weeks

---

*Created: 2025-12-06*  
*Status: READY TO START* 🚀
