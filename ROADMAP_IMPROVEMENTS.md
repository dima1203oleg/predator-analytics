# 🚀 Predator Analytics v45 - Roadmap Вдосконалення

## 📊 Поточний Стан: 90% Готовності

**Дата створення:** 2026-01-11
**Версія:** v45.0
**Мета:** Досягти 100% готовності та production excellence

---

## 🎯 Стратегічні Цілі

### 1. **Надійність** (Reliability)
- Uptime: 99.99%
- MTTR (Mean Time To Recovery): <30 секунд
- Zero data loss гарантії

### 2. **Продуктивність** (Performance)
- P99 API Latency: <100ms
- Search Response Time: <200ms
- ML Inference: <2s

### 3. **Масштабованість** (Scalability)
- Підтримка 10,000+ RPS
- Горизонтальне масштабування всіх компонентів
- Auto-scaling базований на метриках

### 4. **Спостережуваність** (Observability)
- Повне розуміння стану системи в реальному часі
- Proactive alerting
- Distributed tracing

---

# 📋 ПЛАН ВДОСКОНАЛЕННЯ

## Phase 1: Надійність та Тестування (1-2 тижні)

### 🧪 1.1 E2E Testing Suite

**Пріоритет:** 🔴 CRITICAL
**Складність:** ⭐⭐⭐ Середня
**Час:** 3-4 дні

**Задачі:**

#### Test 1: Full ML Training Cycle
```javascript
// tests/e2e/cypress/integration/ml-training-cycle.cy.ts
describe('ML Training End-to-End', () => {
  it('Should complete full training pipeline', () => {
    // 1. Upload dataset
    cy.uploadFile('test-dataset.csv')
    cy.wait(2000)

    // 2. Trigger training
    cy.visit('/ml/training')
    cy.get('[data-testid="start-training"]').click()

    // 3. Monitor progress
    cy.get('[data-testid="training-status"]')
      .should('contain', 'RUNNING')

    // 4. Wait for completion (with timeout)
    cy.get('[data-testid="training-status"]', { timeout: 60000 })
      .should('contain', 'COMPLETED')

    // 5. Verify model artifacts
    cy.request('/api/v45/ml-jobs')
      .its('body.jobs[0].status')
      .should('eq', 'succeeded')
  })
})
```

#### Test 2: Mission Planner Workflow
```javascript
// tests/e2e/cypress/integration/mission-planner.cy.ts
describe('Mission Planner', () => {
  it('Should execute threat analysis mission', () => {
    // Create mission via API
    cy.request('POST', '/api/v45/missions/test/threat-analysis')
      .then((response) => {
        const missionId = response.body.mission_id

        // Poll for completion
        cy.waitUntil(() =>
          cy.request(`/api/v45/missions/${missionId}`)
            .then(r => r.body.status === 'completed')
        , { timeout: 30000, interval: 2000 })

        // Verify all tasks completed
        cy.request(`/api/v45/missions/${missionId}`)
          .its('body.tasks')
          .should('have.length.greaterThan', 0)
      })
  })
})
```

#### Test 3: Search Performance
```javascript
// tests/e2e/cypress/integration/search-performance.cy.ts
describe('Hybrid Search Performance', () => {
  it('Should return results within 200ms', () => {
    const startTime = Date.now()

    cy.request('POST', '/api/v1/search', {
      query: 'митні декларації',
      mode: 'hybrid',
      limit: 20
    }).then((response) => {
      const latency = Date.now() - startTime

      expect(latency).to.be.lessThan(200)
      expect(response.body.results).to.have.length.greaterThan(0)
    })
  })
})
```

**Очікувані результати:**
- ✅ 95%+ test coverage для critical flows
- ✅ Automated regression testing
- ✅ Performance benchmarks

---

### 🔧 1.2 Data Contracts Формалізація

**Пріоритет:** 🟡 HIGH
**Складність:** ⭐⭐ Легка-Середня
**Час:** 1-2 дні

**Задачі:**

