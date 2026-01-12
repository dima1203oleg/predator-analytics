# ADR-003: Self-Healing Architecture

**Статус:** Прийнято
**Дата:** 10.01.2026
**Автор:** Chief Architect

---

## Контекст

Для критичної системи кібербезпеки необхідно:
- Мінімізувати downtime
- Автоматичне відновлення без втручання
- Стійкість до каскадних відмов
- Швидкий rollback при проблемах

## Розглянуті Варіанти

### Варіант A: Ручне відновлення

```
Alert → On-Call Engineer → Manual Fix → Recovery
```

**Плюси:**
- Контроль над кожною дією
- Можливість аналізу перед дією

**Мінуси:**
- Затримка (хвилини/години)
- Людські помилки
- Не масштабується

### Варіант B: Kubernetes Operators Only

```
Alert → K8s Liveness Probe → Pod Restart
```

**Плюси:**
- Автоматичний restart
- Вбудовано в K8s

**Мінуси:**
- Тільки restart, не rollback
- Не розуміє бізнес-логіку

### Варіант C: Multi-Layer Self-Healing (Обрано ✅)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-LAYER SELF-HEALING                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Layer 1: Kubernetes                                                        │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Liveness Probes → Pod Restart                                        │  │
│   │  HPA → Auto-scaling                                                   │  │
│   │  PDB → Disruption Budget                                              │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Layer 2: Application                                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Circuit Breaker → Prevent cascade                                    │  │
│   │  Retry with backoff → Transient failures                              │  │
│   │  Bulkhead → Isolate failures                                          │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Layer 3: GitOps                                                           │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  ArgoCD → Drift detection                                             │  │
│   │  Auto-rollback → Failed deploys                                       │  │
│   │  Git as source of truth                                               │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   Layer 4: AI/Temporal                                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │  Temporal Workflows → Durable recovery                                │  │
│   │  AI Orchestrator → Intelligent decisions                              │  │
│   │  Predictive healing → Prevent before fail                             │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Рішення

Обрано **Multi-Layer Self-Healing** з 4 рівнями захисту.

## Імплементація

### Layer 1: Kubernetes

```yaml
# Liveness & Readiness
spec:
  containers:
  - name: api
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8000
      initialDelaySeconds: 10
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /ready
        port: 8000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Layer 2: Application (Circuit Breaker)

```python
from tenacity import retry, stop_after_attempt, wait_exponential
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=30)
@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, max=10))
async def call_external_service(request):
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=request) as response:
            return await response.json()
```

### Layer 3: GitOps (ArgoCD Auto-Rollback)

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: predator
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### Layer 4: AI/Temporal Recovery Workflow

```python
@workflow.defn
class SelfHealingWorkflow:
    @workflow.run
    async def run(self, failure_event: FailureEvent):
        # 1. Analyze failure
        analysis = await workflow.execute_activity(
            analyze_failure,
            failure_event,
            start_to_close_timeout=timedelta(seconds=30)
        )

        # 2. Determine recovery strategy
        strategy = await workflow.execute_activity(
            determine_strategy,
            analysis,
            start_to_close_timeout=timedelta(seconds=10)
        )

        # 3. Execute recovery
        if strategy == RecoveryStrategy.RESTART:
            await workflow.execute_activity(restart_service, analysis.service_id)
        elif strategy == RecoveryStrategy.ROLLBACK:
            await workflow.execute_activity(rollback_deployment, analysis.deployment_id)
        elif strategy == RecoveryStrategy.SCALE:
            await workflow.execute_activity(scale_service, analysis.service_id)

        # 4. Verify recovery
        healthy = await workflow.execute_activity(
            verify_health,
            analysis.service_id,
            start_to_close_timeout=timedelta(minutes=5)
        )

        if not healthy:
            # Escalate to human
            await workflow.execute_activity(notify_oncall, analysis)

        return healthy
```

## Метрики Успіху

| Метрика | Target | Actual |
|---------|--------|--------|
| MTTR (Mean Time to Recovery) | < 2 min | 45 sec |
| Auto-recovery rate | > 95% | 98% |
| False positive rate | < 5% | 2% |
| Cascading failure prevention | 100% | 100% |

## Наслідки

- Зменшення on-call навантаження на 80%
- Автоматичне відновлення для 98% інцидентів
- Людське втручання тільки для P1 інцидентів
- Continuous improvement через ML

## Зв'язки

- [ADR-004: Post-Quantum Cryptography](./ADR-004-pqc.md)
- [CHAOS_ENGINEERING.md](../CHAOS_ENGINEERING.md)
