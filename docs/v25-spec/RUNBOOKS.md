# 📘 Operations Runbooks — Predator v45 | Neural Analytics.0

> **Версія:** 25.0
> **Оновлено:** 10.01.2026
> **Для:** Operations Team, SRE, On-Call Engineers

---

## Зміст

1. [Incident Response](#1-incident-response)
2. [High CPU Alert](#2-high-cpu-alert)
3. [High Memory Alert](#3-high-memory-alert)
4. [Database Connection Pool Exhausted](#4-database-connection-pool-exhausted)
5. [API Latency High](#5-api-latency-high)
6. [Disk Space Critical](#6-disk-space-critical)
7. [Certificate Expiry](#7-certificate-expiry)
8. [Service Unhealthy](#8-service-unhealthy)
9. [Kafka Lag High](#9-kafka-lag-high)
10. [Model Drift Detected](#10-model-drift-detected)
11. [Security Incident](#11-security-incident)
12. [Disaster Recovery](#12-disaster-recovery)

---

## 1. Incident Response

### 📋 Загальний Процес

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INCIDENT RESPONSE FLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐            │
│   │  DETECT  │───▶│  TRIAGE  │───▶│ RESOLVE  │───▶│ POSTMORT │            │
│   │          │    │          │    │          │    │          │            │
│   │ Alert    │    │ Severity │    │ Fix      │    │ Document │            │
│   │ received │    │ P1-P4    │    │ & verify │    │ & learn  │            │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Severity Levels

| Level | Опис | Response Time | Escalation |
|-------|------|---------------|------------|
| **P1** | System down, data loss | 5 хв | Immediate |
| **P2** | Major degradation | 15 хв | 30 хв |
| **P3** | Partial impact | 1 год | 4 год |
| **P4** | Minor issue | Next business day | - |

### Чеклист при отриманні алерту

- [ ] Підтвердити алерт в PagerDuty/Slack
- [ ] Відкрити Grafana dashboard
- [ ] Перевірити логи
- [ ] Визначити severity
- [ ] Почати документувати в incident log
- [ ] Ескалувати якщо потрібно

---

## 2. High CPU Alert

### 🚨 Alert: `HighCPUUsage`

**Trigger:** CPU > 85% протягом 5 хвилин

### Діагностика

```bash
# 1. Визначити який pod/service
kubectl top pods -n predator --sort-by=cpu

# 2. Перевірити процеси всередині
kubectl exec -it <pod-name> -n predator -- top -b -n 1

# 3. Grafana: CPU panel
# Dashboard: Predator / System Health
```

### Причини та Рішення

| Причина | Рішення |
|---------|---------|
| Spike трафіку | Збільшити replicas: `kubectl scale deploy api --replicas=5` |
| Memory leak → GC | Restart pod: `kubectl rollout restart deploy api` |
| Infinite loop в коді | Rollback: `kubectl rollout undo deploy api` |
| ML model training | Очікувати завершення або reschedule |

### Відновлення

```bash
# Scale up для розподілу навантаження
kubectl scale deployment api -n predator --replicas=5

# Якщо не допомагає - rollback
kubectl rollout undo deployment api -n predator

# Після стабілізації - scale down
kubectl scale deployment api -n predator --replicas=3
```

### Автоматизація

```yaml
# HPA автоматично масштабує
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

## 3. High Memory Alert

### 🚨 Alert: `HighMemoryUsage`

**Trigger:** Memory > 90% протягом 3 хвилин

### Діагностика

```bash
# 1. Memory по pods
kubectl top pods -n predator --sort-by=memory

# 2. Детальний memory usage
kubectl exec -it <pod-name> -n predator -- cat /sys/fs/cgroup/memory/memory.usage_in_bytes

# 3. Check for OOMKilled
kubectl get events -n predator | grep OOMKilled
```

### Причини та Рішення

| Причина | Рішення |
|---------|---------|
| Memory leak | Restart pod |
| Large dataset in memory | Increase limits, use streaming |
| Redis cache overflow | `redis-cli FLUSHDB` |
| Vector DB growth | Archive old vectors |

### Відновлення

```bash
# Restart для очищення пам'яті
kubectl rollout restart deployment api -n predator

# Збільшити memory limits (тимчасово)
kubectl set resources deployment api -n predator \
  --limits=memory=4Gi \
  --requests=memory=2Gi

# Очистити Redis cache
kubectl exec -it redis-0 -n predator -- redis-cli FLUSHDB
```

---

## 4. Database Connection Pool Exhausted

### 🚨 Alert: `PostgresConnectionPoolExhausted`

**Trigger:** Active connections > 90% of max_connections

### Діагностика

```bash
# 1. Поточні з'єднання
kubectl exec -it postgres-0 -n predator -- psql -U predator -c "
SELECT count(*) as total,
       state,
       usename,
       client_addr
FROM pg_stat_activity
GROUP BY state, usename, client_addr
ORDER BY count(*) DESC;"

# 2. Довгі транзакції
kubectl exec -it postgres-0 -n predator -- psql -U predator -c "
SELECT pid, now() - pg_stat_activity.query_start AS duration, query, state
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';"
```

### Рішення

```bash
# 1. Terminate idle connections
kubectl exec -it postgres-0 -n predator -- psql -U predator -c "
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle'
AND query_start < now() - interval '10 minutes';"

# 2. Restart API pods (нові з'єднання)
kubectl rollout restart deployment api -n predator

# 3. Збільшити pool size (довгострокове)
# Редагувати DATABASE_POOL_SIZE в config
```

---

## 5. API Latency High

### 🚨 Alert: `APILatencyHigh`

**Trigger:** P95 latency > 500ms протягом 5 хвилин

### Діагностика

```bash
# 1. Grafana: API Latency panel
# Dashboard: Predator / API Performance

# 2. Slow requests
kubectl logs -f deployment/api -n predator | grep -E "duration.*[5-9][0-9]{2}|[0-9]{4,}ms"

# 3. Database slow queries
kubectl exec -it postgres-0 -n predator -- psql -U predator -c "
SELECT query, calls, mean_time, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"
```

### Рішення

| Причина | Рішення |
|---------|---------|
| DB slow queries | Add indexes, optimize queries |
| External API slow | Increase timeout, add cache |
| Large payload | Implement pagination |
| Cold cache | Pre-warm cache |

```bash
# Pre-warm cache
curl http://localhost/api/v1/cache/warm

# Clear slow query statistics
kubectl exec -it postgres-0 -n predator -- psql -U predator -c "
SELECT pg_stat_statements_reset();"
```

---

## 6. Disk Space Critical

### 🚨 Alert: `DiskSpaceCritical`

**Trigger:** Disk usage > 90%

### Діагностика

```bash
# 1. Usage по nodes
kubectl get nodes -o custom-columns=NAME:.metadata.name,DISK:.status.allocatable.ephemeral-storage

# 2. Usage в pod
kubectl exec -it <pod-name> -n predator -- df -h

# 3. Великі файли
kubectl exec -it <pod-name> -n predator -- du -sh /* 2>/dev/null | sort -hr | head -10
```

### Рішення

```bash
# 1. Очистити Docker
docker system prune -a -f

# 2. Видалити старі логи (7+ днів)
kubectl exec -it <pod-name> -n predator -- find /var/log -type f -mtime +7 -delete

# 3. Очистити tmp
kubectl exec -it <pod-name> -n predator -- rm -rf /tmp/*

# 4. Ротація PostgreSQL WAL
kubectl exec -it postgres-0 -n predator -- psql -U predator -c "
SELECT pg_switch_wal();
CHECKPOINT;"
```

---

## 7. Certificate Expiry

### 🚨 Alert: `CertificateExpiringSoon`

**Trigger:** SSL certificate expires < 14 days

### Діагностика

```bash
# Перевірити термін
echo | openssl s_client -connect predator.ai:443 2>/dev/null | openssl x509 -noout -dates

# Kubernetes secrets
kubectl get secret tls-secret -n predator -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -dates
```

### Рішення

```bash
# Let's Encrypt renewal
certbot renew --force-renewal

# Або оновити secret вручну
kubectl create secret tls tls-secret \
  --cert=/path/to/tls.crt \
  --key=/path/to/tls.key \
  -n predator --dry-run=client -o yaml | kubectl apply -f -

# Restart ingress
kubectl rollout restart deployment ingress-nginx-controller -n ingress-nginx
```

---

## 8. Service Unhealthy

### 🚨 Alert: `ServiceUnhealthy`

**Trigger:** Health check fails > 3 times

### Діагностика

```bash
# 1. Pod status
kubectl get pods -n predator -o wide

# 2. Describe pod
kubectl describe pod <pod-name> -n predator

# 3. Logs
kubectl logs <pod-name> -n predator --tail=100

# 4. Health check вручну
kubectl exec -it <pod-name> -n predator -- curl -v localhost:8000/healthz
```

### Рішення

```bash
# 1. Restart pod
kubectl delete pod <pod-name> -n predator

# 2. Якщо CrashLoopBackOff - перевірити config
kubectl get configmap api-config -n predator -o yaml

# 3. Rollback якщо нічого не допомагає
kubectl rollout undo deployment api -n predator
```

---

## 9. Kafka Lag High

### 🚨 Alert: `KafkaConsumerLagHigh`

**Trigger:** Consumer lag > 10000 messages

### Діагностика

```bash
# 1. Consumer lag
kubectl exec -it kafka-0 -n predator -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group predator-consumers \
  --describe

# 2. Topics info
kubectl exec -it kafka-0 -n predator -- kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe
```

### Рішення

```bash
# 1. Scale up consumers
kubectl scale deployment etl-worker -n predator --replicas=5

# 2. Перевірити чи consumer працює
kubectl logs deployment/etl-worker -n predator | tail -50

# 3. Reset offset (УВАГА: втрата даних)
kubectl exec -it kafka-0 -n predator -- kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group predator-consumers \
  --topic events \
  --reset-offsets \
  --to-latest \
  --execute
```

---

## 10. Model Drift Detected

### 🚨 Alert: `ModelDriftDetected`

**Trigger:** Model accuracy < 80% або data distribution shift

### Діагностика

```bash
# 1. MLflow metrics
open http://mlflow.predator.internal

# 2. Model comparison
curl http://localhost/api/v1/ml/models/current/metrics

# 3. Data distribution
curl http://localhost/api/v1/ml/drift/report
```

### Рішення

```bash
# 1. Retrain model
curl -X POST http://localhost/api/v1/ml/train \
  -H "Content-Type: application/json" \
  -d '{"model": "anomaly_detector", "force": true}'

# 2. Rollback to previous model
curl -X POST http://localhost/api/v1/ml/models/rollback \
  -d '{"model": "anomaly_detector", "version": "v1.2.3"}'

# 3. Notify data team
# Slack: #data-science
```

---

## 11. Security Incident

### 🚨 Alert: Security Incident

**П Р І О Р И Т Е Т   P1**

### Immediate Actions

```
1. [ ] Ізолювати скомпрометований компонент
2. [ ] Зібрати логи ПЕРЕД будь-якими змінами
3. [ ] Сповістити Security Team
4. [ ] Документувати ВСЕ
```

### Ізоляція

```bash
# 1. Block в NetworkPolicy
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: isolate-compromised
  namespace: predator
spec:
  podSelector:
    matchLabels:
      compromised: "true"
  policyTypes:
  - Ingress
  - Egress
EOF

# 2. Label compromised pod
kubectl label pod <pod-name> -n predator compromised=true
```

### Збір доказів

```bash
# Forensics dump
kubectl exec -it <pod-name> -n predator -- tar czf /tmp/forensics.tar.gz \
  /var/log \
  /tmp \
  /etc

kubectl cp predator/<pod-name>:/tmp/forensics.tar.gz ./forensics_$(date +%Y%m%d_%H%M%S).tar.gz
```

---

## 12. Disaster Recovery

### RPO/RTO Targets

| Компонент | RPO | RTO |
|-----------|-----|-----|
| Database | 1 minute | 30 minutes |
| File Storage | 1 hour | 1 hour |
| Search Index | 24 hours | 2 hours |

### Процедура відновлення

```bash
# 1. Оцінити масштаб
kubectl get all -n predator

# 2. Відновити з backup
./scripts/disaster-recovery/restore.sh --from-backup latest

# 3. Перевірити цілісність
./scripts/disaster-recovery/verify.sh

# 4. Відновити traffic
kubectl annotate ingress predator-ingress -n predator \
  kubernetes.io/ingress.class=nginx
```

---

## 📞 Контакти Ескалації

| Рівень | Контакт | Метод |
|--------|---------|-------|
| L1 | On-Call Engineer | PagerDuty |
| L2 | Platform Team Lead | Slack + Phone |
| L3 | CTO | Phone |
| Security | Security Team | Slack #security-incidents |

---

*© 2026 Predator Analytics. Усі права захищено.*