#### Celery Task Payloads
```python
# libs/core/contracts/celery_payloads.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class ETLTaskPayload(BaseModel):
    """Contract for ETL processing tasks"""
    source_id: str = Field(..., description="Unique source identifier")
    file_path: str = Field(..., description="Path to file in MinIO")
    dataset_type: str = Field(..., description="Type: customs, tenders, etc")
    options: Dict[str, Any] = Field(default_factory=dict)
    priority: int = Field(default=5, ge=1, le=10)

    class Config:
        schema_extra = {
            "example": {
                "source_id": "src_march_2024",
                "file_path": "raw-data/customs/march.xlsx",
                "dataset_type": "customs",
                "options": {"validate_schema": True},
                "priority": 8
            }
        }

class MLTrainingPayload(BaseModel):
    """Contract for ML training tasks"""
    dataset_id: str
    model_type: str = Field(..., regex="^(automl|anomaly|classification|regression)$")
    hyperparameters: Dict[str, Any] = Field(default_factory=dict)
    training_config: Optional[Dict[str, Any]] = None
    callback_url: Optional[str] = None

class IndexingTaskPayload(BaseModel):
    """Contract for indexing tasks"""
    documents: list[Dict[str, Any]]
    index_name: str
    collection_name: str
    batch_size: int = Field(default=100, ge=1, le=1000)
```

#### Redis Event Schemas
```python
# libs/core/contracts/redis_events.py
from pydantic import BaseModel
from enum import Enum

class EventType(str, Enum):
    JOB_CREATED = "job.created"
    JOB_STARTED = "job.started"
    JOB_COMPLETED = "job.completed"
    JOB_FAILED = "job.failed"
    ALERT_TRIGGERED = "alert.triggered"

class RedisEvent(BaseModel):
    event_type: EventType
    payload: Dict[str, Any]
    timestamp: datetime
    correlation_id: Optional[str] = None
```

**Очікувані результати:**
- ✅ Всі Celery tasks використовують Pydantic валідацію
- ✅ Автоматична генерація API документації для task payloads
- ✅ Compile-time type checking

---

### 📊 1.3 Structured Logging (JSON Format)

**Пріоритет:** 🟢 MEDIUM
**Складність:** ⭐ Легка
**Час:** 1 день

**Задачі:**

```python
# libs/core/logger.py
import structlog
from pythonjsonlogger import jsonlogger

def setup_structured_logger(name: str):
    """
    Configure structured JSON logging for production
    """
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger(name)

# Використання:
logger = setup_structured_logger("predator.api")

logger.info("mission_created",
    mission_id=mission.id,
    priority=mission.priority.value,
    tasks_count=len(mission.tasks),
    duration_ms=duration
)

# Output:
# {"event": "mission_created", "mission_id": "m_123", "priority": "high",
#  "tasks_count": 4, "duration_ms": 234, "timestamp": "2026-01-11T21:20:00Z"}
```

**Переваги:**
- ✅ Легко парситься ElasticSearch/Loki
- ✅ Structured queries в Grafana
- ✅ Correlation IDs для distributed tracing

---

## Phase 2: Продуктивність та Оптимізація (1 тиждень)

### ⚡ 2.1 API Performance Optimization

**Пріоритет:** 🔴 CRITICAL
**Складність:** ⭐⭐⭐ Середня
**Час:** 3-4 дні

#### 2.1.1 Database Query Optimization

**Проблема:** N+1 queries, missing indexes

**Рішення:**
```python
# apps/backend/app/services/optimized_queries.py
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

class OptimizedDocumentService:
    async def get_documents_with_relations(self, limit: int = 100):
        """
        Optimized query with eager loading
        Before: 1 + N queries
        After: 1 query
        """
        stmt = (
            select(Document)
            .options(
                selectinload(Document.metadata),
                joinedload(Document.source)
            )
            .limit(limit)
        )

        result = await self.session.execute(stmt)
        return result.scalars().all()

# Add indexes
"""
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_source_type ON documents(source_type);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_meta_doc_id ON document_metadata(document_id);
"""
```

