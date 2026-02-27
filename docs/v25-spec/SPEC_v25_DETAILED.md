# 🦾 Технічне Завдання v45.0: Система 'Predator Analytics'

> **Версія документа:** 2.0 (Детальна Специфікація)
> **Дата створення:** 10.01.2026
> **Статус:** Затверджено Головним Архітектором
> **Класифікація:** Внутрішній документ

---

## Зміст

1. [Вступ та Стратегічне Бачення](#1-вступ-та-стратегічне-бачення)
2. [Frontend: Predator Cockpit](#2-frontend-predator-cockpit)
3. [Backend: Оркестрація та Потокова Обробка](#3-backend-оркестрація-та-потокова-обробка)
4. [AI Core: Гібридний Пошук та Агенти](#4-ai-core-гібридний-пошук-та-агенти)
5. [Безпека: PQC та RBAC](#5-безпека-pqc-та-rbac)
6. [Інфраструктура: GitOps](#6-інфраструктура-gitops)
7. [Детальні Специфікації](#7-детальні-специфікації)

---

## 1. Вступ та Стратегічне Бачення

### 1.1. Концептуальна Парадигма: "City of Systems"

Система **'Predator Analytics'** проектується як високопродуктивна платформа наступного покоління для аналізу даних, моніторингу загроз та **автономного прийняття рішень**.

Архітектура v45.0 базується на фундаментальному зсуві парадигми від статичних дашбордів до концепції **"City of Systems"** (Місто Систем):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CITY OF SYSTEMS METAPHOR                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   🏙️ ІНФРАСТРУКТУРА = ЖИВИЙ ОРГАНІЗМ                                        │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                     ТРАНСПОРТНА СИСТЕМА                                │ │
│   │                                                                        │ │
│   │   🛣️ МАГІСТРАЛІ (Freeways)         🚗 МІСЬКІ ДОРОГИ (Local Roads)     │ │
│   │   ════════════════════           ─────────────────────                │ │
│   │                                                                        │ │
│   │   Apache Kafka                    Temporal.io                          │ │
│   │   • Високошвидкісний транзит     • Гарантована доставка               │ │
│   │   • Масовий потік подій          • Складні бізнес-транзакції          │ │
│   │   • At-least-once семантика      • Exactly-once семантика             │ │
│   │   • Throughput-орієнтований      • Reliability-орієнтований           │ │
│   │                                                                        │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2. Постквантова Криптографія (PQC)

Критичним аспектом нової архітектури є впровадження **Post-Quantum Cryptography (PQC)**:

> **Загроза:** Стратегія зловмисників "Harvest Now, Decrypt Later" — збирай зараз, розшифровуй пізніше, коли з'являться квантові комп'ютери.

| Стандарт NIST 2024 | Алгоритм | Призначення |
|-------------------|----------|-------------|
| **FIPS 203** | ML-KEM (Kyber) | Key Encapsulation — захист каналів TLS 1.3 |
| **FIPS 204** | ML-DSA (Dilithium) | Digital Signatures — підпис документів/коду |
| **FIPS 205** | SLH-DSA (Sphincs+) | Backup Signatures — резервний підпис (hash-based) |

### 1.3. Цілі та Метрики

| Ціль | Опис | Метрика | Технологія |
|------|------|---------|------------|
| **Автономність** | Самостійне виявлення та нейтралізація аномалій | MTTR < 30s | AI Agents (Reflective Loop) |
| **Надійність** | Гарантоване виконання навіть при відмові компонентів | 99.99% uptime | Temporal Durable Execution |
| **Захищеність** | Стійкість до квантового зламу | PQC-ready | ML-KEM + ML-DSA + ECC |
| **Інтерактивність** | Миттєвий відгук, просторова навігація | P99 < 100ms | Next.js Streaming, R3F |

---

## 2. Frontend: Predator Cockpit

### 2.1. Next.js App Router та Enterprise-архітектура

#### 2.1.1. Потокова Автентифікація (Streaming Authentication)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     STREAMING AUTHENTICATION FLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌───────────────┐    ┌───────────────┐                   │
│   │  Client  │───▶│  Page Shell   │───▶│   Suspense    │                   │
│   │ Request  │    │  (Миттєво)    │    │   Boundary    │                   │
│   └──────────┘    └───────────────┘    └───────┬───────┘                   │
│                                                │                            │
│                          ┌─────────────────────┴─────────────────────┐     │
│                          │                                           │     │
│                          ▼                                           ▼     │
│                   ┌─────────────┐                          ┌─────────────┐ │
│                   │  Auth Check │                          │    Main     │ │
│                   │ (паралельно)│                          │   Content   │ │
│                   │             │                          │  (стрімінг) │ │
│                   │  Redis: 5ms │                          │             │ │
│                   └─────────────┘                          └─────────────┘ │
│                                                                              │
│   Performance Improvement: +30-40% perceived performance                     │
│   Edge Runtime Latency: -25-50% vs Node.js                                  │
│   Redis Session Lookup: 5-20ms (vs JWT 8-10ms, але з instant revocation)    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2. Доменно-орієнтована Структура

```
apps/predator-cockpit/
├── app/
│   ├── (dashboard)/           # Authenticated zone
│   │   ├── layout.tsx         # Parallel routes layout
│   │   ├── @modal/            # Intercepting routes for modals
│   │   └── threat-map/
│   │       └── page.tsx
│   └── api/
├── features/
│   ├── threat-map/            # Feature-specific code
│   │   ├── components/
│   │   ├── hooks/
│   │   └── services/
│   └── agents/
├── components/
│   ├── spatial/               # TV/Console navigation
│   └── bento/                 # Bento Grid widgets
└── lib/
    ├── auth/                  # Auth utilities
    └── temporal/              # Temporal client
```

### 2.2. Bento Grid: Модульність та Адаптивність

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BENTO GRID LAYOUT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│   │                                 │  │              │  │              │  │
│   │         3D THREAT MAP           │  │   METRICS    │  │    ALERTS    │  │
│   │            (3x2)                │  │    (1x1)     │  │    (1x1)     │  │
│   │                                 │  │              │  │              │  │
│   │      React Three Fiber          │  └──────────────┘  └──────────────┘  │
│   │      frameloop="demand"         │                                       │
│   │                                 │  ┌──────────────┐  ┌──────────────┐  │
│   └─────────────────────────────────┘  │              │  │              │  │
│                                        │  AI AGENTS   │  │  TIMELINE    │  │
│   ┌─────────────────────────────────┐  │    (1x1)     │  │    (1x1)     │  │
│   │                                 │  │              │  │              │  │
│   │       ETL PIPELINE STATUS       │  └──────────────┘  └──────────────┘  │
│   │            (2x1)                │                                       │
│   │                                 │                                       │
│   └─────────────────────────────────┘                                       │
│                                                                              │
│   Tech: CSS Grid + react-grid-layout + framer-motion (layout animations)    │
│   Effect: +40% user engagement, reduced cognitive load                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3. React Three Fiber (R3F) Оптимізації

```typescript
// Стратегії оптимізації 3D рендерингу

// 1. On-Demand Rendering (frameloop="demand")
<Canvas frameloop="demand">
  <Scene onUpdate={() => invalidate()} />
</Canvas>

// 2. Instanced Mesh для тисяч об'єктів
// Замість 10,000 draw calls → 1 draw call
<instancedMesh ref={meshRef} args={[geometry, material, 10000]}>
  <sphereGeometry args={[0.1, 16, 16]} />
  <meshStandardMaterial />
</instancedMesh>

// 3. Level of Detail (LOD)
import { Detailed } from '@react-three/drei'

<Detailed distances={[0, 50, 100]}>
  <HighDetailModel />   {/* < 50 units */}
  <MediumDetailModel /> {/* 50-100 units */}
  <LowDetailModel />    {/* > 100 units */}
</Detailed>

// 4. Memory Management
// ❌ Погано: створення в render
const vec = new THREE.Vector3(x, y, z)

// ✅ Добре: мемоізація
const vec = useMemo(() => new THREE.Vector3(x, y, z), [x, y, z])
```

### 2.4. Spatial Navigation для TV/Console

```typescript
// Norigin Spatial Navigation для Samsung Tizen, LG WebOS, Android TV
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation'

const ThreatCard = ({ threat }) => {
  const { ref, focused, focusSelf } = useFocusable({
    onEnterPress: () => openThreatDetails(threat.id),
    onArrowPress: (direction) => handleNavigation(direction)
  })

  return (
    <FocusContext.Provider value={focusKey}>
      <div
        ref={ref}
        className={`threat-card ${focused ? 'focused' : ''}`}
      >
        {threat.name}
      </div>
    </FocusContext.Provider>
  )
}
```

---

## 3. Backend: Оркестрація та Потокова Обробка

### 3.1. Kafka vs Temporal: Розділення Відповідальності

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    KAFKA + TEMPORAL INTEGRATION                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Характеристика       │  Apache Kafka          │  Temporal.io              │
│   ─────────────────────┼────────────────────────┼─────────────────────────  │
│   Метафора             │  🛣️ Магістралі         │  🚗 Міські дороги         │
│   Призначення          │  Буфер подій           │  Бізнес-логіка            │
│   Семантика            │  At-least-once         │  Exactly-once             │
│   Збереження стану     │  Event Log (TTL)       │  Full History             │
│   Оптимізація          │  Throughput            │  Reliability              │
│                                                                              │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                        FLOW DIAGRAM                                   │ │
│   │                                                                       │ │
│   │   Sensors ──▶ Kafka Topics ──▶ Temporal Workers ──▶ Business Logic   │ │
│   │                    │                   │                              │ │
│   │                    │                   │                              │ │
│   │              High Volume        Deduplication via                     │ │
│   │              Buffering         WORKFLOW_ID_REUSE_POLICY               │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Transactional Outbox + CDC Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   TRANSACTIONAL OUTBOX PATTERN                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ❌ DUAL WRITE PROBLEM (Неправильно):                                       │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │   Service ──┬──▶ Write to Users table                               │   │
│   │             │                                                        │   │
│   │             └──▶ Start Temporal Workflow ← Може впасти!              │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ✅ OUTBOX PATTERN (Правильно):                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   ┌─────────┐    ┌──────────────────────────────┐                   │   │
│   │   │ Service │───▶│  SINGLE TRANSACTION           │                   │   │
│   │   └─────────┘    │  ├── INSERT INTO users        │                   │   │
│   │                  │  └── INSERT INTO outbox_events│                   │   │
│   │                  └──────────────────┬────────────┘                   │   │
│   │                                     │                                │   │
│   │                                     ▼                                │   │
│   │                  ┌──────────────────────────────┐                   │   │
│   │                  │  CDC (Debezium/Sequin)       │                   │   │
│   │                  │  Моніторить Postgres WAL     │                   │   │
│   │                  └──────────────────┬───────────┘                   │   │
│   │                                     │                                │   │
│   │                                     ▼                                │   │
│   │                  ┌──────────────────────────────┐                   │   │
│   │                  │  Temporal Workflow           │                   │   │
│   │                  │  (Гарантовано запуститься)   │                   │   │
│   │                  └──────────────────────────────┘                   │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3. Durable Execution: Saga Pattern

```python
# Temporal Orchestrated Saga
from temporalio import workflow, activity
from datetime import timedelta

@workflow.defn
class ThreatResponseSaga:
    """
    Distributed Transaction:
    1. Analyze Threat
    2. Block IP
    3. Notify Personnel

    With automatic compensation (rollback) on failure.
    """

    @workflow.run
    async def run(self, threat_id: str) -> dict:
        # Step 1: Analysis
        analysis = await workflow.execute_activity(
            analyze_threat,
            threat_id,
            start_to_close_timeout=timedelta(minutes=5),
        )

        try:
            # Step 2: Block
            block_result = await workflow.execute_activity(
                block_malicious_ip,
                analysis.ip_address,
                start_to_close_timeout=timedelta(seconds=30),
            )

            # Step 3: Notify
            await workflow.execute_activity(
                notify_soc_team,
                {"threat": analysis, "action": block_result},
                start_to_close_timeout=timedelta(seconds=10),
            )

        except Exception as e:
            # Compensation: Rollback blocking
            await workflow.execute_activity(
                unblock_ip,
                analysis.ip_address,
            )
            raise

        return {"status": "mitigated", "threat_id": threat_id}
```

---

## 4. AI Core: Гібридний Пошук та Агенти

### 4.1. Qdrant Hybrid Search: Dense + Sparse Vectors

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         HYBRID SEARCH ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Query: "знайди зловмисне ПЗ з кодом 0x80040154"                           │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    DUAL VECTOR SEARCH                                │   │
│   │                                                                      │   │
│   │   ┌───────────────────────┐    ┌───────────────────────┐            │   │
│   │   │    DENSE VECTORS      │    │    SPARSE VECTORS     │            │   │
│   │   │    (Semantic)         │    │    (Lexical)          │            │   │
│   │   ├───────────────────────┤    ├───────────────────────┤            │   │
│   │   │ Model: all-MiniLM-L6  │    │ Algorithm: SPLADE     │            │   │
│   │   │ Dim: 384              │    │ (NOT BM25!)           │            │   │
│   │   │                       │    │                       │            │   │
│   │   │ ✅ "зловмисне ПЗ"     │    │ ✅ "0x80040154"       │            │   │
│   │   │    = "вірус"          │    │    (точний match)     │            │   │
│   │   │    = "malware"        │    │                       │            │   │
│   │   │                       │    │ + Term Expansion      │            │   │
│   │   │ ❌ Код помилки        │    │   (нейромережа додає  │            │   │
│   │   │    пропускається      │    │    релевантні терміни)│            │   │
│   │   └───────────┬───────────┘    └───────────┬───────────┘            │   │
│   │               │                            │                        │   │
│   │               │   ┌────────────────────┐   │                        │   │
│   │               └──▶│ Reciprocal Rank    │◀──┘                        │   │
│   │                   │ Fusion (RRF)       │                            │   │
│   │                   │                    │                            │   │
│   │                   │ MRR: 0.368         │                            │   │
│   │                   │ (vs BM25: 0.184)   │                            │   │
│   │                   └─────────┬──────────┘                            │   │
│   │                             │                                        │   │
│   │                             ▼                                        │   │
│   │                   ┌────────────────────┐                            │   │
│   │                   │  Combined Results  │                            │   │
│   │                   └────────────────────┘                            │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```python
# Qdrant Hybrid Search Implementation
from qdrant_client import models

async def hybrid_search(query: str, limit: int = 10):
    # 1. Generate embeddings
    dense_vector = await embed_dense(query)    # all-MiniLM-L6-v2
    sparse_vector = await embed_sparse(query)  # SPLADE

    # 2. Hybrid query with RRF fusion
    results = await qdrant.query_points(
        collection_name="threat_intelligence",
        query=models.FusionQuery(
            fusion=models.Fusion.RRF,  # Reciprocal Rank Fusion
            prefetch=[
                models.Prefetch(
                    query=dense_vector,
                    using="dense",
                    limit=20,
                ),
                models.Prefetch(
                    query=models.SparseVector(**sparse_vector),
                    using="sparse",
                    limit=20,
                ),
            ],
        ),
        limit=limit,
    )

    return results.points
```

### 4.2. Reflective Loop: Writer → Critic → Refiner

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REFLECTIVE LOOP PATTERN                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   На відміну від простого ланцюжка промптів, цей підхід                     │
│   імітує людський процес самокорекції.                                      │
│                                                                              │
│                      ┌─────────────────────────────────────┐                │
│                      │                                     │                │
│                      ▼                                     │                │
│   ┌─────────────────────────────────────────────────────┐ │                │
│   │                                                      │ │                │
│   │   ┌──────────────┐    ┌──────────────┐    ┌────────┴─┴──┐            │
│   │   │              │    │              │    │              │            │
│   │   │    WRITER    │───▶│    CRITIC    │───▶│   REFINER    │            │
│   │   │    Agent     │    │    Agent     │    │    Agent     │            │
│   │   │              │    │              │    │              │            │
│   │   │  Генерує     │    │  Шукає:      │    │  Покращує    │            │
│   │   │  чернетку    │    │  • Помилки   │    │  на основі   │            │
│   │   │  аналізу     │    │  • Галюцинації│   │  критики     │            │
│   │   │              │    │  • Прогалини │    │              │            │
│   │   └──────────────┘    └──────────────┘    └──────────────┘            │
│   │                                                                      │
│   │         Цикл повторюється до quality_score >= 0.9                    │
│   │                                                                      │
│   └─────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│   Результат: Значно точніші та безпечніші звіти                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3. LiteLLM Gateway з Failover

```yaml
# configs/litellm_config.yaml
model_list:
  - model_name: main-agent
    litellm_params:
      model: anthropic/claude-3-5-sonnet
      api_key: os.environ/ANTHROPIC_KEY
      max_tokens: 8192

  - model_name: backup-agent
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_KEY
      max_tokens: 4096

  - model_name: aws-backup
    litellm_params:
      model: bedrock/anthropic.claude-3-sonnet
      aws_region_name: us-east-1

router_settings:
  routing_strategy: latency-based  # Направляє до найшвидшого
  redis_cache_enabled: true        # Кешування для економії
  fallbacks:
    - main-agent: [backup-agent, aws-backup]  # Каскадний failover

general_settings:
  master_key: os.environ/LITELLM_MASTER_KEY
  database_url: os.environ/LITELLM_DATABASE_URL
```

---

## 5. Безпека: PQC та RBAC

### 5.1. Post-Quantum Cryptography Implementation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   HYBRID PQC IMPLEMENTATION                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ГІБРИДНИЙ РЕЖИМ: Подвійний захист                                         │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   ┌─────────────────────────┐    ┌─────────────────────────┐        │   │
│   │   │   CLASSIC CRYPTO        │ +  │   POST-QUANTUM CRYPTO   │        │   │
│   │   ├─────────────────────────┤    ├─────────────────────────┤        │   │
│   │   │   ECDH X25519           │    │   ML-KEM (Kyber-768)    │        │   │
│   │   │   Key Exchange          │    │   Key Encapsulation     │        │   │
│   │   └─────────────┬───────────┘    └─────────────┬───────────┘        │   │
│   │                 │                              │                     │   │
│   │                 └──────────────┬───────────────┘                     │   │
│   │                                │                                     │   │
│   │                                ▼                                     │   │
│   │                 ┌──────────────────────────────┐                    │   │
│   │                 │   Combined Shared Secret     │                    │   │
│   │                 │   (обидва повинні працювати) │                    │   │
│   │                 └──────────────────────────────┘                    │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Захист: Класичні атаки сьогодні + Квантові атаки завтра                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

```python
# PQC Implementation with liboqs-python
import oqs

def hybrid_key_exchange():
    # 1. Classical component (X25519)
    classic_keypair = generate_x25519_keypair()

    # 2. Post-Quantum component (ML-KEM / Kyber)
    kem = oqs.KeyEncapsulation("Kyber768")
    pq_public_key = kem.generate_keypair()

    # 3. Return hybrid public keys
    return {
        "classic_public": classic_keypair.public,
        "pqc_public": pq_public_key,
    }

def hybrid_sign(message: bytes) -> bytes:
    # ML-DSA (Dilithium) for signatures
    sig = oqs.Signature("Dilithium3")
    sig.generate_keypair()
    return sig.sign(message)
```

### 5.2. Keycloak RBAC з Composite Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    HIERARCHICAL RBAC STRUCTURE                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                                                                      │   │
│   │   COMMANDER                                                          │   │
│   │   └── OPERATOR (включено)                                            │   │
│   │       └── EXPLORER (включено)                                        │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   Role          │ Permissions                                               │
│   ──────────────┼────────────────────────────────────────────────────────   │
│   EXPLORER      │ read:threats, read:logs, view:dashboard                  │
│   OPERATOR      │ + manage:agents, execute:actions, write:reports          │
│   COMMANDER     │ + admin:system, configure:rules, access:classified       │
│   ARCHITECT     │ + infrastructure:full, deploy:services, audit:all        │
│                                                                              │
│   Fine-Grained Authorization:                                               │
│   • Час доби (тільки в робочий час)                                         │
│   • IP-адреса (тільки з корпоративної мережі)                               │
│   • Атрибути користувача (відділ, рівень допуску)                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Інфраструктура: GitOps

### 6.1. ArgoCD Self-Healing

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-analytics
  namespace: argocd
spec:
  project: default

  source:
    repoURL: https://github.com/org/predator-21
    targetRevision: main
    path: helm/predator

  destination:
    server: https://kubernetes.default.svc
    namespace: predator

  syncPolicy:
    automated:
      prune: true        # Видалення orphan ресурсів
      selfHeal: true     # Автоматичне відновлення при drift
      allowEmpty: false

    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground

    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### 6.2. Python Operator для Auto-Remediation

```python
# operators/remediation_operator.py
import kopf
import kubernetes

@kopf.on.field('', 'v1', 'pods', field='status.containerStatuses')
async def auto_remediate_oom(
    name: str,
    namespace: str,
    status: dict,
    **kwargs
):
    """
    Автоматичне збільшення пам'яті при OOMKilled.
    Створює PR в інфраструктурний репозиторій (GitOps).
    """
    for container in status.get('containerStatuses', []):
        terminated = container.get('lastState', {}).get('terminated', {})

        if terminated.get('reason') == 'OOMKilled':
            logger.warning(f"Pod {name} OOMKilled, initiating remediation")

            # 1. Calculate new limit (+50%)
            current_limit = get_current_memory_limit(namespace, name)
            new_limit = int(current_limit * 1.5)

            # 2. Create PR via GitHub API (GitOps)
            await create_memory_increase_pr(
                namespace=namespace,
                deployment=get_deployment_name(name),
                new_limit=f"{new_limit}Mi",
                reason="Auto-remediation: OOMKilled detected"
            )

            # 3. Optionally: Immediate fix (will be overwritten by ArgoCD)
            # patch_deployment_memory(namespace, name, new_limit)
```

### 6.3. Chaos Engineering Schedule

```yaml
# chaos-mesh/scheduled-experiments.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: Schedule
metadata:
  name: daily-resilience-test
  namespace: chaos-testing
spec:
  schedule: "@daily"
  type: PodChaos
  podChaos:
    action: pod-kill
    mode: one
    selector:
      namespaces:
        - predator
      labelSelectors:
        app: predator-backend

---
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: weekly-network-test
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - predator
  delay:
    latency: "200ms"
    jitter: "50ms"
  duration: "10m"
  scheduler:
    cron: "@weekly"
```

---

## 7. Детальні Специфікації

### 7.1. Temporal Workflow Specification

```yaml
Workflow:
  ID_Reuse_Policy: REJECT_DUPLICATE  # Дедуплікація

  Retry_Policy:
    Initial_Interval: 1s
    Backoff_Coefficient: 2.0
    Maximum_Interval: 1h
    Maximum_Attempts: unlimited  # Для критичних процесів

  Task_Queue: HIGH_PRIORITY_ANALYSIS

  Timeouts:
    Workflow_Execution: 24h
    Workflow_Run: 1h
    Task_Start_To_Close: 10m
```

### 7.2. Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Frontend** | Next.js | 15+ | App Router, RSC, Streaming |
| | React | 19+ | UI Framework |
| | React Three Fiber | 9+ | 3D Visualization |
| | Framer Motion | 11+ | Animations |
| | TailwindCSS | 4+ | Styling |
| | Zustand | 5+ | State Management |
| **Backend** | FastAPI | 0.115+ | REST API |
| | Temporal | 1.2+ | Durable Execution |
| | Celery | 5.4+ | Background Tasks |
| | SQLAlchemy | 2.0+ | ORM |
| **AI/ML** | LiteLLM | 1.50+ | LLM Gateway |
| | Qdrant | 1.12+ | Vector DB |
| | SPLADE | latest | Sparse Embeddings |
| **Data** | PostgreSQL | 16+ | Primary DB |
| | Redis | 7+ | Cache/Broker |
| | Kafka | 3.7+ | Event Streaming |
| **Security** | liboqs | 0.10+ | PQC (ML-KEM, ML-DSA) |
| | Keycloak | 25+ | RBAC/SSO |
| **DevOps** | Kubernetes | 1.30+ | Orchestration |
| | ArgoCD | 2.12+ | GitOps |
| | Chaos Mesh | 2.7+ | Chaos Engineering |

---

## 8. Висновок

Технічне Завдання v45.0 визначає архітектуру системи **'Predator Analytics'**, яка поєднує:

- ✅ **Temporal Durable Execution** — незламна бізнес-логіка
- ✅ **Next.js App Router + R3F** — безпрецедентний UX
- ✅ **Qdrant Hybrid Search (SPLADE + RRF)** — найкращий пошук
- ✅ **Reflective Loop Agents** — самовдосконалення AI
- ✅ **Post-Quantum Cryptography** — захист на десятиліття вперед
- ✅ **GitOps + Self-Healing** — автономна інфраструктура

> **Ця система готова до викликів сучасного цифрового поля бою.**

---

**Затверджено:** Головний Архітектор Системи 'Predator Analytics'
**Дата:** 10.01.2026

---

*© 2026 Predator Analytics. Усі права захищено.*
