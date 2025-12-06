# 🎯 Action Checklist - ТЗ Integration Sprint

## ✅ Today (Day 1)

### 1. Review Created Files
- [ ] Read `INTEGRATION_ROADMAP.md`
- [ ] Read `TZ_INTEGRATION_SUMMARY.md`
- [ ] Review new ML services code:
  - `ua-sources/app/services/ml/reranker_service.py`
  - `ua-sources/app/services/ml/summarizer_service.py`

### 2. Install Dependencies
```bash
# Activate venv if exists
source .venv/bin/activate || python3 -m venv .venv && source .venv/bin/activate

# Install new packages
cd /Users/dima-mac/Documents/Predator_21/ua-sources
pip install -r requirements.txt

# Download SpaCy Ukrainian model
python -m spacy download uk_core_news_sm
```

### 3. Run Database Migration
```bash
# Option A: If PostgreSQL running in Docker
docker exec -i predator_postgres psql -U predator -d predator_db < \
  ../infra/postgres/migrations/005_tz_integration.sql

# Option B: Via pgAdmin or DBeaver
# Manually run SQL from 005_tz_integration.sql
```

### 4. Verify ML Services Work
```bash
cd /Users/dima-mac/Documents/Predator_21/ua-sources
python << 'EOF'
from app.services.ml import get_reranker, get_summarizer

print("Testing Reranker...")
reranker = get_reranker()
docs = [
    {"id": "1", "title": "Machine Learning Guide", "content": "ML tutorial"},
    {"id": "2", "title": "Cooking Recipes", "content": "Food recipes"}
]
results = reranker.rerank("machine learning", docs, top_k=2)
print(f"✅ Reranker OK: {len(results)} results")

print("\nTesting Summarizer...")
summarizer = get_summarizer()
text = "This is a long document that needs to be summarized. " * 20
summary = summarizer.summarize(text, max_length=50)
print(f"✅ Summarizer OK: {summary[:100]}...")
EOF
```

---

## 📅 Week 1 (Days 2-7)

### Day 2: ML Endpoint
- [ ] Create `ua-sources/app/api/v1/ml.py`
  ```python
  from fastapi import APIRouter, Depends
  from app.services.ml import get_reranker, get_summarizer
  
  router = APIRouter(prefix="/ml", tags=["ml"])
  
  @router.post("/rerank")
  async def rerank(query: str, documents: list, reranker=Depends(get_reranker)):
      return reranker.rerank(query, documents)
  
  @router.post("/summarize")  
  async def summarize(text: str, summarizer=Depends(get_summarizer)):
      return {"summary": summarizer.summarize(text)}
  ```

- [ ] Add to `main_v21.py`:
  ```python
  from app.api.v1 import ml
  app.include_router(ml.router, prefix="/api/v1")
  ```

### Day 3-4: Integrate Reranker into Search
- [ ] Modify `app/api/routers/search.py`:
  - Add `rerank: bool = False` parameter
  - If rerank=True, call reranker after OpenSearch+Qdrant
  - Return reranked results

### Day 5: Test End-to-End
- [ ] Upload test document via `/api/v1/etl/upload`
- [ ] Wait for indexing (check Celery logs)
- [ ] Search with `/api/v1/search?q=test&rerank=true`
- [ ] Compare results with/without reranking

### Day 6-7: Documentation
- [ ] Update OpenAPI schema (`/docs`)
- [ ] Write usage examples
- [ ] Create Grafana dashboard for ML latency

---

## 📅 Week 2: Summarization

### Tasks
- [ ] Add summarizer to document endpoint
  ```python
  @router.get("/documents/{id}/summary")
  async def get_summary(id: UUID, summarizer=Depends(get_summarizer)):
      doc = await db.fetch_one("SELECT content FROM gold.documents WHERE id=$1", id)
      summary = summarizer.summarize(doc["content"])
      # Cache in document_summaries table
      return {"summary": summary}
  ```

- [ ] Frontend: Add "View Summary" button in search results
- [ ] Cache summaries in `document_summaries` table

---

## 📅 Week 3: Hybrid Search Fusion

### Tasks
- [ ] Create `app/services/search_fusion.py`
- [ ] Implement RRF (Reciprocal Rank Fusion)
  ```python
  def reciprocal_rank_fusion(results_os, results_qdrant, k=60):
      scores = {}
      for rank, doc in enumerate(results_os):
          scores[doc['id']] = scores.get(doc['id'], 0) + 1/(k + rank)
      for rank, doc in enumerate(results_qdrant):
          scores[doc['id']] = scores.get(doc['id'], 0) + 1/(k + rank)
      return sorted(scores.items(), key=lambda x: x[1], reverse=True)
  ```

- [ ] Update search router to use fusion
- [ ] Benchmark: measure NDCG improvement