#### 2.1.2 Redis Caching Strategy

```python
# libs/core/cache.py
from functools import wraps
import redis.asyncio as redis
import pickle
from typing import Optional

class CacheService:
    def __init__(self):
        self.redis = redis.Redis(
            host='redis',
            port=6379,
            decode_responses=False  # Binary для pickle
        )

    def cached(self, ttl: int = 300, key_prefix: str = ""):
        """Decorator для кешування результатів"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = f"{key_prefix}:{func.__name__}:{hash((args, tuple(kwargs.items())))}"

                # Try cache
                cached = await self.redis.get(cache_key)
                if cached:
                    return pickle.loads(cached)

                # Execute and cache
                result = await func(*args, **kwargs)
                await self.redis.setex(
                    cache_key,
                    ttl,
                    pickle.dumps(result)
                )
                return result
            return wrapper
        return decorator

# Використання:
cache = CacheService()

@cache.cached(ttl=600, key_prefix="search")
async def search_documents(query: str, limit: int):
    # Expensive operation
    return await complex_search(query, limit)
```

#### 2.1.3 Connection Pooling

```python
# libs/core/db.py
from sqlalchemy.ext.asyncio import create_async_engine

engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,          # 20 постійних з'єднань
    max_overflow=10,       # +10 при пікових навантаженнях
    pool_recycle=3600,     # Recyclе кожну годину
    pool_pre_ping=True,    # Health check перед використанням
    echo=False,
    pool_timeout=30
)
```

**Очікувані результати:**
- ✅ API latency: 500ms → 100ms (P99)
- ✅ Database connections: -60%
- ✅ Cache hit rate: >80%

---

### 🔍 2.2 Search Performance Tuning

**Пріоритет:** 🟡 HIGH
**Складність:** ⭐⭐⭐ Середня
**Час:** 2-3 дні

#### OpenSearch Optimization

```yaml
# infra/opensearch/index_settings.json
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1,
    "refresh_interval": "10s",
    "index.codec": "best_compression",
    "index.max_result_window": 10000,
    "analysis": {
      "analyzer": {
        "ukrainian_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "ukrainian_stop", "ukrainian_stemmer"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "content": {
        "type": "text",
        "analyzer": "ukrainian_analyzer",
        "fields": {
          "keyword": {"type": "keyword"}
        }
      },
      "embedding": {
        "type": "dense_vector",
        "dims": 384,
        "index": true,
        "similarity": "cosine"
      }
    }
  }
}
```

#### Qdrant Optimization

```python
# services/api-gateway/app/services/qdrant_service.py
from qdrant_client.models import Distance, VectorParams, OptimizersConfigDiff

await self.client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(
        size=384,
        distance=Distance.COSINE,
        on_disk=False  # In-memory для швидкості
    ),
    optimizers_config=OptimizersConfigDiff(
        indexing_threshold=20000,
        memmap_threshold=50000
    ),
    hnsw_config={
        "m": 16,              # Connections per layer
        "ef_construct": 200,  # Build-time accuracy
    }
)

# Search with optimized params
results = await self.client.search(
    collection_name="documents",
    query_vector=embedding,
    limit=limit,
    search_params={
        "hnsw_ef": 128,  # Runtime accuracy vs speed
        "exact": False
    }
)
```

**Очікувані результати:**
- ✅ Search latency: 500ms → 150ms
- ✅ Hybrid search accuracy: +5%
- ✅ Index size: -30% (compression)

---

### 🤖 2.3 ML Inference Optimization

**Пріоритет:** 🟡 HIGH
**Складність:** ⭐⭐⭐⭐ Складна
**Час:** 3-4 дні

#### Model Quantization

