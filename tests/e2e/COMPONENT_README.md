# 🦅 Autonomous Agent Components - README
## PREDATOR Analytics v61.0-ELITE

Цей документ описує кожен компонент автономного агента та його використання.

---

## 📁 Структура компонентів

```
tests/e2e/
├── master_orchestrator.py              # Головний координатор
├── ai_workflow_tester.py              # Тестер AI workflow
├── dom_frontend_auditor.py            # Аудитор DOM та Frontend
├── integration_auditor.py             # Аудитор інтеграції
├── self_healing_engine.py             # Двигун самовідновлення
├── continuous_improvement.py          # Модуль безперервного покращення
├── validate_8_dbs.py                  # Валідація 8 баз даних
├── autonomous_agent_config.json       # Конфігурація агента
└── run_*.sh                          # Скрипти запуску
```

---

## 🎛️ Master Orchestrator

**Файл:** `master_orchestrator.py`

**Опис:** Головний координатор, який керує всіма компонентами та координує процес тестування.

**Основні функції:**
- Координація всіх компонентів
- Управління ітераціями самовідновлення
- Генерація фінальних звітів
- Валідація критеріїв успіху

**Використання:**
```bash
python3 master_orchestrator.py
```

або через скрипт:
```bash
./run_autonomous_agent_v2.sh
```

---

## 🤖 AI Workflow Tester

**Файл:** `ai_workflow_tester.py`

**Опис:** Тестує AI-чат, векторизацію, семантичний пошук та графовий аналіз.

**Основні функції:**
- Тестування AI-чату через Playwright
- Перевірка походження відповідей
- Валідація векторизації в Qdrant
- Тестування семантичного пошуку
- Тестування графового аналізу

**Використання:**
```bash
python3 ai_workflow_tester.py
```

або через скрипт:
```bash
./run_ai_workflow_tester.sh
```

**Конфігурація тестових запитів:**
```python
test_queries = [
    {
        'query': 'Покажи декларації за березень 2024 року',
        'type': 'declaration_search'
    },
    # ... інші запити
]
```

---

## 🖥️ DOM & Frontend Auditor

**Файл:** `dom_frontend_auditor.py`

**Опис:** Аудитує React компоненти, стан застосунку, WebSocket та консольні помилки.

**Основні функції:**
- Перевірка React компонентів
- Аналіз стану застосунку
- Перевірка WebSocket з'єднання
- Аналіз консольних помилок
- Перевірка доступності (accessibility)

**Використання:**
```bash
python3 dom_frontend_auditor.py
```

або через скрипт:
```bash
./run_dom_auditor.sh
```

**Метрики продуктивності:**
- First Contentful Paint
- Largest Contentful Paint
- Time to Interactive
- Cumulative Layout Shift

---

## 🔗 Integration Auditor

**Файл:** `integration_auditor.py`

**Опис:** Аудитує інтеграцію між сервісами: FastAPI, ETL, черги повідомлень, WebSocket.

**Основні функції:**
- Перевірка здоров'я сервісів
- Аудит черг повідомлень
- Аналіз API endpoints
- Аналіз логів
- Перевірка синхронізації між сервісами

**Використання:**
```bash
python3 integration_auditor.py
```

або через скрипт:
```bash
./run_integration_auditor.sh
```

**Перевірявані сервіси:**
- Core API (FastAPI)
- Graph Service
- PostgreSQL
- Redis
- Neo4j
- Kubernetes Pods

---

## 🔧 Self-Healing Engine

**Файл:** `self_healing_engine.py`

**Опис:** Двигун самовідновлення з LLM діагностикою для автоматичного виправлення помилок.

**Основні функції:**
- LLM діагностика помилок
- Rule-based діагностика (fallback)
- Виконання дій самовідновлення
- Перевірка успішності виправлень

**Використання:**
```bash
python3 self_healing_engine.py
```

або через скрипт:
```bash
./run_self_healing.sh
```

**Типи дій самовідновлення:**
- RESTART_SERVICE - перезапуск сервісу
- RESTART_POD - перезапуск Kubernetes pod
- CLEAR_CACHE - очищення кешу
- REINDEX_DATA - реіндексація даних
- FIX_CONFIGURATION - виправлення конфігурації
- ROLLBACK_DEPLOYMENT - rollback деплою

---

## 📈 Continuous Improvement Module

**Файл:** `continuous_improvement.py`

**Опис:** Модуль безперервного покращення: аналіз продуктивності, оптимізація SQL запитів, рекомендації.

**Основні функції:**
- Аналіз метрик продуктивності
- Аналіз SQL запитів
- Генерація рекомендацій щодо оптимізації
- Запуск регресійних тестів
- Генерація архітектурних рекомендацій

**Використання:**
```bash
python3 continuous_improvement.py
```

або через скрипт:
```bash
./run_continuous_improvement.sh
```

