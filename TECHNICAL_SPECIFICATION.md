# 🛡️ Технічне Завдання v25.0: Система 'Predator Analytics'

> **Затверджено:** Головний Архітектор Системи 'Predator Analytics'
> **Дата:** 09.01.2026

---

## Зміст

1. [Вступ та Стратегічне Бачення](#1-вступ-та-стратегічне-бачення)
2. [Frontend Архітектура: "Predator Cockpit"](#2-frontend-архітектура-predator-cockpit)
3. [Backend Архітектура: Оркестрація та Потокова Обробка](#3-backend-архітектура-оркестрація-та-потокова-обробка)
4. [AI Core: Гібридний Пошук та Агенти](#4-ai-core-гібридний-пошук-та-агенти)
5. [Безпека: Постквантова Криптографія та RBAC](#5-безпека-постквантова-криптографія-та-rbac)
6. [Інфраструктура та Операції: GitOps](#6-інфраструктура-та-операції-gitops)
7. [Детальні Специфікації](#7-детальні-специфікації)
8. [Висновок](#8-висновок)

---

## 1. Вступ та Стратегічне Бачення

### 1.1. Концептуальна Парадигма

Система 'Predator Analytics' (надалі – Система) проектується як **високопродуктивна платформа наступного покоління** для аналізу даних, моніторингу загроз та автономного прийняття рішень. В умовах зростання обсягів телеметрії та ускладнення кіберзагроз, традиційні підходи до побудови моніторингових систем виявляються недостатніми.

Архітектура v25.0 базується на фундаментальному зсуві парадигми від статичних дашбордів до концепції **"City of Systems"** (Місто Систем). У цій метафорі інфраструктура розглядається як живий організм, де дані переміщуються різними типами "шляхів":
- **Високошвидкісні магістралі** (Apache Kafka) — для масового транзиту подій
- **Надійні міські дороги** (Temporal.io) — для гарантованої доставки складних бізнес-транзакцій

Критичним аспектом нової архітектури є впровадження **постквантової криптографії** (Post-Quantum Cryptography, PQC). З огляду на стратегію зловмисників "Harvest Now, Decrypt Later" (збирай зараз, розшифровуй пізніше), Система повинна вже сьогодні забезпечувати захист даних на рівні, стійкому до атак майбутніх квантових комп'ютерів, використовуючи стандарти NIST 2024 року, такі як **ML-KEM** та **ML-DSA**.

### 1.2. Цілі та Завдання

Основною метою створення 'Predator Analytics' є забезпечення **операційної переваги** шляхом інтеграції гетерогенних потоків даних у єдину семантичну картину ("Digital Twin" операційного середовища).

| Ціль | Опис та Метрики | Технологічне Забезпечення |
|------|-----------------|---------------------------|
| **Автономність** | Здатність системи самостійно виявляти та нейтралізувати аномалії без втручання людини | AI Agents (Reflective Loop), Auto-Remediation Operators |
| **Надійність** | Гарантоване виконання бізнес-процесів навіть у разі відмови компонентів інфраструктури | Temporal Durable Execution, Chaos Engineering |
| **Захищеність** | Стійкість до криптографічного зламу в епоху квантових обчислень | Гібридне шифрування (Kyber/Dilithium + ECC) |
| **Інтерактивність** | Миттєвий відгук інтерфейсу та підтримка просторової навігації на різних типах пристроїв | Next.js Streaming, React Three Fiber, Spatial Navigation |

---

## 2. Frontend Архітектура: "Predator Cockpit"

Підсистема Frontend, що отримала назву **"Predator Cockpit"**, є критичним інтерфейсом взаємодії людини та машини. Вона вимагає відходу від традиційних патернів клієнтського рендерингу (CSR) на користь гібридної моделі, що поєднує серверну логіку, стрімінг та високопродуктивну 3D-графіку.

### 2.1. Next.js App Router та Enterprise-архітектура

Основою "Predator Cockpit" обрано фреймворк **Next.js 14/15** з використанням архітектури **App Router**. Цей вибір обумовлений необхідністю фундаментальної зміни підходу до автентифікації та завантаження даних.

Використання **React Server Components (RSC)** дозволяє виконувати компоненти виключно на сервері, що усуває межу між серверним рендерингом та клієнтською гідрацією, значно зменшуючи розмір JavaScript-бандлу.

#### 2.1.1. Потокова Автентифікація та Продуктивність

Впровадження App Router вимагає переосмислення потоків автентифікації. Традиційні підходи, що блокують рендеринг до завершення перевірки сесії, є неприйнятними для системи реального часу. Натомість використовується патерн **Streaming Authentication**:
- Оболонка сторінки (page shell) завантажується миттєво
- Перевірки автентифікації виконуються паралельно через Suspense
- Покращення perceived performance на **30-40%**

Для оптимізації затримок автентифікації використовується стратегія розгортання логіки на **Edge Runtime**:
- Скорочення латентності на **25-50%** порівняно з Node.js runtime
- JWT-валідація за **8-10 мс**
- Сесії на базі Redis: час пошуку **5-20 мс** + можливість миттєвого відкликання токенів

#### 2.1.2. Доменно-орієнтована Структура Проекту

Структура проекту організована за принципом **Colocation**:

| Рівень | Директорія | Призначення |
|--------|------------|-------------|
| **App** | `/app/(dashboard)/layout.tsx` | Кореневий лейаут для авторизованої зони з паралельними маршрутами |
| **Features** | `/features/threat-map` | Ізольована логіка 3D-карти (компоненти, хуки, сервіси) |
| **Spatial** | `/components/spatial` | Компоненти навігації для TV/Console інтерфейсів |
| **Core** | `/lib/auth`, `/lib/temporal` | Спільні утиліти та клієнти для бекенд-сервісів |

Використання **Parallel Routes** та **Intercepting Routes** дозволяє реалізувати складні UI-патерни (модальні вікна без втрати контексту).

### 2.2. Інтерфейс Bento Grid: Модульність та Адаптивність

Візуальна мова "Predator Cockpit" базується на методології **Bento Grid** — модульні прямокутні секції різного розміру, що забезпечує візуальну ієрархію та адаптивність.

#### 2.2.1. Психологія Інтерфейсу

- Підвищення залученості користувачів на **40%**
- Зниження когнітивного навантаження
- Швидше сканування дашборду та ідентифікація аномалій

#### 2.2.2. Технічна Реалізація

```tsx
// Реалізація Bento Grid
import { motion, AnimatePresence } from 'framer-motion';
import GridLayout from 'react-grid-layout';

const BentoGrid = ({ children, layout }) => (
  <GridLayout
    layout={layout}
    cols={12}
    rowHeight={100}
    draggableHandle=".drag-handle"
  >
    {children.map((widget) => (
      <motion.div
        key={widget.id}
        layoutId={widget.id}
        className="bento-box"
      >
        {widget.content}
      </motion.div>
    ))}
  </GridLayout>
);
```

**Принципи ієрархії:**
- Найважливіші елементи (3D карта): блоки **2x2** або **3x2**
- Допоміжні метрики: блоки **1x1**

### 2.3. Високопродуктивна 3D Візуалізація (R3F)

Центральним елементом дашборду є інтерактивна 3D-модель операційного простору, реалізована за допомогою **React Three Fiber (R3F)**.

#### 2.3.1. Стратегії Оптимізації Рендерингу

| Техніка | Опис | Вплив |
|---------|------|-------|
| **Frameloop Demand** | Рендеринг лише при змінах | Економія GPU, батареї |
| **InstancedMesh** | Один draw call для тисяч об'єктів | FPS x10 |
| **Мемоізація** | `useMemo` для Vector3, Material | Менше GC-пауз |
| **LOD** | Зменшення геометрії віддалених об'єктів | Менше вершин |

```tsx
// On-Demand Rendering
<Canvas frameloop="demand">
  <Scene onUpdate={invalidate} />
</Canvas>

// InstancedMesh для маркерів загроз
const ThreatMarkers = ({ threats }) => {
  const meshRef = useRef();
  const tempMatrix = useMemo(() => new Matrix4(), []);

  useEffect(() => {
    threats.forEach((threat, i) => {
      tempMatrix.setPosition(threat.x, threat.y, threat.z);
      meshRef.current.setMatrixAt(i, tempMatrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [threats]);

  return (
    <instancedMesh ref={meshRef} args={[null, null, threats.length]}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshStandardMaterial color="red" />
    </instancedMesh>
  );
};
```

### 2.4. Просторова Навігація (Spatial Navigation)

Для підтримки TV/Console інтерфейсів інтегрується бібліотека **Norigin Spatial Navigation**.

```tsx
import { useFocusable, FocusContext } from '@noriginmedia/norigin-spatial-navigation';

const FocusableWidget = ({ onEnterPress, children }) => {
  const { ref, focused } = useFocusable({
    onEnterPress,
    onArrowPress: (direction) => {
      // Custom navigation logic
      return true; // Allow default navigation
    }
  });

  return (
    <div
      ref={ref}
      className={`widget ${focused ? 'focused' : ''}`}
    >
      {children}
    </div>
  );
};
```

**Підтримувані платформи:**
- Samsung Tizen
- LG WebOS
- Android TV
- Game Controllers

---

## 3. Backend Архітектура: Оркестрація та Потокова Обробка

Серверна частина 'Predator Analytics' гарантує обробку даних без втрат, дотримання транзакційної цілісності та масштабування під навантаженням.

### 3.1. Kafka vs. Temporal: Розділення Відповідальності

**Модель "City of Systems":**
- **Kafka** = Магістралі (Freeways) — високошвидкісний транспорт
- **Temporal** = Міські дороги (Local Roads) — надійна доставка

| Характеристика | Apache Kafka | Temporal.io |
|----------------|--------------|-------------|
| **Призначення** | Високошвидкісний буфер подій, згладжування піків | Виконання бізнес-логіки, управління станом, retry-політики |
| **Семантика** | At-least-once (можливі дублі) | Exactly-once (гарантована дедуплікація) |
| **Збереження стану** | Event Log з обмеженим часом | Повна історія виконання workflow |
| **Тип навантаження** | Throughput | Reliability |

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Sensors   │───▶│   Kafka     │───▶│  Temporal   │
│             │    │  (Buffer)   │    │  (Process)  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 3.2. Патерн Transactional Outbox та CDC

**Проблема:** Dual Write Problem (запис у БД + відправка події)

**Рішення:** Change Data Capture (CDC)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Service   │───▶│  Postgres   │───▶│   Sequin/   │
│             │    │  (Outbox)   │    │   Debezium  │
└─────────────┘    └─────────────┘    └──────┬──────┘
                                             │
                                             ▼
                                    ┌─────────────┐
                                    │  Temporal   │
                                    │  Workflow   │
                                    └─────────────┘
```

### 3.3. Durable Execution та Saga Pattern

**Оркестрована Saga через Temporal:**

```python
@workflow.defn
class ThreatResponseSaga:
    @workflow.run
    async def run(self, threat_id: str) -> dict:
        # Step 1: Аналіз загрози
        analysis = await workflow.execute_activity(
            analyze_threat,
            threat_id,
            start_to_close_timeout=timedelta(minutes=5)
        )

        try:
            # Step 2: Блокування IP
            await workflow.execute_activity(
                block_ip,
                analysis.attacker_ip,
                start_to_close_timeout=timedelta(seconds=30)
            )

            # Step 3: Сповіщення
            await workflow.execute_activity(
                notify_security_team,
                analysis,
                start_to_close_timeout=timedelta(seconds=10)
            )

        except Exception as e:
            # Компенсаційні дії
            await workflow.execute_activity(
                rollback_block,
                analysis.attacker_ip
            )
            raise

        return {"status": "mitigated", "threat_id": threat_id}
```

---

## 4. AI Core: Гібридний Пошук та Агенти

### 4.1. Векторна База Qdrant та Гібридний Пошук

#### 4.1.1. Dense vs. Sparse Vectors

| Тип | Модель | Переваги | Недоліки |
|-----|--------|----------|----------|
| **Dense** | all-MiniLM-L6-v2, OpenAI | Семантика | Пропускає точні терміни |
| **Sparse (SPLADE)** | SPLADE-v2 | Term expansion, точність | Більший розмір |

**SPLADE** (Sparse Lexical and Expansion Model):
- MRR: **0.368** (vs BM25: 0.184)
- Автоматичне розширення термінів

#### 4.1.2. Reciprocal Rank Fusion (RRF)

```python
def reciprocal_rank_fusion(dense_results, sparse_results, k=60):
    """Об'єднання результатів гібридного пошуку"""
    fused_scores = {}

    for rank, doc in enumerate(dense_results):
        fused_scores[doc.id] = fused_scores.get(doc.id, 0) + 1 / (k + rank + 1)

    for rank, doc in enumerate(sparse_results):
        fused_scores[doc.id] = fused_scores.get(doc.id, 0) + 1 / (k + rank + 1)

    return sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
```

### 4.2. Архітектура Агентів: Reflective Loop

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Writer    │───▶│   Critic    │───▶│  Refiner    │
│   Agent     │    │   Agent     │    │   Agent     │
└─────────────┘    └─────────────┘    └──────┬──────┘
       ▲                                      │
       └──────────────────────────────────────┘
                    (Iterate until quality threshold)
```

```python
class ReflectiveLoop:
    def __init__(self, llm_client):
        self.writer = WriterAgent(llm_client)
        self.critic = CriticAgent(llm_client)
        self.refiner = RefinerAgent(llm_client)

    async def generate(self, prompt: str, max_iterations: int = 3) -> str:
        draft = await self.writer.write(prompt)

        for i in range(max_iterations):
            critique = await self.critic.analyze(draft)

            if critique.quality_score >= 0.9:
                break

            draft = await self.refiner.improve(draft, critique)

        return draft
```

### 4.3. Шлюз LiteLLM та Failover

```yaml
# litellm_config.yaml
model_list:
  - model_name: main-agent
    litellm_params:
      model: anthropic/claude-3-5-sonnet
      api_key: os.environ/ANTHROPIC_KEY

  - model_name: backup-agent
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_KEY

  - model_name: fast-agent
    litellm_params:
      model: groq/llama-3.1-70b-versatile
      api_key: os.environ/GROQ_KEY

router_settings:
  routing_strategy: latency-based
  redis_cache_enabled: true
  fallbacks:
    - main-agent: [backup-agent, fast-agent]
```

---

## 5. Безпека: Постквантова Криптографія та RBAC

### 5.1. Постквантова Криптографія (PQC)

#### 5.1.1. Стандарти NIST 2024

| Стандарт | Алгоритм | Призначення |
|----------|----------|-------------|
| **FIPS 203** | ML-KEM (Kyber) | Key Encapsulation для TLS 1.3 |
| **FIPS 204** | ML-DSA (Dilithium) | Цифрові підписи документів |
| **FIPS 205** | SLH-DSA (Sphincs+) | Резервний підпис (hash-based) |

#### 5.1.2. Гібридне Впровадження

```python
from oqs import KeyEncapsulation, Signature

class HybridCrypto:
    def __init__(self):
        self.classical = ECDH_X25519()
        self.pqc = KeyEncapsulation("Kyber768")

    def key_exchange(self, peer_public_key):
        # Класичний обмін
        classical_secret = self.classical.exchange(peer_public_key.classical)

        # Постквантовий обмін
        pqc_ciphertext, pqc_secret = self.pqc.encap(peer_public_key.pqc)

        # Комбінований ключ
        combined_secret = HKDF(
            classical_secret + pqc_secret,
            salt=b"predator-hybrid-v25"
        )

        return combined_secret, pqc_ciphertext
```

### 5.2. Role-Based Access Control (RBAC)

**Ієрархічні ролі в Keycloak:**

```
Commander ─────┐
               │
    ┌──────────▼──────────┐
    │      Operator       │
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │      Explorer       │
    └─────────────────────┘
```

**Fine-Grained Authorization:**

```json
{
  "policies": [
    {
      "name": "classified-data-policy",
      "type": "aggregate",
      "logic": "AFFIRMATIVE",
      "policies": ["role:commander", "context:secure-location", "time:business-hours"]
    }
  ]
}
```

---

## 6. Інфраструктура та Операції: GitOps

### 6.1. ArgoCD та Самовиліковування

```yaml
# argocd/application.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator-analytics
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
      prune: true      # Видалення зайвих ресурсів
      selfHeal: true   # Автоматичне відновлення
    syncOptions:
      - CreateNamespace=true
```

### 6.2. Python Operators та Auto-Remediation

```python
import kopf

@kopf.on.event('v1', 'pods', labels={'app': 'predator-ai'})
def auto_remediate(event, logger, **kwargs):
    pod = event['object']

    # Перевірка OOMKilled
    for status in pod.get('status', {}).get('containerStatuses', []):
        if status.get('lastState', {}).get('terminated', {}).get('reason') == 'OOMKilled':
            logger.warning(f"Pod {pod['metadata']['name']} was OOMKilled")

            # Автоматичне збільшення ліміту пам'яті
            current_limit = parse_memory(status['resources']['limits']['memory'])
            new_limit = current_limit * 1.5

            # Створення PR з оновленою конфігурацією
            create_remediation_pr(
                deployment=pod['metadata']['labels']['deployment'],
                new_memory_limit=format_memory(new_limit)
            )
```

### 6.3. Chaos Engineering

```yaml
# chaos/pod-failure.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: predator-pod-failure
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - predator
    labelSelectors:
      app: predator-backend
  scheduler:
    cron: "@every 4h"
```

---

## 7. Детальні Специфікації

### 7.1. Temporal Workflow Specification

```yaml
Workflow:
  ID_Reuse_Policy: REJECT_DUPLICATE
  Retry_Policy:
    Initial_Interval: 1s
    Backoff_Coefficient: 2.0
    Maximum_Interval: 1h
    Maximum_Attempts: Unlimited  # Для критичних процесів
  Task_Queue: HIGH_PRIORITY_ANALYSIS
```

### 7.2. LiteLLM Config

```yaml
model_list:
  - model_name: main-agent
    litellm_params:
      model: anthropic/claude-3-5-sonnet
      api_key: os.environ/ANTHROPIC_KEY
  - model_name: backup-agent
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_KEY

router_settings:
  routing_strategy: latency-based
  redis_cache_enabled: true
```

### 7.3. Qdrant Collection Schema

```python
from qdrant_client import models

collection_config = models.VectorParams(
    size=384,  # all-MiniLM-L6-v2
    distance=models.Distance.COSINE,
    on_disk=True
)

sparse_config = models.SparseVectorParams(
    index=models.SparseIndexParams(
        on_disk=True
    )
)
```

---

## 8. Висновок

Технічне Завдання v25.0 визначає архітектуру системи 'Predator Analytics', яка поєднує в собі передові досягнення в галузі:

- **Розподілених систем** — Temporal забезпечує незламність бізнес-логіки
- **Користувацького досвіду** — Next.js App Router з R3F створює безпрецедентний UX
- **Кібербезпеки** — Постквантова криптографія гарантує захист на десятиліття вперед

**Ця система готова до викликів сучасного цифрового поля бою.**

---

*© 2026 Predator Analytics. Усі права захищено.*
