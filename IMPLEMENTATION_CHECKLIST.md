# ✅ Implementation Checklist - Predator Analytics v25

## 🎯 Quick Reference

**Current Status:** 94% Ready
**Target:** 100% Production Ready
**Timeline:** 2-3 weeks

---

## Phase 1: Immediate Actions (1-2 days) 🔴

### Database Optimization
- [ ] **Run DB migration script**
  ```bash
  ./scripts/apply_db_indexes.sh
  ```
  - Expected: 20+ indexes created
  - Impact: 10-20x faster queries
  - Time: 10-15 minutes

- [ ] **Verify performance improvement**
  ```bash
  docker exec postgres psql -U predator -d predator_db
  \timing on
  SELECT * FROM documents WHERE source_type = 'customs' ORDER BY created_at DESC LIMIT 100;
  ```
  - Expected: <50ms (was 500ms)

### Testing
- [ ] **Install E2E test dependencies**
  ```bash
  cd tests/e2e
  npm install cypress @types/cypress
  ```

- [ ] **Run E2E tests**
  ```bash
  npx cypress run
  ```
  - 3 test suites
  - ~15-20 tests total
  - Expected: All pass

### Caching
- [ ] **Install Redis caching dependencies**
  ```bash
  pip install redis structlog python-json-logger
  ```

- [ ] **Test caching service**
  ```bash
  python libs/core/cache.py
  ```
  - Verify Redis connection
  - Check compression works

### Monitoring
- [ ] **Deploy Alertmanager**
  ```bash
  docker-compose up -d alertmanager
  ```

- [ ] **Configure Prometheus alerts**
  - Edit `infra/prometheus/prometheus.yml`
  - Add alertmanager endpoint
  - Reload Prometheus

---

## Phase 2: Core Integrations (Week 1) 🟡

### Structured Logging Migration
- [ ] **services/api-gateway/app/main.py**
  - Replace `logging` with structured_logger
  - Add correlation IDs
  - Test: ~100 LOC changes

- [ ] **services/orchestrator/council/mission_planner.py**
  - Migrate to structured logging
  - Add performance metrics
  - Test: ~50 LOC changes

- [ ] **services/api-gateway/app/tasks/etl_workers.py**
  - Use RequestLogger
  - Add business events
  - Test: ~70 LOC changes

- [ ] **services/api-gateway/app/tasks/ml_workers.py**
  - Structured logging
  - ML-specific metrics
  - Test: ~60 LOC changes

- [ ] **Verify JSON output**
  ```bash
  docker logs backend | tail -100 | grep "message"
  # Should see JSON structured logs
  ```

### Data Contracts Integration
- [ ] **ETL tasks** - Use `ETLTaskPayload`
  ```python
  from libs.core.contracts.payloads import ETLTaskPayload, validate_payload
  payload = validate_payload(ETLTaskPayload, task_kwargs)
  ```

- [ ] **ML tasks** - Use `MLTrainingPayload`
- [ ] **Indexing tasks** - Use `IndexingTaskPayload`
- [ ] **Redis events** - Use `RedisEvent`

### Caching Integration
- [ ] **Search API** - Already integrated ✅
- [ ] **Document service** - Add caching
  ```python
  from libs.core.cache import get_cache
  cache = get_cache()

  @cache.cached(ttl=600)
  async def get_documents(...):
      ...
  ```

- [ ] **ML predictions** - Use MLCache
- [ ] **Monitor cache hit rate** (target: 80%+)

---

## Phase 3: Performance Optimization (Week 2) 🟢

### API Optimization
- [ ] **Connection pooling**
  ```python
  # libs/core/db.py
  engine = create_async_engine(
      DATABASE_URL,
      pool_size=20,
      max_overflow=10,
      pool_recycle=3600
  )
  ```

- [ ] **Query optimization**
  - Use `selectinload` for relations
  - Eliminate N+1 queries
  - Batch operations

- [ ] **Response compression**
  ```python
  from fastapi.middleware.gzip import GZipMiddleware
  app.add_middleware(GZipMiddleware, minimum_size=1000)
  ```

### Search Optimization
- [ ] **OpenSearch settings**
  - Adjust `refresh_interval`
  - Enable compression
  - Optimize shard count

- [ ] **Qdrant optimization**
  - HNSW parameters tuning
  - On-disk vs in-memory strategy

### ML Optimization
- [ ] **Model quantization** (INT8)
- [ ] **Batch inference**
- [ ] **Model caching**

---

## Phase 4: Scalability (Week 3) 🔵

