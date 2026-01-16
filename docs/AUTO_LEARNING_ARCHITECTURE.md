# AUTO-LEARNING & SELF-IMPROVEMENT ARCHITECTURE
## PREDATOR ANALYTICS v29.0

Цей документ визначає інженерну карту компонентів для повної автономії системи.

---

### 🧠 I. DATA → MODEL PIPELINE

#### A. ДАТАСЕТИ ТА ДАНІ

**✅ ВЖЕ Є (Implemented)**
1. **Raw Data Lake**: `data/raw` (CSV, JSON, PDF), `staging` schema (Postgres).
2. **ETL Engine**: `etl_workers.py` (Python/Celery), `etl_ingestion.py`.
3. **Feature Engineering**: `services/ml-core` (Basic numeric/categorical encoding).
4. **Synthetic Data Generator**: `SyntheticDataAgent` in Orchestrator (Rule-based).

**➕ ПОТРІБНО ДОДАТИ (Required)**
5. **Dataset Versioning Engine**: DVC integration for `data/processed`.
6. **Dataset Quality Scorer**: Автоматична оцінка drift та bias перед тренуванням.
7. **Labeling Strategy Engine**: Weak supervision scripts (Snorkel) для авто-розмітки.

---

#### B. АВТОГЕНЕРАЦІЯ ДАТАСЕТІВ

**✅ ВЖЕ Є (Implemented)**
8. **SyntheticDataAgent**: `services/orchestrator/agents/synthetic_data.py` (LLM-based prototyping).
9. **Prompt-based Expansion**: `libs/core/prompts/generators.py`.

**➕ ПОТРІБНО ДОДАТИ (Required)**
10. **Scenario Generator**: Генератор складних бізнес-сценаріїв (корупція, податки) на основі `data/seeds`.
11. **Adversarial Generator**: Генерація "важких" прикладів для підвищення стійкості моделей.
12. **Temporal Builder**: Інструмент для створення Time-Series датасетів з ковзним вікном.

---

#### C. FINE-TUNING / PEFT

**✅ ВЖЕ Є (Implemented)**
13. **Local Runtime**: Ollama (Llama 3.1), GGUF підтримка.
14. **Model Registry**: `models/registry.json` (Basic file-based).

**➕ ПОТРІБНО ДОДАТИ (Required)**
15. **Fine-Tuning Orchestrator**: Автоматичний запуск `Unsloth` / `HuggingFace Trainer` при накопиченні даних.
16. **Hyperparameter Tuner**: Optuna integration для підбору параметрів (LoRA rank, alpha).
17. **Multi-Objective Controller**: Балансування між точністю та швидкістю.

---

#### D. АВТОМАТИЧНА ОЦІНКА

**✅ ВЖЕ Є (Implemented)**
18. **Task-based Evaluation**: `CriticAgent` оцінює результати виконання задач.

**➕ ПОТРІБНО ДОДАТИ (Required)**
19. **Model Benchmark Suite**: Набір золотих тестів (`tests/benchmarks`) для регресійного тестування.
20. **Drift Detection**: Моніторинг розподілу даних вхідних запитів (`EvidentlyAI` або кастомний).
21. **Hallucination Detector**: Перехресна перевірка фактів через Knowledge Graph.

---

#### E. АВТОВИБІР МОДЕЛЕЙ

**✅ ВЖЕ Є (Implemented)**
22. **ArbiterAgent**: Маршрутизація запитів (`services/model_router`).
23. **Cost/Performance Logic**: Вибір моделі на основі складності задачі.

**➕ ПОТРІБНО ДОДАТИ (Required)**
24. **Continuous Ranking**: Динамічне оновлення рейтингу моделей на основі реальних метрик успіху.
25. **Domain Selector**: Спеціалізація моделей (юрист, митник, аудитор).

---

#### F. DEPLOYMENT LIFECYCLE

**✅ ВЖЕ Є (Implemented)**
26. **Feature Flags**: Конфігурація через Redis.
27. **Basic Monitoring**: Prometheus metrics.

**➕ ПОТРІБНО ДОДАТИ (Required)**
28. **Model Lifecycle Manager**: Автоматичний перехід `Candidate -> Staging -> Prod`.
29. **Shadow Deployment**: Запуск нової моделі паралельно для збору метрик без впливу на користувача.
30. **Auto-Retirement**: Виведення з експлуатації застарілих моделей.

---

#### G. АВТОНОМІЯ (AGI LEVEL)

**✅ ВЖЕ Є (Implemented)**
31. **Constitutional Guard**: `services/constitutional-core` (Arbiter, Ledger).
32. **Self-Healing**: `SelfHealingSystem` в Оркестраторі.
33. **Swarm Intelligence**: gRPC комунікація між агентами.

**➕ ПОТРІБНО ДОДАТИ (Required)**
34. **Auto-Train Scheduler**: CRON-job для нічних циклів перенавчання.
35. **Immunity Memory**: База знань "що НЕ спрацювало", щоб не повторювати помилки.
36. **Human Override Hooks**: Інтерфейс для екстреного втручання оператора.