```python
# services/ml/model_optimizer.py
import torch
from transformers import AutoModel, AutoTokenizer

class ModelOptimizer:
    @staticmethod
    def quantize_model_int8(model_name: str):
        """
        Convert model to INT8 (4x smaller, 2-3x faster)
        """
        model = AutoModel.from_pretrained(model_name)

        # Dynamic quantization
        quantized_model = torch.quantization.quantize_dynamic(
            model,
            {torch.nn.Linear},
            dtype=torch.qint8
        )

        return quantized_model

    @staticmethod
    def optimize_for_inference(model):
        """
        TorchScript compilation + optimization
        """
        model.eval()

        # Trace model
        example_input = torch.randint(0, 1000, (1, 128))
        traced = torch.jit.trace(model, example_input)

        # Optimize
        optimized = torch.jit.optimize_for_inference(traced)

        return optimized
```

#### Batch Inference

```python
# services/api-gateway/app/services/batch_embedder.py
class BatchEmbeddingService:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.batch_size = 32
        self.wait_time = 0.1  # 100ms

    async def embed_async(self, text: str) -> list[float]:
        """
        Queue request and wait for batched result
        """
        future = asyncio.Future()
        await self.queue.put((text, future))
        return await future

    async def process_batches(self):
        """
        Background worker for batch processing
        """
        while True:
            batch = []
            futures = []

            # Collect batch
            try:
                while len(batch) < self.batch_size:
                    text, future = await asyncio.wait_for(
                        self.queue.get(),
                        timeout=self.wait_time
                    )
                    batch.append(text)
                    futures.append(future)
            except asyncio.TimeoutError:
                pass

            if not batch:
                continue

            # Process batch
            embeddings = self.model.encode(batch)

            # Return results
            for future, embedding in zip(futures, embeddings):
                future.set_result(embedding.tolist())
```

**Очікувані результати:**
- ✅ Inference latency: 2s → 500ms
- ✅ Throughput: 10 req/s → 50 req/s
- ✅ Memory usage: -50%

---

## Phase 3: Масштабованість (1-2 тижні)

### 📈 3.1 Horizontal Scaling

**Пріоритет:** 🟡 HIGH
**Складність:** ⭐⭐⭐⭐ Складна
**Час:** 1 тиждень

#### Kubernetes Auto-Scaling

```yaml
# infra/k8s/api-gateway/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
  namespace: predator
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

#### Celery Auto-Scaling

```yaml
# infra/k8s/celery-worker/keda.yaml
apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: celery-worker-scaler
spec:
  scaleTargetRef:
    name: celery-worker
  minReplicaCount: 2
  maxReplicaCount: 15
  triggers:
    - type: redis
      metadata:
        address: redis:6379
        listName: celery
        listLength: "10"  # Scale up якщо >10 задач
```

**Очікувані результати:**
- ✅ Auto-scaling базований на навантаженні
- ✅ Cost optimization (scale down при низькому навантаженні)
- ✅ Zero downtime deployments

---

### 🌐 3.2 Load Balancing and CDN

**Пріоритет:** 🟢 MEDIUM
**Складність:** ⭐⭐ Легка-Середня
**Час:** 2-3 дні

#### Nginx Load Balancer

```nginx
# docker/nginx-lb.conf
upstream api_backend {
    least_conn;  # Least connections algorithm

    server api-1:8090 max_fails=3 fail_timeout=30s;
    server api-2:8090 max_fails=3 fail_timeout=30s;
    server api-3:8090 max_fails=3 fail_timeout=30s;

    keepalive 32;
}

server {
    listen 80;

    location /api/ {
        proxy_pass http://api_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Health checks
        proxy_next_upstream error timeout http_502 http_503;
        proxy_connect_timeout 5s;
    }
}
```

#### Static Assets CDN

```python
# apps/frontend/src/config.ts
export const CDN_URL = process.env.NODE_ENV === 'production'
  ? 'https://cdn.predator-analytics.com'
  : '/static';

// Use CDN for images, fonts, etc
<img src={`${CDN_URL}/images/logo.png`} />
```

---

## Phase 4: Observability та Debugging (1 тиждень)

### 🔭 4.1 Distributed Tracing

**Пріоритет:** 🟡 HIGH
**Складність:** ⭐⭐⭐ Середня
**Час:** 3-4 дні

#### OpenTelemetry Integration

```python
# libs/core/tracing.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