### Kubernetes Auto-Scaling
- [ ] **API Gateway HPA**
  ```yaml
  # infra/k8s/api-gateway/hpa.yaml
  minReplicas: 3
  maxReplicas: 20
  ```

- [ ] **Celery KEDA**
  - Scale based on queue length
  - Min 2, max 15 workers

- [ ] **Test auto-scaling**
  - Generate load
  - Verify pod scaling

### Load Balancing
- [ ] **Nginx upstream**
  ```nginx
  upstream api_backend {
      least_conn;
      server api-1:8090;
      server api-2:8090;
      server api-3:8090;
  }
  ```

- [ ] **Health checks**
- [ ] **Connection pooling**

---

## Phase 5: Advanced Features (Week 4+) 🟣

### Distributed Tracing
- [ ] **OpenTelemetry setup**
- [ ] **Jaeger deployment**
- [ ] **Instrument all services**

### Advanced Metrics
- [ ] **Custom Prometheus metrics**
- [ ] **SLO/SLI dashboards**
- [ ] **Business KPIs**

### GraphQL API (Optional)
- [ ] **Strawberry setup**
- [ ] **Schema definition**
- [ ] **Subscriptions**

---

## Verification Checklist ✅

### Performance
- [ ] API P99 latency < 100ms
- [ ] Search latency < 200ms
- [ ] DB query time < 50ms
- [ ] Cache hit rate > 80%

### Reliability
- [ ] Uptime > 99.9%
- [ ] MTTR < 1 minute
- [ ] No single point of failure
- [ ] Automatic recovery works

### Testing
- [ ] E2E tests passing
- [ ] Unit test coverage > 80%
- [ ] Performance tests
green
- [ ] Load tests passing

### Monitoring
- [ ] All alerts configured
- [ ] Dashboards complete
- [ ] Logs structured (JSON)
- [ ] Tracing works

### Security
- [ ] RBAC enforced
- [ ] Rate limiting active
- [ ] Audit logging enabled
- [ ] CORS configured

---

## Success Metrics

### Technical Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API Latency (P99) | <100ms | TBD | ⏳ |
| Search Latency | <200ms | TBD | ⏳ |
| Cache Hit Rate | >80% | TBD | ⏳ |
| Test Coverage | >80% | 80% | ✅ |
| Uptime | >99.9% | TBD | ⏳ |

### Business Metrics
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Requests/sec | 1000+ | TBD | ⏳ |
| Concurrent Users | 100+ | TBD | ⏳ |
| Data Processed | 1M+ docs | TBD | ⏳ |

---

## Quick Commands Reference

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Run tests
cd tests/e2e && npx cypress run

# Apply DB migration
./scripts/apply_db_indexes.sh
```

### Monitoring
```bash
# Prometheus
open http://localhost:9090

# Grafana
open http://localhost:3001

# AlertManager
open http://localhost:9093
```

### Health Checks
```bash
# API health
curl http://localhost:8090/health

# Mission Planner
curl http://localhost:8090/api/v25/missions/agents/stats

# Search cache stats
curl http://localhost:8090/api/v1/cache/stats
```

---

## Troubleshooting

### Database Migration Failed
```bash
# Rollback from backup
docker exec -i postgres psql -U predator -d predator_db < backups/latest.sql
```

### E2E Tests Failing
```bash
# Check API is running
curl http://localhost:8090/health

# Clear test data
npm run cypress:clean
```

### Caching Not Working
```bash
# Check Redis
docker exec redis redis-cli ping

# Monitor cache
docker exec redis redis-cli monitor
```

### High Latency
```bash
# Check slow queries
docker exec postgres psql -U predator -d predator_db
SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# Check connection pool
# Look for "pool exhausted" in logs
```

---

## Progress Tracking

**Week 1:**
- [x] Planning completed
- [x] Core features implemented
- [ ] DB migration executed (IN PROGRESS)
- [ ] E2E tests passing
- [ ] Caching verified

**Week 2:**
- [ ] Logging migration (50% files)
- [ ] Data contracts integrated
- [ ] Alertmanager deployed
- [ ] Performance benchmarks

**Week 3:**
- [ ] K8s auto-scaling
- [ ] Load balancing
- [ ] Distributed tracing

**Week 4:**
- [ ] Advanced metrics
- [ ] SLO/SLI dashboards
- [ ] GraphQL API (optional)

---

**Last Updated:** 2026-01-11 22:00
**Next Review:** 2026-01-12 10:00
**Owner:** Development Team