**Метрики продуктивності:**
- CPU Usage
- Memory Usage
- Disk Usage
- Network Latency
- API Response Time

---

## 🔍 Database Validator

**Файл:** `validate_8_dbs.py`

**Опис:** Валідація 8 баз даних згідно з System Memory Contract.

**Перевірявані бази даних:**
- PostgreSQL (SSOT)
- ClickHouse (OLAP)
- Neo4j (Graph)
- Qdrant (Vector)
- OpenSearch (Search)
- Redis (Cache)
- MinIO (S3)
- Redpanda (Kafka)

**Використання:**
```bash
python3 validate_8_dbs.py
```

---

## ⚙️ Конфігурація

**Файл:** `autonomous_agent_config.json`

**Опис:** Конфігураційний файл для автономного агента.

**Основні секції:**
- `nvidia_server` - конфігурація NVIDIA сервера
- `ui` - конфігурація UI
- `backend` - конфігурація бекенду
- `limits` - ліміти та таймаути
- `features` - увімкнення/вимкнення функцій
- `rbac` - конфігурація RBAC тестів
- `databases` - конфігурація баз даних
- `ai_workflow` - конфігурація AI workflow тестів
- `performance` - пороги метрик продуктивності
- `reporting` - налаштування звітів
- `logging` - налаштування логування

**Використання:**
```bash
# Використання конфігурації за замовчуванням
./run_autonomous_agent_v2.sh

# Використання кастомної конфігурації
export AGENT_CONFIG="/path/to/custom_config.json"
./run_autonomous_agent_v2.sh
```

---

## 🚀 Скрипти запуску

### Повний цикл
```bash
./run_autonomous_agent_v2.sh
```

### Окремі компоненти
```bash
./run_ai_workflow_tester.sh
./run_dom_auditor.sh
./run_integration_auditor.sh
./run_self_healing.sh
./run_continuous_improvement.sh
```

---

## 📊 Звіти

Звіти зберігаються в `tests/e2e/reports/`:

- `autonomous_agent_report_YYYYMMDD_HHMMSS.json` - детальний JSON звіт
- `autonomous_agent_report_YYYYMMDD_HHMMSS.md` - читабельний Markdown звіт
- `ai_workflow_result_YYYYMMDD_HHMMSS.json` - результат AI workflow тестів
- `dom_audit_result_YYYYMMDD_HHMMSS.json` - результат DOM аудиту
- `integration_audit_result_YYYYMMDD_HHMMSS.json` - результат інтеграційного аудиту
- `self_healing_result_YYYYMMDD_HHMMSS.json` - результат самовідновлення
- `continuous_improvement_result_YYYYMMDD_HHMMSS.json` - результат безперервного покращення

---

## 🔧 Налаштування оточення

### Обов'язкові змінні середовища
```bash
export NVIDIA_SERVER="predator-server"
export NVIDIA_HOST="194.177.1.200"
export NVIDIA_USER="predator"
```

### Опціональні змінні середовища
```bash
export UI_URL="http://localhost:3030"
export BACKEND_URL="http://localhost:8000"
export TEST_FILE_PATH="/path/to/test/file.xlsx"
export MAX_ITERATIONS="10"
export BACKEND_MODE="auto"
export ENABLE_LLM_DIAGNOSTICS="true"
```

---

## 📝 Логи

Логи зберігаються в `tests/e2e/logs/`:

- `orchestrator.log` - логи Master Orchestrator
- `ai_workflow.log` - логи AI Workflow Tester
- `dom_audit.log` - логи DOM Auditor
- `integration_audit.log` - логи Integration Auditor
- `self_healing.log` - логи Self-Healing Engine
- `continuous_improvement.log` - логи Continuous Improvement Module

---

## 🐛 Вирішення проблем

### Проблема: Імпорт модулів не працює
**Рішення:** Переконайтеся, що ви знаходитесь в директорії `tests/e2e/`:
```bash
cd /Users/Shared/Predator_60/tests/e2e
python3 master_orchestrator.py
```

### Проблема: SSH з'єднання не вдалося
**Рішення:** Перевірте SSH конфігурацію:
```bash
cat ~/.ssh/config
ssh predator-server "echo 'OK'"
```

### Проблема: Playwright не встановлено
**Рішення:** Встановіть Playwright:
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright install chromium
```

### Проблема: Python залежності відсутні
**Рішення:** Встановіть залежності:
```bash
pip install requests
```

---

## 📚 Додаткова документація

- `AUTONOMOUS_AGENT_ARCHITECTURE.md` - детальна архітектура системи
- `AUTONOMOUS_AGENT_GUIDE.md` - підсумкова документація з інструкціями
- `AUTONOMOUS_E2E_README.md` - документація існуючого E2E тесту

---

**Версія:** 2.0  
**Останнє оновлення:** 2024-06-18
