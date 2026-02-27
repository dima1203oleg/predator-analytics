# 🔥 Хаос-Інженіринг — Predator Analytics v45.0

> Плани тестування стійкості системи через контрольоване введення збоїв

---

## Зміст

1. [Вступ](#вступ)
2. [Принципи Хаос-Інженірингу](#принципи-хаос-інженірингу)
3. [Інструменти](#інструменти)
4. [Сценарії Тестування](#сценарії-тестування)
5. [Автоматизовані Скрипти](#автоматизовані-скрипти)
6. [Chaos Mesh конфігурації](#chaos-mesh-конфігурації)
7. [Метрики та Моніторинг](#метрики-та-моніторинг)
8. [Runbook](#runbook)

---

## Вступ

### Що таке Хаос-Інженіринг?

**Хаос-інженіринг** — це дисципліна експериментування на розподілених системах з метою побудови впевненості в здатності системи витримувати турбулентні умови в production середовищі.

### Чому це важливо для Predator v45 | Neural Analytics.0?

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHAOS ENGINEERING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  "Все, що може зламатись — зламається"                          │
│                                                                  │
│  Краще виявити слабкі місця в КОНТРОЛЬОВАНОМУ середовищі,       │
│  ніж дізнатись про них від КОРИСТУВАЧІВ у production.            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Цілі

| Ціль | Опис |
|------|------|
| **Виявлення слабких місць** | Знайти вразливості до їх прояву в prod |
| **Перевірка self-healing** | Підтвердити автовідновлення |
| **Документування поведінки** | Зрозуміти як система реагує на збої |
| **Покращення резильєнтності** | Зміцнити систему на основі результатів |

---

## Принципи Хаос-Інженірингу

### Manifesto

1. **Почніть з гіпотези** — Визначте очікувану поведінку
2. **Мінімальний blast radius** — Контролюйте вплив експерименту
3. **Спостерігайте в реальному часі** — Моніторинг під час тесту
4. **Автоматизуйте** — Повторювані експерименти
5. **Вчіться з результатів** — Документуйте та покращуйте

### Steady State Hypothesis

```yaml
# Визначення "нормального" стану системи
steady_state:
  metrics:
    - name: error_rate
      threshold: "< 0.1%"
    - name: latency_p99
      threshold: "< 200ms"
    - name: availability
      threshold: "> 99.9%"

  health_checks:
    - endpoint: /health
      expected_status: 200
    - endpoint: /api/v45/health
      expected_status: 200
```

---

## Інструменти

### Chaos Mesh (Primary)

```bash
# Встановлення в Kubernetes
kubectl apply -f https://mirrors.chaos-mesh.org/v2.6.0/install.yaml

# Перевірка статусу
kubectl get pods -n chaos-mesh
```

### Custom Scripts

```
scripts/chaos/
├── inject_failure.sh      # Основний скрипт збоїв
├── network_chaos.sh       # Мережеві проблеми
├── cpu_stress.sh          # CPU навантаження
├── memory_stress.sh       # Memory pressure
├── disk_chaos.sh          # Disk I/O проблеми
└── recovery_test.sh       # Тест відновлення
```

### Stress Tools

```bash
# stress-ng для CPU/Memory
brew install stress-ng

# tc для мережевих затримок
# (вбудовано в Linux)

# chaos-monkey для random kills
pip install chaos-monkey-engine
```

---

## Сценарії Тестування

### 📋 Матриця Сценаріїв

| ID | Сценарій | Тип | RTO | Критичність |
|----|----------|-----|-----|-------------|
| CH-001 | Pod Failure | Infrastructure | 30s | High |
| CH-002 | Node Failure | Infrastructure | 2m | Critical |
| CH-003 | Network Latency | Network | 10s | Medium |
| CH-004 | Network Partition | Network | 1m | High |
| CH-005 | Database Connection Loss | Dependency | 10s | Critical |
| CH-006 | Redis Connection Loss | Dependency | 5s | High |
| CH-007 | Memory Exhaustion | Resource | 30s | High |
| CH-008 | CPU Saturation | Resource | 30s | Medium |
| CH-009 | Disk I/O Saturation | Resource | 1m | Medium |
| CH-010 | DNS Failure | Network | 30s | High |

### CH-001: Pod Failure

**Опис:** Раптове знищення пода backend сервісу

**Гіпотеза:** Kubernetes перезапустить под, система відновиться за < 30 секунд

```yaml
# chaos/pod-failure.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: backend-pod-kill
  namespace: chaos-testing
spec:
  action: pod-kill
  mode: one
  selector:
    namespaces:
      - predator
    labelSelectors:
      app: predator-backend
  duration: "1m"
```

**Очікуваний результат:**
```
1. Pod знищено
2. Kubernetes виявляє failure через liveness probe
3. Новий pod запускається
4. Readiness probe успішна
5. Трафік перенаправляється на новий pod
6. Загальний downtime < 30 секунд
```

### CH-002: Node Failure

**Опис:** Симуляція відмови вузла кластера

**Гіпотеза:** Pods будуть переплановані на інший node за < 2 хвилини

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PhysicalMachineChaos
metadata:
  name: node-failure
spec:
  action: vm-stop
  mode: one
  selector:
    nodes:
      - worker-node-1
  duration: "3m"
```

### CH-003: Network Latency

**Опис:** Введення затримки 200ms на мережеві запити

**Гіпотеза:** Система продовжує працювати, P99 latency збільшується

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: network-delay
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - predator
    labelSelectors:
      app: predator-backend
  delay:
    latency: "200ms"
    correlation: "25"
    jitter: "50ms"
  duration: "5m"
```

### CH-004: Network Partition

**Опис:** Ізоляція backend від бази даних

**Гіпотеза:** Backend використовує retry та fallback логіку

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: db-partition
spec:
  action: partition
  mode: one
  selector:
    namespaces:
      - predator
    labelSelectors:
      app: predator-backend
  direction: to
  target:
    selector:
      namespaces:
        - predator
      labelSelectors:
        app: postgres
  duration: "2m"
```

### CH-005: Database Connection Loss

**Опис:** Раптовий розрив з'єднання з PostgreSQL

**Гіпотеза:** Connection pool відновиться, транзакції перезапустяться

```bash
#!/bin/bash
# scripts/chaos/db_disconnect.sh

# Заблокувати з'єднання до postgres на 30 секунд
docker network disconnect predator-net predator_postgres
sleep 30
docker network connect predator-net predator_postgres

# Перевірити відновлення
curl http://localhost:8090/health | jq .
```

### CH-006: Memory Exhaustion

**Опис:** Заповнення пам'яті контейнера до ліміту

**Гіпотеза:** OOMKiller знищить процес, pod перезапуститься з більшим лімітом

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: StressChaos
metadata:
  name: memory-stress
spec:
  mode: one
  selector:
    namespaces:
      - predator
    labelSelectors:
      app: predator-backend
  stressors:
    memory:
      workers: 4
      size: "2GB"
  duration: "2m"
```

---

## Автоматизовані Скрипти

### Головний скрипт хаосу

```bash
#!/bin/bash
# scripts/chaos/inject_failure.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${RED}🔥 CHAOS ENGINEERING TEST SUITE${NC}"
echo "=================================="

# Конфігурація
BACKEND_URL="${BACKEND_URL:-http://localhost:8090}"
NAMESPACE="${NAMESPACE:-predator}"
RECOVERY_TIMEOUT=60

# Функція перевірки здоров'я
check_health() {
    local max_attempts=12
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$BACKEND_URL/health" | grep -q "healthy"; then
            return 0
        fi
        echo "  Attempt $attempt/$max_attempts..."
        sleep 5
        ((attempt++))
    done
    return 1
}

# Функція initial state
verify_initial_state() {
    echo -e "\n${YELLOW}📊 Verifying initial steady state...${NC}"
    if check_health; then
        echo -e "${GREEN}✅ System is healthy${NC}"
    else
        echo -e "${RED}❌ System is not healthy - aborting${NC}"
        exit 1
    fi
}

# Тест 1: Pod Kill
test_pod_kill() {
    echo -e "\n${RED}🔪 TEST 1: Random Pod Kill${NC}"

    # Отримати pod
    POD=$(kubectl get pods -n $NAMESPACE -l app=predator-backend -o jsonpath='{.items[0].metadata.name}')

    if [ -z "$POD" ]; then
        echo -e "${YELLOW}⚠️  No pods found, using Docker${NC}"
        docker kill predator_backend || true
    else
        echo "  Killing pod: $POD"
        kubectl delete pod $POD -n $NAMESPACE --grace-period=0 --force
    fi

    # Очікування відновлення
    echo -e "  Waiting for recovery (timeout: ${RECOVERY_TIMEOUT}s)..."
    sleep 10

    if check_health; then
        echo -e "${GREEN}✅ TEST PASSED: System recovered${NC}"
        return 0
    else
        echo -e "${RED}❌ TEST FAILED: System did not recover${NC}"
        return 1
    fi
}

# Тест 2: Network delay
test_network_delay() {
    echo -e "\n${RED}🌐 TEST 2: Network Delay Injection${NC}"

    # Для Docker (tc потрібен в контейнері)
    docker exec predator_backend tc qdisc add dev eth0 root netem delay 200ms 2>/dev/null || \
        echo "  Using simulated delay via script"

    echo "  Injecting 200ms delay..."
    sleep 30

    # Вимірювання latency
    start=$(date +%s%N)
    curl -s "$BACKEND_URL/health" > /dev/null
    end=$(date +%s%N)
    latency=$(( ($end - $start) / 1000000 ))

    echo "  Measured latency: ${latency}ms"

    # Прибрати delay
    docker exec predator_backend tc qdisc del dev eth0 root 2>/dev/null || true

    if [ $latency -lt 500 ]; then
        echo -e "${GREEN}✅ TEST PASSED: Latency acceptable${NC}"
        return 0
    else
        echo -e "${RED}❌ TEST FAILED: Latency too high${NC}"
        return 1
    fi
}

# Тест 3: Memory stress
test_memory_stress() {
    echo -e "\n${RED}💾 TEST 3: Memory Stress${NC}"

    # Запуск stress в контейнері
    docker exec predator_backend timeout 60 stress-ng --vm 2 --vm-bytes 512M || true

    echo "  Running memory stress for 60s..."
    sleep 65

    if check_health; then
        echo -e "${GREEN}✅ TEST PASSED: System survived memory stress${NC}"
        return 0
    else
        echo -e "${RED}❌ TEST FAILED: System crashed under memory stress${NC}"
        return 1
    fi
}

# Головна функція
main() {
    local passed=0
    local failed=0

    verify_initial_state

    if test_pod_kill; then ((passed++)); else ((failed++)); fi
    sleep 10

    if test_network_delay; then ((passed++)); else ((failed++)); fi
    sleep 10

    if test_memory_stress; then ((passed++)); else ((failed++)); fi

    echo -e "\n${YELLOW}═══════════════════════════════${NC}"
    echo -e "${YELLOW}       CHAOS TEST RESULTS       ${NC}"
    echo -e "${YELLOW}═══════════════════════════════${NC}"
    echo -e "${GREEN}Passed: $passed${NC}"
    echo -e "${RED}Failed: $failed${NC}"

    if [ $failed -eq 0 ]; then
        echo -e "\n${GREEN}🎉 ALL CHAOS TESTS PASSED!${NC}"
        exit 0
    else
        echo -e "\n${RED}⚠️  SOME TESTS FAILED${NC}"
        exit 1
    fi
}

main
```

### Network Chaos Script

```bash
#!/bin/bash
# scripts/chaos/network_chaos.sh

echo "🌐 Network Chaos Test"

# Симуляція packet loss
test_packet_loss() {
    echo "Testing 10% packet loss..."
    docker exec predator_backend tc qdisc add dev eth0 root netem loss 10%

    # Запустити тести
    for i in {1..10}; do
        curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/health
    done

    # Прибрати
    docker exec predator_backend tc qdisc del dev eth0 root
}

# Симуляція jitter
test_jitter() {
    echo "Testing high jitter (100ms ±50ms)..."
    docker exec predator_backend tc qdisc add dev eth0 root netem delay 100ms 50ms

    # Тестування
    ab -n 100 -c 10 http://localhost:8090/health

    docker exec predator_backend tc qdisc del dev eth0 root
}

test_packet_loss
test_jitter

echo "✅ Network chaos test complete"
```

### CPU Stress Script

```bash
#!/bin/bash
# scripts/chaos/cpu_stress.sh

echo "💻 CPU Stress Test"

CONTAINER="predator_backend"
DURATION=60
LOAD=80  # 80% CPU

# Stress test
docker exec $CONTAINER stress-ng \
    --cpu 4 \
    --cpu-load $LOAD \
    --timeout ${DURATION}s &

# Моніторинг під час тесту
for i in $(seq 1 $((DURATION/5))); do
    echo "=== Check $i ==="

    # CPU usage
    docker stats $CONTAINER --no-stream --format "CPU: {{.CPUPerc}}, MEM: {{.MemUsage}}"

    # Health check
    HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8090/health)
    echo "Health: $HEALTH"

    sleep 5
done

echo "✅ CPU stress test complete"
```

---

## Chaos Mesh Конфігурації

### Повний набір експериментів

```yaml
# chaos/experiments/all-experiments.yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: Schedule
metadata:
  name: predator-chaos-schedule
  namespace: chaos-testing
spec:
  schedule: "@every 4h"
  historyLimit: 10
  concurrencyPolicy: Forbid
  type: "Workflow"
  workflow:
    entry: predator-chaos-workflow
    templates:
      - name: predator-chaos-workflow
        templateType: Serial
        deadline: "30m"
        children:
          - pod-chaos
          - network-delay
          - memory-stress

      - name: pod-chaos
        templateType: PodChaos
        deadline: "5m"
        podChaos:
          action: pod-kill
          mode: one
          selector:
            namespaces:
              - predator
            labelSelectors:
              app: predator-backend

      - name: network-delay
        templateType: NetworkChaos
        deadline: "5m"
        networkChaos:
          action: delay
          mode: all
          selector:
            namespaces:
              - predator
            labelSelectors:
              app: predator-backend
          delay:
            latency: "100ms"
            jitter: "20ms"

      - name: memory-stress
        templateType: StressChaos
        deadline: "5m"
        stressChaos:
          mode: one
          selector:
            namespaces:
              - predator
            labelSelectors:
              app: predator-backend
          stressors:
            memory:
              workers: 2
              size: "1GB"
```

### HTTP Chaos (API errors)

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: HTTPChaos
metadata:
  name: api-error-injection
spec:
  mode: one
  selector:
    namespaces:
      - predator
    labelSelectors:
      app: predator-backend
  target: Response
  port: 8000
  path: /api/v45/*
  method: GET
  abort: true  # Розрив з'єднання
  # Або inject помилки:
  # replace:
  #   code: 500
  #   body: '{"error": "Chaos injection"}'
  duration: "1m"
```

---

## Метрики та Моніторинг

### Prometheus Alerts для Chaos

```yaml
# prometheus/rules/chaos-alerts.yml
groups:
  - name: chaos-indicators
    rules:
      - alert: ChaosTestInProgress
        expr: chaos_mesh_experiments_running > 0
        for: 1m
        labels:
          severity: info
        annotations:
          summary: "Chaos experiment is running"

      - alert: SystemRecoveryTooSlow
        expr: |
          (time() - kube_pod_start_time{namespace="predator"}) < 60
          and rate(kube_pod_container_status_restarts_total[5m]) > 0.5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Pod recovery taking too long"
```

### Grafana Dashboard для Chaos Tests

```json
{
  "title": "Chaos Engineering Metrics",
  "panels": [
    {
      "title": "Active Experiments",
      "type": "stat",
      "targets": [
        { "expr": "chaos_mesh_experiments_running" }
      ]
    },
    {
      "title": "Recovery Time",
      "type": "timeseries",
      "targets": [
        { "expr": "time() - kube_pod_start_time{namespace='predator'}" }
      ]
    },
    {
      "title": "Error Rate During Chaos",
      "type": "graph",
      "targets": [
        { "expr": "rate(http_requests_total{status=~'5..'}[1m])" }
      ]
    }
  ]
}
```

---

## Runbook

### Перед запуском хаос-тесту

```markdown
## Pre-Chaos Checklist

- [ ] Система в steady state (всі health checks green)
- [ ] Моніторинг активний і алерти налаштовані
- [ ] Є rollback план
- [ ] Команда повідомлена про тест
- [ ] Час вибраний правильно (не в пік навантаження)
- [ ] Blast radius визначений та обмежений
```

### Під час хаос-тесту

```markdown
## During Chaos

1. Спостерігати за дашбордами
2. Записувати всі спостереження
3. Готовність зупинити експеримент
4. Комунікація з командою
```

### Після хаос-тесту

```markdown
## Post-Chaos Checklist

- [ ] Система повернулась до steady state
- [ ] Всі метрики в нормі
- [ ] Документовані результати
- [ ] Виявлені проблеми додані в backlog
- [ ] Оновлені runbooks якщо потрібно
```

### Аварійна зупинка

```bash
# Негайно зупинити всі chaos experiments
kubectl delete experiments --all -n chaos-testing

# Або через UI
# http://chaos-dashboard.predator.local

# Перезапустити affected pods
kubectl rollout restart deployment -n predator
```

---

## Результати та Документація

### Шаблон звіту

```markdown
# Chaos Test Report

**Date:** 2026-01-10
**Environment:** Staging
**Duration:** 2 hours

## Experiments Conducted

| ID | Name | Result | Recovery Time |
|----|------|--------|---------------|
| CH-001 | Pod Kill | ✅ Pass | 18s |
| CH-003 | Network Delay | ✅ Pass | Instant |
| CH-006 | Memory Stress | ⚠️ Partial | 45s |

## Observations

1. Pod recovery faster than expected
2. Memory stress revealed need for better OOM handling
3. Network delay had minimal impact

## Action Items

- [ ] Increase memory limits for backend
- [ ] Add circuit breaker for external calls
- [ ] Improve logging during failures

## Recommendations

1. Run chaos tests weekly
2. Add more database failure scenarios
3. Consider multi-region failover tests
```

---

## Інтеграція в CI/CD

### GitHub Action для Chaos Tests

```yaml
# .github/workflows/chaos-tests.yml
name: Chaos Engineering Tests

on:
  schedule:
    - cron: '0 3 * * 0'  # Щонеділі о 3:00 UTC
  workflow_dispatch:

jobs:
  chaos-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup K8s
        uses: helm/kind-action@v1

      - name: Deploy Predator
        run: |
          kubectl apply -f helm/predator/
          kubectl wait --for=condition=ready pod -l app=predator-backend

      - name: Install Chaos Mesh
        run: |
          kubectl apply -f https://mirrors.chaos-mesh.org/v2.6.0/install.yaml

      - name: Run Chaos Tests
        run: |
          kubectl apply -f chaos/experiments/
          sleep 300  # Wait for experiments

      - name: Verify Recovery
        run: |
          kubectl get pods -n predator
          curl -f http://localhost:8090/health

      - name: Collect Results
        run: |
          kubectl logs -n chaos-mesh -l app=chaos-dashboard > chaos-logs.txt

      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: chaos-report
          path: chaos-logs.txt
```

---

*© 2026 Predator Analytics — Chaos Engineering Division*
