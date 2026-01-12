---
description: Auto-Fix and Deploy Workflow (Turbo Mode)
---
// turbo-all

# Auto-Fix Workflow

Автоматичне виправлення та деплой на сервер.

## 1. Check Remote Health and Auto-Fix

```bash
python3 scripts/auto_completer.py
```

## 2. Sync and Restart (якщо потрібно)

```bash
ssh -p 6666 dima@194.177.1.240 "cd ~/predator-analytics && git pull && docker compose restart predator_backend predator_orchestrator"
```
