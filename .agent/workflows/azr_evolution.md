---
description: AZR Engine v28-S: Autonomous Observation & Evolution Loop
---
// turbo-all

# AZR v28-S Evolution Workflow

Цей воркфлоу реалізує цикл "Спостереження-Деплой" згідно з ТЗ AZR Engine v28-S.

## 1. Observation (Спостереження)
Збір метрик через OpenTelemetry та аналіз логів Grafana Loki.

```bash
# Перевірка статусу метрик (заглушка до повної інтеграції)
curl -s http://194.177.1.240:8090/metrics | grep python_info
```

## 2. Analysis & Generation (AI-Driven)
Використання локальних LLM (через Ollama) для генерації патчів.

// turbo
```bash
# Спроба генерації фікса через локальний скрипт (якщо доступний)
python3 scripts/azr_advisor.py --analyze-logs
```

## 3. Validation (Multi-Agent Verification)
Аудит коду через Ruff та Semgrep.

```bash
# Статичний аналіз
ruff check services/api-gateway
semgrep --config auto services/api-gateway
```

## 4. Deploy (Conditional Autonomy)
Деплой через GitLab/ArgoCD або прямий Docker Compose (для POC).

```bash
# Деплой патчу
ssh -p 16699 dima@5.tcp.eu.ngrok.io "cd ~/predator-analytics && docker compose up -d --build"
```

## 5. Learning
Оновлення Memory Vector Store (Qdrant).