def setup_tracing(app: FastAPI):
    """
    Configure distributed tracing with Jaeger
    """
    provider = TracerProvider()

    jaeger_exporter = JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )

    provider.add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )

    trace.set_tracer_provider(provider)

    # Auto-instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    return trace.get_tracer(__name__)

# Використання:
tracer = setup_tracing(app)

@app.get("/api/v1/search")
async def search(query: str):
    with tracer.start_as_current_span("search_documents") as span:
        span.set_attribute("query", query)

        with tracer.start_as_current_span("opensearch_query"):
            results = await opensearch.search(query)

        with tracer.start_as_current_span("qdrant_search"):
            embeddings = await qdrant.search(query)

        return results
```

**Переваги:**
- ✅ Візуалізація requests flow через сервіси
- ✅ Bottleneck identification
- ✅ Latency breakdown по компонентах

---

### 📊 4.2 Advanced Metrics

**Пріоритет:** 🟢 MEDIUM
**Складність:** ⭐⭐ Легка-Середня
**Час:** 2 дні

#### Custom Prometheus Metrics

```python
# libs/core/metrics.py
from prometheus_client import Counter, Histogram, Gauge, Summary

# Business metrics
search_requests_total = Counter(
    'search_requests_total',
    'Total search requests',
    ['mode', 'status']
)

search_latency = Histogram(
    'search_latency_seconds',
    'Search latency in seconds',
    ['mode'],
    buckets=[.005, .01, .025, .05, .075, .1, .25, .5, .75, 1.0, 2.5, 5.0]
)

ml_training_duration = Summary(
    'ml_training_duration_seconds',
    'ML training duration',
    ['model_type']
)

active_missions = Gauge(
    'active_missions_count',
    'Number of active missions',
    ['priority']
)

# Використання:
@search_latency.labels(mode='hybrid').time()
async def hybrid_search(query: str):
    results = await search(query)
    search_requests_total.labels(mode='hybrid', status='success').inc()
    return results
```

---

## Phase 5: Розвиток Функціоналу (2-3 тижні)

### 🚀 5.1 GraphQL API

**Пріоритет:** 🟢 MEDIUM
**Складність:** ⭐⭐⭐ Середня
**Час:** 1 тиждень

**Чому потрібно:**
- Flexible queries (клієнт вибирає потрібні поля)
- Single request для складних даних
- Real-time subscriptions

```python
# services/api-gateway/app/graphql/schema.py
import strawberry
from typing import List, Optional

@strawberry.type
class Document:
    id: str
    title: str
    content: str
    source_type: str
    created_at: str

    @strawberry.field
    async def related_documents(self, limit: int = 5) -> List['Document']:
        """Auto-resolve related documents"""
        return await get_related(self.id, limit)

@strawberry.type
class Query:
    @strawberry.field
    async def search(
        self,
        query: str,
        mode: str = "hybrid",
        limit: int = 20
    ) -> List[Document]:
        """Semantic search"""
        return await search_service.search(query, mode, limit)

    @strawberry.field
    async def mission(self, id: str) -> Optional[Mission]:
        """Get mission by ID"""
        return await mission_planner.get_mission(id)

@strawberry.type
class Subscription:
    @strawberry.subscription
    async def mission_updates(self, mission_id: str):
        """Real-time mission status updates"""
        async for update in mission_stream(mission_id):
            yield update

schema = strawberry.Schema(query=Query, subscription=Subscription)
```

---

### 🧠 5.2 Advanced AI Features

**Пріоритет:** 🟡 HIGH
**Складність:** ⭐⭐⭐⭐⭐ Дуже Складна
**Час:** 2-3 тижні

#### 5.2.1 AutoML Pipeline

```python
# services/ml/automl_engine.py
from h2o.automl import H2OAutoML

