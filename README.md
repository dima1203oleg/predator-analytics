# 🛡️ PREDATOR ANALYTICS v25.0

> **Незламна система аналітики з автоматичним самовідновленням**

[![Version](https://img.shields.io/badge/version-v25.0-blue.svg)](https://github.com/org/predator-21)
[![Python](https://img.shields.io/badge/python-3.12-green.svg)](https://python.org)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)]()

---

## 🚀 Швидкий старт

```bash
# 1. Клонування
git clone https://github.com/org/predator-21.git
cd predator-21

# 2. Ініціалізація
make init

# 3. Запуск
make up

# 4. Відкрити в браузері
open http://localhost
```

---

## 📋 Команди

| Команда | Опис |
|---------|------|
| `make help` | Показати всі команди |
| `make up` | Запустити локально |
| `make down` | Зупинити |
| `make logs` | Переглянути логи |
| `make test` | Запустити тести |
| `make chaos` | Хаос-тестування |
| `make deploy` | Деплой на сервер |

---

## 🏗️ Архітектура

```
┌─────────────────────────────────────────────────────────────┐
│                    PREDATOR ANALYTICS                        │
├─────────────────────────────────────────────────────────────┤
│  Frontend (React) │ Backend (FastAPI) │ ML Services         │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL │ Redis │ Qdrant │ OpenSearch │ MinIO           │
├─────────────────────────────────────────────────────────────┤
│  Docker │ Kubernetes │ ArgoCD │ Prometheus │ Grafana        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Структура проекту

```
predator-21/
├── apps/                    # Frontend застосунки
│   └── predator-analytics-ui/
├── services/                # Backend сервіси
│   ├── api-gateway/         # FastAPI
│   └── orchestrator/        # Self-Improve
├── packages/                # Спільні пакети
├── infra/                   # Інфраструктура
├── docs/                    # Документація
│   └── diagrams/            # Архітектурні схеми
├── scripts/                 # Автоматизація
│   └── chaos/               # Хаос-тести
├── docker-compose.yml
├── Makefile
└── TECHNICAL_SPECIFICATION.md
```

---

## 🔐 Доступ до сервера

```
🖥️ IP: 194.177.1.240
🔌 Port: 6666
👤 User: dima
🔐 Password: 666666
🌐 Web: http://194.177.1.240/
```

---

## 🎭 Ролі користувачів

| Роль | Shell | Доступ |
|------|-------|--------|
| **Explorer** | Nebula Hub | Публічні дані |
| **Operator** | Tactical HUD | Внутрішні дані |
| **Commander** | Neural Cortex | Повний контроль |

---

## 🛠️ Технології

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS + Framer Motion
- Zustand + TanStack Query

### Backend
- FastAPI (Python 3.12)
- SQLAlchemy 2.0 (async)
- Celery + Redis
- Pydantic v2

### Data Layer
- PostgreSQL + TimescaleDB
- Redis
- Qdrant (Vector DB)
- OpenSearch

### DevOps
- Docker + Docker Compose
- Kubernetes
- ArgoCD (GitOps)
- GitHub Actions (CI)
- Prometheus + Grafana

---

## 📚 Документація

### Технічне Завдання v25.0 (Повна специфікація)
- [📋 Головний індекс ТЗ](./docs/v25-spec/README.md)
- [📖 Повна специфікація системи (v25)](./docs/v25-spec/SPEC_v25.md)
- [🛡️ **Unbreakable Specification v26.0**](./docs/v26_SPECIFICATION.md)
- [🌐 OpenAPI Specification](./docs/v25-spec/openapi.yaml)
- [🛠️ Локальна розробка](./docs/v25-spec/LOCAL_DEVELOPMENT.md)
- [⚙️ DevOps конфігурації](./docs/v25-spec/DEVOPS_CONFIG.md)
- [🔥 Хаос-інженіринг](./docs/v25-spec/CHAOS_ENGINEERING.md)

### Діаграми архітектури
- [🏗️ Архітектурний огляд](./docs/v25-spec/diagrams/architecture-overview.md)
- [🔄 Потоки даних](./docs/v25-spec/diagrams/data-flow.md)
- [🧩 Компоненти системи](./docs/v25-spec/diagrams/components.md)
- [🤖 AI агентна система](./docs/v25-spec/diagrams/ai-agents.md)
- [⚙️ CI/CD Pipeline](./docs/v25-spec/diagrams/devops-pipeline.md)
- [🔄 Self-Healing Flow](./docs/v25-spec/diagrams/self-healing-flow.md)

### Інше
- [Технічна специфікація (legacy)](./TECHNICAL_SPECIFICATION.md)
- [API документація](./docs/api/)
- [Runbooks](./docs/runbooks/)

---

## 🔥 Self-Healing

Система автоматично:
- ✅ Виявляє збої сервісів
- ✅ Перезапускає компоненти
- ✅ Відновлює з'єднання з DB
- ✅ Відкатує проблемні деплої
- ✅ Сповіщає про критичні події

---

## 📞 Підтримка

- **Email**: support@predator.ua
- **Telegram**: @PredatorSupport

---

*© 2026 Predator Analytics. Усі права захищено.*
