# 📊 Міграція на Structured Logging - Приклади

## До і Після

### ❌ Старий спосіб (неструктуровано)
```python
import logging

logger = logging.getLogger("predator.api")

# Неструктуроване логування
logger.info("User logged in successfully")
logger.info(f"Search query: {query}, results: {len(results)}")
logger.error(f"Database connection failed: {error}")
```

**Проблеми:**
- ❌ Важко парсити
- ❌ Немає correlation IDs
- ❌ Неможливо query by fields в Grafana/Loki
- ❌ String concatenation = slow

---

### ✅ Новий спосіб (structured)
```python
from libs.core.structured_logger import get_logger, RequestLogger

logger = get_logger("predator.api")

# Структуроване логування
logger.info(
    "user_logged_in",
    user_id="user_123",
    username="admin",
    ip_address="192.168.1.100",
    session_id="sess_456"
)

logger.info(
    "search_completed",
    query=query,
    mode="hybrid",
    results_count=len(results),
    duration_ms=234
)

logger.error(
    "database_connection_failed",
    error=str(error),
    host="postgres",
    port=5432,
    retry_attempt=3
)
```

**Output (JSON):**
```json
{
  "message": "user_logged_in",
  "user_id": "user_123",
  "username": "admin",
  "ip_address": "192.168.1.100",
  "session_id": "sess_456",
  "timestamp": "2026-01-11T21:30:00Z",
  "service": "predator-api",
  "version": "25.0.0",
  "environment": "production",
  "correlation_id": "abc-123-def",
  "level": "info"
}
```

**Переваги:**
- ✅ Легко парсити
- ✅ Auto correlation IDs
- ✅ Query-able: `{message="user_logged_in"} | user_id="user_123"`
- ✅ Structured data = fast

---

## Міграційні Приклади

### 1. API Gateway (main.py)

**До:**
```python
# services/api-gateway/app/main.py
import logging
logger = logging.getLogger("predator.api")

@app.post("/api/v1/search")
async def search(request: SearchRequest):
    logger.info(f"Search request: {request.query}")

    start = time.time()
    results = await search_service.search(request.query)
    duration = (time.time() - start) * 1000

    logger.info(f"Search completed in {duration}ms, {len(results)} results")
    return results
```

**Після:**
```python
from libs.core.structured_logger import get_logger, RequestLogger

logger = get_logger("predator.api")

@app.post("/api/v1/search")
async def search(request: SearchRequest):
    with RequestLogger(logger, "search", query=request.query, mode=request.mode) as req_logger:
        req_logger.info(
            "processing_search",
            limit=request.limit,
            filters=request.filters
        )

        results = await search_service.search(request.query)

        req_logger.info(
            "search_results",
            results_count=len(results),
            has_filters=bool(request.filters)
        )

        return results
```

---

### 2. Mission Planner

**До:**
```python
# services/orchestrator/council/mission_planner.py
logger = logging.getLogger(__name__)

async def create_mission(self, title: str, priority: MissionPriority):
    logger.info(f"Creating mission: {title}")

    mission = Mission(...)
    self.active_missions[mission.mission_id] = mission

    logger.info(f"Mission {mission.mission_id} created with {len(mission.tasks)} tasks")
    return mission
```

**Після:**
```python
from libs.core.structured_logger import get_logger, log_business_event

logger = get_logger("predator.mission_planner")

async def create_mission(self, title: str, priority: MissionPriority):
    logger.info(
        "mission_creating",
        title=title,
        priority=priority.value
    )

    mission = Mission(...)
    self.active_missions[mission.mission_id] = mission

    log_business_event(
        logger,
        "mission_created",
        mission_id=mission.mission_id,
        priority=priority.value,
        tasks_count=len(mission.tasks),
        agents_count=len(mission.assigned_agents)
    )

    return mission
```

---

### 3. Celery Tasks

**До:**
```python
# services/api-gateway/app/tasks/etl_workers.py
import logging
logger = logging.getLogger(__name__)

@celery_app.task
def process_file_task(file_path: str, dataset_type: str):
    logger.info(f"Processing {file_path}")

    try:
        result = etl_service.process(file_path, dataset_type)
        logger.info(f"Processed {result['records']} records")
        return result
    except Exception as e:
        logger.error(f"Processing failed: {e}")
        raise
```

