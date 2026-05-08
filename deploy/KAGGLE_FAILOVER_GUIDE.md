# 🦅 PREDATOR Analytics v63.0-ELITE — Kaggle Failover Guide

> Цей посібник описує процес перемикання аналітичного навантаження з локального вузла (iMac/MacBook) на резервний хмарний вузол у **Kaggle** (30GB RAM).

## 🚨 Коли використовувати Failover?
- Локальний VRAM заповнений (>7.8 GB).
- RAM MacBook перевищує 90% (активується **RAM Guard** в UI).
- Потрібно виконати важкі GraphRAG запити, які потребують багато оперативної пам'яті.

## 🚀 Процедура активації
1. **Запуск Kaggle**: Відкрийте `predator_kaggle_k8s_node.ipynb` у Kaggle.
2. **Активація zrok**: Переконайтеся, що тунель запущений і ви бачите URL (наприклад, `https://...zrok.io`).
3. **Перемикання в UI**: 
   - У вікні **AICopilot** натисніть на кнопку **"Failover to Kaggle"**.
   - Система автоматично перенаправить API-запити на хмарний вузол.

## 🏗️ Архітектура резервного вузла
- **Orchestration**: K3s (Lightweight Kubernetes).
- **Backend**: PREDATOR Core API (v63.0-ELITE).
- **Data**: In-memory Qdrant + Neo4j.
- **AI**: Gemini 1.5 Pro / Flash через LiteLLM Gateway.

## 🛠️ Ручне налаштування (якщо автоматика не спрацювала)
Оновіть файл `.env` у фронтенді:
```bash
VITE_API_BASE_URL=https://<your-zrok-id>.zrok.io/api/v1
```

---
© 2026 PREDATOR Analytics — HR-04 Compliant
