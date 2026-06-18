# 🚀 Швидкий старт - Autonomous Agent v2.0
## PREDATOR Analytics v61.0-ELITE

---

## ⚡ 5 хвилин на запуск

### 1. Перевірка залежностей

```bash
# Python 3.12
python3 --version

# Node.js 18+
node --version

# SSH доступ
ssh predator-server "echo 'OK'"
```

### 2. Налаштування змінних середовища

```bash
export NVIDIA_SERVER="predator-server"
export NVIDIA_HOST="194.177.1.200"
export NVIDIA_USER="predator"
export UI_URL="http://localhost:3030"
```

### 3. Запуск повного циклу

```bash
cd /Users/Shared/Predator_60/tests/e2e
./run_autonomous_agent_v2.sh
```

### 4. Перегляд звітів

Звіти знаходяться в `tests/e2e/reports/`:
- `autonomous_agent_report_*.json`
- `autonomous_agent_report_*.md`

---

## 🎯 Запуск окремих компонентів

### AI Workflow Tester
```bash
./run_ai_workflow_tester.sh
```

### DOM & Frontend Auditor
```bash
./run_dom_auditor.sh
```

### Integration Auditor
```bash
./run_integration_auditor.sh
```

### Self-Healing Engine
```bash
./run_self_healing.sh
```

### Continuous Improvement Module
```bash
./run_continuous_improvement.sh
```

---

## 🔧 Конфігурація

### Режими роботи

**auto** (за замовчуванням):
```bash
./run_autonomous_agent_v2.sh
```

**local** (локальний бекенд):
```bash
BACKEND_MODE=local ./run_autonomous_agent_v2.sh
```

**remote** (NVIDIA сервер):
```bash
BACKEND_MODE=remote ./run_autonomous_agent_v2.sh
```

**ui-only** (тільки UI):
```bash
BACKEND_MODE=ui-only ./run_autonomous_agent_v2.sh
```

### Ліміти

```bash
# Максимальна кількість ітерацій самовідновлення
export MAX_ITERATIONS="10"

# Час очікування для ETL (хвилин)
export ETL_TIMEOUT="30"
```

---

## 📊 Приклади використання

### Запуск прикладів

```bash
cd /Users/Shared/Predator_60/tests/e2e/examples

# AI Workflow Tester
python3 ai_workflow_example.py

# DOM Auditor
python3 dom_auditor_example.py

# Integration Auditor
python3 integration_auditor_example.py

# Self-Healing Engine
python3 self_healing_example.py

# Continuous Improvement Module
python3 continuous_improvement_example.py
```

---

## 🐛 Швидке вирішення проблем

### SSH з'єднання не працює
```bash
# Перевірка конфігурації
cat ~/.ssh/config

# Додайте конфігурацію:
Host predator-server
    HostName 194.177.1.200
    User predator
    IdentityFile ~/.ssh/id_rsa
```

### UI недоступний
```bash
# Запуск UI
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npm run dev
```

### Playwright не встановлено
```bash
cd /Users/Shared/Predator_60/apps/predator-analytics-ui
npx playwright install chromium
```

---

## 📚 Додаткова документація

- `AUTONOMOUS_AGENT_GUIDE.md` - повна документація
- `COMPONENT_README.md` - документація компонентів
- `AUTONOMOUS_AGENT_ARCHITECTURE.md` - архітектура системи

---

**Версія:** 2.0  
**Останнє оновлення:** 2024-06-18