---

## 📅 Week 4: Slack Integration

### Tasks
- [ ] Slack OAuth2 setup:
  - Create Slack App at api.slack.com
  - Add OAuth scopes: `chat:write`, `channels:read`
  - Get Client ID/Secret → `.env`

- [ ] Create `app/services/integrations/slack_service.py`
  ```python
  from slack_sdk import WebClient
  
  class SlackService:
      def __init__(self, token: str):
          self.client = WebClient(token=token)
      
      def send_message(self, channel: str, text: str):
          return self.client.chat_postMessage(channel=channel, text=text)
  ```

- [ ] API endpoint `/integrations/slack/notify`
- [ ] Store tokens in `user_tokens` table (encrypted)

---

## 📅 Week 5: Analytics & Dashboards

### Tasks
- [ ] Implement search logging:
  ```python
  async def log_search(user_id, query, results_count, latency):
      await db.execute("""
          INSERT INTO search_logs (user_id, query, results_count, latency_ms)
          VALUES ($1, $2, $3, $4)
      """, user_id, query, results_count, latency)
  ```

- [ ] OpenSearch Dashboards:
  - Import `infra/opensearch/dashboards/search-analytics.ndjson`
  - Visualizations: Top queries, latency distribution, error rate

- [ ] Grafana dashboard for ML services

---

## 📅 Week 6: Testing & Launch Prep

### Tasks
- [ ] Unit tests:
  - `tests/test_ml_services.py`
  - `tests/test_integrations.py`
  - `tests/test_search_fusion.py`

- [ ] Load testing:
  ```bash
  locust -f tests/load/locustfile.py --host=http://localhost:8000
  ```

- [ ] Security audit:
  - [ ] OWASP ZAP scan
  - [ ] Rate limiting test (exceed 100 req/day for free user)
  - [ ] SQL injection attempts

- [ ] Deploy to staging (NVIDIA server):
  ```bash
  cd /Users/dima-mac/Documents/Predator_21
  git add .
  git commit -m "feat: TZ integration - ML services, integrations, analytics"
  git push origin main
  # ArgoCD auto-deploys to nvidia namespace
  ```

---

## 🏁 Definition of Done (MVP)

- [ ] Reranker improves search relevance (NDCG@10 > baseline + 10%)
- [ ] Summarizer generates summaries <100 words in <2s
- [ ] Slack integration sends notifications successfully
- [ ] Search latency P95 < 1s (with reranking)
- [ ] Unit test coverage ≥ 70%
- [ ] All services run in Docker Compose locally
- [ ] Deployed to NVIDIA K8s cluster
- [ ] Grafana dashboards show ML metrics

---

## 📊 Metrics to Track

| Metric | Baseline | Target (Week 6) | How to Measure |
|--------|----------|-----------------|----------------|
| Search Latency P95 | 1200ms | <800ms | Prometheus histogram |
| NDCG@10 | TBD | +10% | Python script with labeled data |
| Summarization Time | N/A | <2s | Log ML service latency |
| ETL Throughput | 3k docs/hr | 10k docs/hr | Celery task counts |
| API Uptime | 98% (local) | 99.5% | Prometheus `up` metric |

---

## 🚨 Risk Mitigation

### Risk: Models too slow on CPU
**Mitigation**: Deploy summarizer only on NVIDIA GPU node, or use smaller model (T5-small instead of BART-large)

### Risk: Dependency conflicts
**Mitigation**: Use separate venv for ML services, or Docker multi-stage build

### Risk: Database migration breaks prod
**Mitigation**: Test migration on staging first, use `CREATE TABLE IF NOT EXISTS`

---

## 📞 Support & Questions

**Stuck?** Check:
1. `TZ_INTEGRATION_SUMMARY.md` - Troubleshooting section
2. Logs: `make logs` or `docker-compose logs -f backend`
3. Existing code: Search for similar patterns in `app/services/`

**Need help with specific ТЗ requirement?**
- Original ТЗ document provided in initial request
- Architecture diagrams in `docs/architecture/`

---

## ✅ Progress Tracker

```
[█░░░░░░░░░] 10% - Dependencies installed
[██░░░░░░░░] 20% - ML services coded
[███░░░░░░░] 30% - Migration run
[████░░░░░░] 40% - ML endpoints
[█████░░░░░] 50% - Search integration
[██████░░░░] 60% - Summarization
[███████░░░] 70% - Slack integration
[████████░░] 80% - Analytics
[█████████░] 90% - Testing
[██████████] 100% - MVP Launch!
```

---

**Current Status**: 🟢 Day 1 - Ready to Start  
**Next Action**: Install dependencies (see checklist above)  
**Target Completion**: 6 weeks (Mid-January 2026)

🚀 **LET'S BUILD!**
