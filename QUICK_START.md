# ⚡ Quick Start Guide - Негайні Дії

## 🎯 Що Робити Прямо Зараз

### 1. Запустити Новий CLI (5 хвилин)

```bash
cd /Users/dima-mac/Documents/Predator_21/libs/cli

# Встановити залежності
pip install -r requirements.txt

# Тест локально
python main.py --api-url http://localhost:8090 status

# Тест на сервері
python main.py --api-url http://194.177.1.240:8090 status

# Створити тестову місію
python main.py --api-url http://194.177.1.240:8090 search -q "тест"
```

### 2. Перевірити Mission Planner (3 хвилини)

```bash
# Створити тестову місію threat analysis
curl -X POST http://194.177.1.240:8090/api/v45/missions/test/threat-analysis

# Отримати статус
curl http://194.177.1.240:8090/api/v45/missions/agents/stats

# Перевірити всі активні місії
curl http://194.177.1.240:8090/api/v45/missions/
```

### 3. Активувати Alertmanager (10 хвилин)

```bash
# Додати до docker-compose.yml:
cat >> docker-compose.yml << 'EOF'

  alertmanager:
    image: prom/alertmanager:latest
    container_name: alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./infra/prometheus/alertmanager.yml:/etc/alertmanager/config.yml
    command:
      - '--config.file=/etc/alertmanager/config.yml'
    networks:
      - predator_network
    restart: unless-stopped
EOF

# Оновити prometheus.yml для інтеграції з alertmanager
cat >> infra/prometheus/prometheus.yml << 'EOF'

alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/alerts.yml'
EOF

# Перезапустити
docker-compose up -d prometheus alertmanager
```

### 4. Перевірити OpenSearch Dashboards (1 хвилина)

Відкрити в браузері:
```
http://194.177.1.240/monitoring
```

Натиснути на tab **"Dashboards"** (ANALYTICS)

---

## 🚀 Наступні 24 Години

### Пріоритет 1: E2E Tests (4 години)

```bash
cd tests/e2e

# Встановити Cypress
npm install

# Створити тест для ML cycle
cat > cypress/integration/quick-ml-test.cy.ts << 'EOF'
describe('Quick ML Test', () => {
  it('Should trigger ML job', () => {
    cy.request('POST', 'http://localhost:8090/api/v45/ml-training/start', {
      dataset_id: 'test_dataset',
      model_type: 'automl'
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('job_id')
    })
  })
})
EOF

# Запустити
npx cypress run --spec "cypress/integration/quick-ml-test.cy.ts"
```

### Пріоритет 2: Structured Logging (2 години)

```bash
# Встановити structured logging
pip install structlog python-json-logger

# Оновити один файл як приклад
# У services/api-gateway/app/main.py замінити:
# logger.info("Mission created")
# На:
# logger.info("mission_created", mission_id=mission.id, priority=mission.priority)
```

### Пріоритет 3: Database Indexes (1 година)

```bash
# Підключитись до PostgreSQL
docker exec -it postgres psql -U predator -d predator_db

# Додати indexes
CREATE INDEX CONCURRENTLY idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX CONCURRENTLY idx_documents_source_type ON documents(source_type);
CREATE INDEX CONCURRENTLY idx_meta_doc_id ON document_metadata(document_id);

# Перевірити
\d+ documents
```

---

## 📊 Моніторинг Прогресу

### Щоденний Checklist

- [ ] Перевірити Prometheus alerts: http://194.177.1.240:9090/alerts
- [ ] Перевірити Grafana dashboards: http://194.177.1.240:3001
- [ ] Запустити CLI health check: `python libs/cli/main.py status`
- [ ] Переглянути Mission Planner stats: `curl .../missions/agents/stats`
- [ ] Перевірити system logs: `docker logs backend | tail -100`

### Тижневі KPIs

