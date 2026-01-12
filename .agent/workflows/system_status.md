---
description: Повна перевірка статусу системи
---
// turbo-all

# System Status Check

Перевірка статусу всіх компонентів Predator Analytics.

## 1. Перевірка SSH підключення

```bash
ssh -p 6666 dima@194.177.1.240 "echo 'SSH OK: $(hostname)'"
```

## 2. Перевірка Docker сервісів

```bash
ssh -p 6666 dima@194.177.1.240 "cd ~/predator-analytics && docker compose ps"
```

## 3. Перевірка Orchestrator

```bash
ssh -p 6666 dima@194.177.1.240 "docker logs predator_orchestrator --tail 50"
```

## 4. Перевірка Telegram Bot

```bash
ssh -p 6666 dima@194.177.1.240 "docker logs predator_orchestrator 2>&1 | grep -i telegram | tail -20"
```

## 5. Перевірка Backend API

```bash
ssh -p 6666 dima@194.177.1.240 "curl -s http://localhost:8000/health | head -n 5"
```

## 6. Перевірка GPU

```bash
ssh -p 6666 dima@194.177.1.240 "nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu --format=csv"
```

## 7. Перевірка диску та памʼяті

```bash
ssh -p 6666 dima@194.177.1.240 "echo '=== DISK ===' && df -h / && echo '=== MEMORY ===' && free -h"
```