**Після:**
```python
from libs.core.structured_logger import get_logger, RequestLogger
from libs.core.contracts.payloads import ETLTaskPayload, validate_payload

logger = get_logger("predator.celery.etl")

@celery_app.task
def process_file_task(**kwargs):
    # Validate payload
    payload = validate_payload(ETLTaskPayload, kwargs)

    with RequestLogger(
        logger,
        "etl_processing",
        file_path=payload.file_path,
        dataset_type=payload.dataset_type.value
    ) as req_logger:
        req_logger.info(
            "etl_started",
            priority=payload.priority.value,
            options=payload.options
        )

        try:
            result = etl_service.process(
                payload.file_path,
                payload.dataset_type
            )

            req_logger.info(
                "etl_completed",
                records_processed=result['records'],
                chunks=result.get('chunks', 0)
            )

            return result

        except Exception as e:
            req_logger.exception(
                "etl_failed",
                error=str(e),
                error_type=type(e).__name__
            )
            raise
```

---

### 4. Database Operations

**До:**
```python
# services/api-gateway/app/services/document_service.py
async def get_documents(self, limit: int, offset: int):
    logger.info(f"Fetching documents: limit={limit}, offset={offset}")

    start = time.time()
    docs = await self.db.query(...)
    duration = (time.time() - start) * 1000

    logger.info(f"Query completed in {duration}ms")
    return docs
```

**Після:**
```python
from libs.core.structured_logger import get_logger, log_performance

logger = get_logger("predator.document_service")

async def get_documents(self, limit: int, offset: int):
    logger.info(
        "fetching_documents",
        limit=limit,
        offset=offset
    )

    start = time.time()
    docs = await self.db.query(...)
    duration_ms = int((time.time() - start) * 1000)

    log_performance(
        logger,
        "database_query",
        duration_ms=duration_ms,
        query_type="select",
        table="documents",
        rows_returned=len(docs)
    )

    return docs
```

---

## Migration Checklist

### Phase 1: Core Services (Week 1)
- [ ] `services/api-gateway/app/main.py`
- [ ] `services/api-gateway/app/api/routers/*.py`
- [ ] `services/orchestrator/council/mission_planner.py`
- [ ] `services/api-gateway/app/tasks/etl_workers.py`
- [ ] `services/api-gateway/app/tasks/ml_workers.py`

### Phase 2: Supporting Services (Week 2)
- [ ] `services/api-gateway/app/services/document_service.py`
- [ ] `services/api-gateway/app/services/embedding_service.py`
- [ ] `services/api-gateway/app/services/qdrant_service.py`
- [ ] `services/api-gateway/app/services/opensearch_indexer.py`
- [ ] `libs/core/guardian.py`

### Phase 3: Agents & Advanced (Week 3)
- [ ] All agents in `services/orchestrator/agents/`
- [ ] Trinity system
- [ ] Autonomous optimizer

---

## Grafana/Loki Queries

З structured logs можна робити такі queries:

```logql
# Всі failed requests за останні 30 хвилин
{service="predator-api"}
  | json
  | message =~ ".*_failed"
  | line_format "{{.timestamp}} {{.message}} user={{.user_id}}"

# Search queries з latency >500ms
{service="predator-api"}
  | json
  | message="search_completed"
  | duration_ms > 500

# ML training по datasets
{service="predator-celery"}
  | json
  | message="ml_training_completed"
  | dataset_id="dataset_march_2024"

# Security events
{service="predator-api"}
  | json
  | event_category="security"
  | severity="high"

# Performance по операціям
{service="predator-api"}
  | json
  | performance_category="latency"
  | unwrap duration_ms
  | quantile_over_time(0.99, [1h])
```

---

## Testing

```python
# tests/test_structured_logging.py
from libs.core.structured_logger import setup_structured_logging, RequestLogger
import json

def test_structured_log_format():
    """Verify logs are valid JSON"""
    logger = setup_structured_logging(use_json=True)

    # Capture log output
    import io
    import sys
    captured_output = io.StringIO()
    sys.stdout = captured_output

    logger.info("test_event", key="value")

    sys.stdout = sys.__stdout__
    log_line = captured_output.getvalue()

    # Parse as JSON
    log_json = json.loads(log_line)

    assert log_json["message"] == "test_event"
    assert log_json["key"] == "value"
    assert "timestamp" in log_json
    assert "correlation_id" in log_json
```

---

**Next:** Після міграції всіх логів, налаштуйте Loki/ElasticSearch для centralized logging.