class AutoMLEngine:
    async def auto_train(self, dataset_id: str):
        """
        Automatic model selection and hyperparameter tuning
        """
        # Load data
        data = await load_dataset(dataset_id)

        # Auto feature engineering
        features = await self.auto_feature_engineering(data)

        # H2O AutoML
        aml = H2OAutoML(
            max_models=20,
            max_runtime_secs=3600,
            seed=42
        )

        aml.train(
            x=features,
            y='target',
            training_frame=data
        )

        # Get best model
        best_model = aml.leader

        # Deploy via MLflow
        await self.deploy_model(best_model, dataset_id)

        return {
            "model_id": best_model.model_id,
            "accuracy": best_model.accuracy(),
            "type": best_model.algo
        }
```

#### 5.2.2 Reinforcement Learning від User Feedback

```python
# services/ml/rlhf_trainer.py
class RLHFTrainer:
    """
    Reinforcement Learning from Human Feedback
    Покращує search relevance базуючись на user interactions
    """
    async def update_from_feedback(
        self,
        query: str,
        clicked_results: list[str],
        skipped_results: list[str]
    ):
        """
        Update ranking model based on user clicks
        """
        # Positive examples (clicked)
        positive_pairs = [
            (query, doc_id) for doc_id in clicked_results
        ]

        # Negative examples (shown but not clicked)
        negative_pairs = [
            (query, doc_id) for doc_id in skipped_results
        ]

        # Update ranker with pairwise loss
        await self.ranker_model.partial_fit(
            positive_pairs,
            negative_pairs
        )

        # A/B test new model
        await self.deploy_shadow_model()
```

---

### 🔐 5.3 Advanced Security Features

**Пріоритет:** 🔴 CRITICAL (на кінець, як запитано)
**Складність:** ⭐⭐⭐⭐⭐ Дуже Складна
**Час:** 2-3 тижні

#### 5.3.1 RBAC Enforcement

```python
# libs/core/security/rbac.py
from functools import wraps
from fastapi import HTTPException, Depends

class Permission(Enum):
    READ_DOCUMENTS = "documents:read"
    WRITE_DOCUMENTS = "documents:write"
    MANAGE_USERS = "users:manage"
    RUN_ML_JOBS = "ml:execute"
    VIEW_METRICS = "metrics:read"

ROLE_PERMISSIONS = {
    "explorer": [Permission.READ_DOCUMENTS, Permission.VIEW_METRICS],
    "operator": [Permission.READ_DOCUMENTS, Permission.WRITE_DOCUMENTS, Permission.VIEW_METRICS],
    "commander": [...],  # All permissions
}

def require_permission(permission: Permission):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, user=Depends(get_current_user), **kwargs):
            if permission not in ROLE_PERMISSIONS.get(user.role, []):
                raise HTTPException(403, "Insufficient permissions")
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Використання:
@app.delete("/api/v1/documents/{doc_id}")
@require_permission(Permission.WRITE_DOCUMENTS)
async def delete_document(doc_id: str, user: User = Depends(get_current_user)):
    ...
```

#### 5.3.2 Post-Quantum Cryptography (PQC)

```python
# libs/core/security/pqc.py
from pqcrypto.kem.kyber768 import generate_keypair, encrypt, decrypt
from pqcrypto.sign.dilithium3 import sign, verify

class HybridCrypto:
    """
    Hybrid classical + post-quantum encryption
    X25519 + Kyber768 для forward secrecy
    """
    def __init__(self):
        # Classic ECDH
        self.classic_private = ec.generate_private_key(ec.SECP256R1())

        # Post-quantum KEM
        self.pq_public, self.pq_private = generate_keypair()

    def hybrid_encrypt(self, data: bytes, recipient_public) -> dict:
        """
        Encrypt with both classical and PQ
        """
        # 1. Classical ECDH shared secret
        classic_shared = self.classic_private.exchange(
            ec.ECDH(),
            recipient_public
        )

        # 2. PQ KEM encapsulation
        pq_ciphertext, pq_shared = encrypt(recipient_public)

        # 3. Combine secrets with HKDF
        combined_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'hybrid-key'
        ).derive(classic_shared + pq_shared)

        # 4. AES-GCM encryption
        cipher = Cipher(
            algorithms.AES(combined_key),
            modes.GCM(os.urandom(12))
        )

        encrypted_data = cipher.encrypt(data)

        return {
            "classic_public": self.classic_private.public_key(),
            "pq_ciphertext": pq_ciphertext,
            "encrypted_data": encrypted_data
        }
