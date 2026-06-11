# ADV-DVS - Autonomous Deployment Validation & DOM Verification System

PREDATOR Analytics v61.0-ELITE

## Опис

Автономний модуль повної перевірки працездатності системи PREDATOR Analytics після деплою.

## Рівні валідації

1. **Infrastructure Validation** - Docker, Kubernetes, ArgoCD, Helm
2. **Container Validation** - статус, рестарти, uptime, CPU, RAM, healthcheck
3. **Database Validation** - PostgreSQL, Neo4j, ClickHouse, Redis, OpenSearch, Qdrant, MinIO, Redpanda
4. **DOM Testing** - перевірка сторінок, JS/React помилки
5. **User Journey Testing** - повні сценарії користувача
6. **API Validation** - OpenAPI, endpoints
7. **ETL Validation** - завантаження файлів, обробка
8. **Telegram Validation** - бот
9. **AI Validation** - Ollama, моделі
10. **Observability Validation** - Prometheus, Grafana, Loki, Tempo, AlertManager
11. **Security Validation** - Vault, Keycloak, JWT, MFA, RLS
12. **Chaos Validation** - симуляція падінь

## Запуск

```bash
python main.py
```

## Вихідні дані

- `deployment_audit_{timestamp}.json` - JSON звіт
- Deployment Readiness Index - індекс готовності (0-100%)
- Overall Status - загальний статус (PASSED/WARNING/FAILED)

## Критерій успіху

Система вважається повністю готовою якщо:
- 100% сервісів працюють
- 100% контейнерів працюють
- 100% БД доступні
- 100% API відповідають
- Frontend проходить DOM-тестування
- Deployment Readiness Index ≥ 95%
