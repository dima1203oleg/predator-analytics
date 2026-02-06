# Component Utilization & Pipeline Integrity Engine (CU-PIE)
## Технічне Завдання на Розробку Модуля

**Мета:** Створити механізм автоматичної валідації компонентів Predator Analytics для точного визначення їхньої задіяності, виявлення надлишковості та перевірки архітектурної цілісності.

---

### 1. Концепція (Concept)
**CU-PIE** — це внутрішній аналітичний двигун платформи, який сканує всі шари системи (від CI/CD до LLM) та будує граф залежностей "Пайплайн → Етап → Компонент".
Він відповідає на питання:
1. Чи компонент реально задіяний?
2. Де саме він використовується?
3. Чи є мертві компоненти?
4. Чи є дублювання функціоналу?
5. Чи є архітектурні розриви ("дірки")?

---

### 2. Базова Модель Даних (Data Model)
Кожен компонент описується як строго типізований об'єкт.

```typescript
interface PredatorComponent {
  id: string;          // унікальний slug (напр. 'qdrant', 'argocd')
  category: string;    // 'cicd' | 'security' | 'observability' | ...
  layer: string;       // 'data' | 'model' | 'platform' ...
  roles: string[];     // ['vector_search', 'embedding_storage']
  required_for: string[]; // ['rag_pipeline']
  provides: string[];  // ['vector_index']
  depends_on?: string[];

  // ❗ КЛЮЧОВЕ ПОЛЕ: Доказ життя
  used_in: {
    pipelineId: string;
    stageId: string;
  }[];

  status: {
    declared: boolean; // Описаний в конфігу
    deployed: boolean; // Присутній в K8s
    used: boolean;     // used_in.length > 0
    health: 'healthy' | 'degraded' | 'offline';
  };
}
```

---

### 3. Класифікація Частин Системи (Scope of Truth)
Система розглядається як набір шарів. Кожен шар має свій набір перевірок.

#### 2.1 CI / CD / Delivery
**Компоненти:** GitHub, GitLab, Gitea, ArgoCD, Argo Rollouts, Tekton, Flux, Jenkins, Helm, OpenTofu, Terraform, Pulumi, Renovate, Dependabot.
**Критерії Перевірки:**
- Чи є активний delivery pipeline?
- Чи ArgoCD реально синхронізує кластер?
- Чи Rollouts реально використовуються, а не просто присутні?
- Чи Renovate / Dependabot генерують PR?

#### 2.2 Security
**Компоненти:** Keycloak, Vault, External Secrets, OPA, Gatekeeper, Kyverno, Falco, Trivy, Grype, Kubescape, Wazuh, CrowdSec, SOPS.
**Критерії Перевірки:**
- Чи всі сервіси аутентифікуються через Keycloak?
- Чи секрети реально йдуть з Vault / External Secrets?
- Чи Falco має активні правила?
- Чи Trivy / Grype реально сканують образи в CI?

#### 2.3 Observability
**Компоненти:** Prometheus, Thanos, VictoriaMetrics, Grafana, Loki, Tempo, Jaeger, Zipkin, OpenTelemetry, Alertmanager.
**Критерії Перевірки:**
- Чи кожен backend / ETL / LLM сервіс має metrics + traces?
- Чи є алерти не “на папері”, а активні?
- Чи немає компонентів без телеметрії?

#### 2.4 ETL / Data Processing
**Компоненти:** Airflow, Dagster, Prefect, Spark, Flink, dbt, Great Expectations, Soda.
**Критерії Перевірки:**
- Чи є реальні DAG-и?
- Чи вони виконуються?
- Чи валідація даних реально блокує пайплайн при помилках?

#### 2.5 Databases / Storage
**Компоненти:** PostgreSQL, TimescaleDB, Citus, pgvector, AGE, Neo4j, Redis, KeyDB, Valkey, ClickHouse, Druid, MinIO, OpenSearch.
**Критерії Перевірки:**
- Які БД реально читаються / пишуться?
- Чи немає БД “про запас”?
- Чи немає двох БД для однієї ролі без причини?

#### 2.6 Vector / LLM / AI
**Компоненти:** Qdrant, Milvus, FAISS, Weaviate, SentenceTransformers, BGE, CLIP, vLLM, TensorRT-LLM, Ollama, LLaMA, Mistral, LangChain, LangGraph, DSPy.
**Критерії Перевірки:**
- Який єдиний embedding-пайплайн?
- Яка єдина retrieval-логіка?
- Чи LLM реально викликаються через vLLM / TensorRT?
- Чи немає “зоопарку” без маршрутизації?

#### 2.7 Orchestration / Infrastructure
**Компоненти:** K3s, Kubernetes, Traefik, Istio, Linkerd, MetalLB, Cert-Manager, KEDA, Karpenter, Calico, Cilium.
**Критерії Перевірки:**
- Чи autoscaling реально працює?
- Чи service mesh використовується, а не просто встановлений?
- Чи TLS автоматизований, а не ручний?

---

### 4. Алгоритм Перевірки (Logic)

1.  **Крок 1. Зібрати фактичні пайплайни:**
    *   CI pipelines
    *   ETL DAG-и
    *   ML pipelines
    *   RAG / LLM workflows
2.  **Крок 2. Побудувати граф:**
    *   Pipeline → Stage → Component
3.  **Крок 3. Для кожного компонента визначити:**
    *   used = true / false
    *   critical / optional / experimental
    *   duplicate_of = component_id | null
4.  **Крок 4. Сформувати звіти:**
    *   ❌ Unused Components
    *   ⚠️ Declared but not wired
    *   🔁 Duplicated Roles
    *   🧱 Missing Mandatory Components
    *   ✅ Healthy Pipelines

---

### 5. Вимоги до Веб-Інтерфейсу (UI/UX)

#### Розділ «Компоненти»
**4.1 Індикатор використання:**
*   🟢 **Used in X pipelines** (АКТИВНИЙ В ПАЙПЛАЙНІ)
*   🟡 **Declared, not used** (ЗАДЕКЛАРОВАНИЙ, НЕ ЗАДІЯНИЙ)
*   🔴 **Required but missing** (КРИТИЧНА ВІДСУТНІСТЬ)

**4.2 Drill-down (При кліку):**
*   Список пайплайнів
*   Етапи
*   Залежності
*   Телеметрія

**4.3 Глобальний Dashboard:**
*   % задіяних компонентів
*   % мертвих
*   % критичних без покриття

---

### 6. Завдання для Antigravity Coder
Копіювати цей блок для виконання:

> **Task:** Implement the CU-PIE (Component Utilization & Pipeline Integrity Engine) backend logic based on the specification above.
> 1.  **Analyze** all system pipelines (CI/CD, ETL, ML).
> 2.  **Determine** actual usage of each component (~50 components listed).
> 3.  **Build** the "Pipeline → Component" graph.
> 4.  **Detect** dead, duplicated, and missing components.
> 5.  **Visualize** results in the Web UI.
> 6.  **Ensure** observability of the verification process itself.