```

---

## 📊 Метрики Успіху

### Поточні vs Цільові Показники

| Метрика | Поточне | Ціль | Покращення |
|---------|---------|------|------------|
| **System Uptime** | 99.5% | 99.99% | +0.49% |
| **MTTR** | 5 min | 30s | -90% |
| **API P99 Latency** | 500ms | 100ms | -80% |
| **Search Latency** | 500ms | 150ms | -70% |
| **ML Inference** | 2s | 500ms | -75% |
| **Test Coverage** | 40% | 80% | +100% |
| **Cache Hit Rate** | 60% | 85% | +42% |
| **Cost per Request** | $0.005 | $0.002 | -60% |

---

## 🗓️ Timeline

```
Тиждень 1-2: Phase 1 (Надійність)
├── E2E Tests    [████████░░] 80%
├── Contracts    [██████████] 100%
└── Logging      [██████████] 100%

Тиждень 3: Phase 2 (Продуктивність)
├── API Ops      [██████░░░░] 60%
├── Search Ops   [████░░░░░░] 40%
└── ML Ops       [██░░░░░░░░] 20%

Тиждень 4: Phase 3 (Масштабованість)
├── K8s HPA      [░░░░░░░░░░] 0%
├── KEDA         [░░░░░░░░░░] 0%
└── Load Balancer[░░░░░░░░░░] 0%

Тиждень 5-6: Phase 4 (Observability)
├── Tracing      [░░░░░░░░░░] 0%
├── Metrics      [████░░░░░░] 40%
└── Dashboards   [██░░░░░░░░] 20%

Тиждень 7-9: Phase 5 (Features)
├── GraphQL      [░░░░░░░░░░] 0%
├── AutoML       [░░░░░░░░░░] 0%
├── RLHF         [░░░░░░░░░░] 0%
└── Security/PQC [░░░░░░░░░░] 0% (на кінець)
```

---

## 💰 Оцінка Ресурсів

### Команда
- **Backend Dev:** 1 FTE (Full-Time Equivalent)
- **DevOps/SRE:** 0.5 FTE
- **ML Engineer:** 0.5 FTE
- **QA Engineer:** 0.5 FTE

### Інфраструктура
- **Current:** ~$200/month
- **After scaling:** ~$500-800/month (production)
- **ROI:** 10x throughput при 4x cost = 2.5x efficiency

---

## 🎯 Пріоритизація (MoSCoW)

### Must Have (Критично для production)
1. ✅ E2E Testing
2. ✅ Structured Logging
3. ✅ API Performance Optimization
4. ✅ Alertmanager Integration
5. ✅ RBAC Enforcement

### Should Have (Важливо для масштабу)
6. Data Contracts
7. Search Optimization
8. Horizontal Scaling (K8s HPA)
9. Distributed Tracing
10. Advanced Metrics

### Could Have (Nice to have)
11. GraphQL API
12. AutoML Pipeline
13. RLHF Trainer
14. CDN Integration

### Won't Have (Поки що)
15. Mobile Apps
16. Blockchain Integration
17. Quantum Computing features

---

## 📌 Висновок

**Поточний стан:** 90% готовності
**Після Phase 1-2:** 95% готовності
**Після Phase 1-4:** 98% готовності
**Після Phase 1-5:** 100% готовності (Production Excellence)

**Рекомендований підхід:**
1. Почати з **Phase 1** (тестування та надійність) - фундамент
2. Паралельно виконувати **Phase 2** (оптимізація) - швидкі wins
3. Потім **Phase 3-4** (масштабованість + observability)
4. **Phase 5** - continuous improvement

**Ключовий принцип:** Incremental improvements з вимірюваними метриками на кожному кроці.

---

**Автор:** Antigravity AI
**Дата:** 2026-01-11
**Версія:** 1.0