```bash
# Створити скрипт для збору метрик
cat > collect_kpis.sh << 'EOF'
#!/bin/bash

echo "=== Predator Analytics KPIs ==="
echo "Date: $(date)"

# API Latency
echo "API P99 Latency:"
curl -s http://localhost:9090/api/v1/query?query=histogram_quantile\(0.99,http_request_duration_seconds_bucket\) | jq

# Search Performance
echo "Search Avg Latency:"
curl -s http://localhost:9090/api/v1/query?query=rate\(search_latency_seconds_sum\[5m\]\)/rate\(search_latency_seconds_count\[5m\]\) | jq

# ML Jobs Success Rate
echo "ML Success Rate:"
curl -s http://localhost:9090/api/v1/query?query=rate\(ml_job_completed_total\[1h\]\)/rate\(ml_job_total\[1h\]\) | jq

# Mission Completion
echo "Active Missions:"
curl -s http://localhost:8090/api/v45/missions/ | jq '.total'

EOF

chmod +x collect_kpis.sh
./collect_kpis.sh
```

---

## 🔥 Hot Fixes (Якщо щось не працює)

### Backend не запускається

```bash
# Перевірити логи
docker logs backend --tail 100

# Перезапустити з чистого листа
docker-compose down
docker-compose up -d postgres redis
sleep 10
docker-compose up -d backend
```

### Mission Planner endpoint 404

```bash
# Перевірити що router підключений
docker exec backend grep -r "missions_router" /app/app/main.py

# Якщо немає - додати:
docker exec -it backend bash
# У контейнері:
# Додати import в main.py
```

### Prometheus не видно alerts

```bash
# Перевірити конфіг
docker exec prometheus cat /etc/prometheus/prometheus.yml

# Reload config
curl -X POST http://localhost:9090/-/reload
```

---

## 📈 Очікувані Результати (Перший Тиждень)

### Day 1-2: Setup
- ✅ CLI працює локально та на сервері
- ✅ Mission Planner API доступний
- ✅ Alertmanager інтегрований з Prometheus

### Day 3-4: Testing
- ✅ 3-5 E2E тестів написано
- ✅ Automated test run в CI
- ✅ Structured logging в 50% файлів

### Day 5-7: Optimization
- ✅ Database indexes додано
- ✅ Redis caching для search
- ✅ API latency покращено на 30%

### Metrics після тижня:

| Метрика | Очікується |
|---------|------------|
| Test Coverage | 50% → 65% |
| API P99 Latency | 500ms → 350ms |
| Search Latency | 500ms → 300ms |
| Alerts Configured | 0 → 25+ |

---

## 🎓 Навчальні Ресурси

### Для команди:

**E2E Testing:**
- https://docs.cypress.io/guides/overview/why-cypress
- https://www.cypress.io/blog/2020/02/12/working-with-apis/

**Prometheus/Alertmanager:**
- https://prometheus.io/docs/alerting/latest/configuration/
- https://prometheus.io/docs/practices/alerting/

**Performance Optimization:**
- https://fastapi.tiangolo.com/advanced/performance/
- https://docs.sqlalchemy.org/en/14/orm/queryguide.html

**Mission Planner Pattern:**
- OODA Loop: https://en.wikipedia.org/wiki/OODA_loop
- Multi-Agent Systems: https://arxiv.org/abs/2308.10848

---

## 💡 Pro Tips

1. **Incremental Changes**
   - Не міняти все одразу
   - Тестувати кожну зміну окремо
   - Rollback plan для кожного deployment

2. **Measure Everything**
   - Baseline metrics перед змінами
   - A/B testing для критичних features
   - Automated performance regression tests

3. **Documentation**
   - Оновлювати README після кожної зміни
   - Code comments для складної логіки
   - API docs автоматично з OpenAPI

4. **Team Communication**
   - Daily standups (15 min)
   - Weekly sprint reviews
   - Shared KPI dashboard

---

**Готові почати? Виберіть один пункт зверху та приступайте! 🚀**

**Questions?** Звертайтесь до повного плану в `ROADMAP_IMPROVEMENTS.md`
