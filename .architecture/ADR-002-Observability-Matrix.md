# ADR-002: Observability Responsibility Matrix

**Статус:** ПРИЙНЯТО
**Дата:** 2026-02-04
**Контекст:** Predator v30 Constitutional Compliance

## Рішення

Фіксуємо **чітку матрицю відповідальності** для telemetry:

| Компонент | Призначення | Retention | SLO |
|-----------|-------------|-----------|-----|
| **Prometheus** | Метрики (primary) | 30d hot | p99 < 200ms |
| **Thanos + MinIO** | Метрики (long-term) | 365d cold | - |
| **Loki** | Логи | 90d | - |
| **Tempo** | Traces | Adaptive sampling | error-biased |
| **Pyroscope** | Continuous profiling | Real-time | - |
| **Alertmanager** | Alerting routing | - | error_rate < 0.1% |

## Обґрунтування

Без чіткого ролеподілу:
- Автономна система генерує фальшиві сигнали
- Деградація пропускається
- Дублювання даних без користі

## Наслідки

✅ **Обов'язково:**
- Кожен сервіс має метрики, логи, трейси
- OpenTelemetry SDK для всіх компонентів
- Adaptive sampling для traces

❌ **Заборонено:**
- Сервіси без instrumentation
- Метрики без SLO
- Логи без structured format

## Compliance Check

```bash
# Перевірка наявності метрик
kubectl get servicemonitors -A | wc -l

# Перевірка Loki retention
kubectl get cm loki-config -n observability -o yaml | grep retention
```

---

**Підпис:** Constitutional Council
**Версія ADR:** 1.0
