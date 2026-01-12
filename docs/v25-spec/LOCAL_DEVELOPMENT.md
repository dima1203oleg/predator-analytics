# 🛠️ Локальна Розробка — Predator Analytics v25.0

> Повний посібник з налаштування локального середовища розробки

---

## Зміст

1. [Швидкий Старт](#швидкий-старт)
2. [Вимоги](#вимоги)
3. [Docker Compose](#docker-compose)
4. [DevContainer (VSCode)](#devcontainer-vscode)
5. [Makefile Команди](#makefile-команди)
6. [Конфігурація](#конфігурація)
7. [Тестування](#тестування)
8. [Налагодження](#налагодження)
9. [Часті Проблеми](#часті-проблеми)

---

## Швидкий Старт

### За 5 хвилин

```bash
# 1. Клонування репозиторію
git clone https://github.com/org/predator-21.git
cd predator-21

# 2. Ініціалізація середовища
make init

# 3. Запуск всіх сервісів
make up

# 4. Перевірка статусу
make health

# 5. Відкрити в браузері
open http://localhost
```

### Очікуваний результат

```
✅ Frontend:    http://localhost
✅ Backend API: http://localhost:8090
✅ Grafana:     http://localhost:3001
✅ MinIO:       http://localhost:9001
✅ OpenSearch:  http://localhost:5601
```

---

## Вимоги

### Мінімальні системні вимоги

| Компонент | Мінімум | Рекомендовано |
|-----------|---------|---------------|
| **RAM** | 8 GB | 16 GB |
| **CPU** | 4 cores | 8 cores |
| **Disk** | 20 GB | 50 GB SSD |
| **Docker** | 20.10+ | 24.0+ |

### Необхідне ПЗ

```bash
# macOS (Homebrew)
brew install docker docker-compose node@20 python@3.12

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose nodejs npm python3.12

# Перевірка версій
docker --version          # >= 20.10
docker-compose --version  # >= 2.20
node --version            # >= 20.0
python3 --version         # >= 3.12
```

---

## Docker Compose

### Архітектура сервісів

```
┌─────────────────────────────────────────────────────────────────┐
│                     DOCKER COMPOSE STACK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐          │
│  │  frontend   │    │   backend   │    │   celery    │          │
│  │   :80       │───▶│   :8090     │◀───│   worker    │          │
│  └─────────────┘    └──────┬──────┘    └─────────────┘          │
│                            │                                     │
│  ┌─────────────┬───────────┼───────────┬─────────────┐          │
│  │             │           │           │             │          │
│  ▼             ▼           ▼           ▼             ▼          │
│ ┌───┐       ┌─────┐    ┌───────┐    ┌──────┐     ┌──────┐      │
│ │PG │       │Redis│    │Qdrant │    │MinIO │     │Kafka │      │
│ │:5432│     │:6379│    │:6333  │    │:9000 │     │:9092 │      │
│ └───┘       └─────┘    └───────┘    └──────┘     └──────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Профілі запуску

```bash
# Локальна розробка (мінімум сервісів)
docker-compose --profile local up -d

# Серверний режим (всі сервіси)
docker-compose --profile server up -d

# Тільки бази даних
docker-compose up postgres redis qdrant -d

# Без AI сервісів (легкий режим)
docker-compose --profile local up -d --scale h2o-llm-studio=0
```

### Основні команди

```bash
# Запуск
docker-compose --profile local up -d

# Перегляд логів
docker-compose logs -f backend

# Перезапуск окремого сервісу
docker-compose restart backend

# Зупинка
docker-compose down

# Зупинка з видаленням даних
docker-compose down -v
```

### Volumes (Постійні дані)

```yaml
volumes:
  postgres_data:    # PostgreSQL дані
  redis_data:       # Redis persistence
  qdrant_data:      # Qdrant vectors
  opensearch_data:  # OpenSearch indices
  minio_data:       # MinIO objects
  grafana_data:     # Grafana dashboards
```

---

## DevContainer (VSCode)

### Автоматичний запуск

1. Відкрити проект у VSCode
2. Натиснути `Cmd+Shift+P` → "Reopen in Container"
3. Зачекати ~2 хвилини на збірку
4. Готово! Середовище ідентичне для всіх розробників

### Що включено

```json
{
  "name": "Predator Analytics v25 Dev",
  "features": {
    "node": "20",
    "docker-outside-of-docker": {},
    "kubectl-helm-minikube": {},
    "postgres-cli": {}
  },
  "extensions": [
    "ms-python.python",
    "charliermarsh.ruff",
    "dbaeumer.vscode-eslint",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Переваги DevContainer

| Функція | Опис |
|---------|------|
| **Ізоляція** | Незалежне від хост-системи |
| **Репродуктивність** | Ідентичне середовище для всіх |
| **Prebuilt tools** | Python, Node, Docker, K8s вже встановлені |
| **Extensions** | VSCode розширення автоматично |

---

## Makefile Команди

### Повний перелік

```bash
# Довідка
make help

# Ініціалізація
make init           # Налаштування середовища

# Локальна розробка
make up             # Запуск сервісів
make down           # Зупинка сервісів
make restart        # Перезапуск
make logs           # Всі логи
make logs-backend   # Логи backend
make logs-frontend  # Логи frontend

# Тестування
make test           # Повні тести
make test-quick     # Швидкі тести
make lint           # Перевірка коду

# Хаос-інженіринг
make chaos          # Загальне хаос-тестування
make chaos-network  # Мережеві збої
make chaos-cpu      # CPU навантаження

# Деплой
make sync           # Синхронізація з сервером
make deploy         # Повний деплой
make server-restart # Перезапуск на сервері
make server-status  # Статус сервера
make server-logs    # Логи з сервера

# База даних
make db-migrate     # Міграції
make db-reset       # Скидання (ОБЕРЕЖНО!)

# Очистка
make clean          # Тимчасові файли
make clean-docker   # Docker images/volumes

# Швидкі команди
make dev            # up + logs
make prod           # deploy + server-status
make health         # Перевірка здоров'я
```

---

## Конфігурація

### Файл .env

Скопіюйте та налаштуйте:

```bash
cp .env.example .env
```

### Основні змінні

```bash
# === База даних ===
DATABASE_URL=postgresql+asyncpg://admin:666666@postgres:5432/predator_db
POSTGRES_PASSWORD=666666

# === Redis ===
REDIS_URL=redis://redis:6379/0

# === Qdrant ===
QDRANT_URL=http://qdrant:6333

# === OpenSearch ===
OPENSEARCH_URL=http://opensearch:9200

# === MinIO ===
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=666666

# === AI/LLM ===
ANTHROPIC_KEY=sk-ant-...
OPENAI_KEY=sk-...
GEMINI_API_KEY=...
GROQ_KEY=gsk_...

# === Ollama (локальний LLM) ===
OLLAMA_BASE_URL=http://host.docker.internal:11434

# === Telegram Bot ===
TELEGRAM_BOT_TOKEN=...
TELEGRAM_ADMIN_IDS=123456789
```

### Конфігурація для різних середовищ

```
.env              # Локальна розробка
.env.production   # Production
.env.nvidia       # NVIDIA сервер
.env.oracle       # Oracle Cloud
```

---

## Тестування

### Unit тести

```bash
# Backend тести
cd services/api-gateway
pytest tests/ -v --cov=app

# Frontend тести
cd apps/predator-analytics-ui
npm test

# Швидкий запуск
make test-quick
```

### Integration тести

```bash
# Запуск з coverage
pytest tests/integration/ -v --cov=app --cov-report=html

# Відкрити звіт
open htmlcov/index.html
```

### E2E тести

```bash
# Playwright тести
cd apps/predator-analytics-ui
npm run test:e2e

# Cypress (якщо доступний)
npm run cypress:open
```

---

## Налагодження

### Backend Debugging

```python
# 1. Додати breakpoint
import pdb; pdb.set_trace()

# 2. Або import debugpy для VSCode
import debugpy
debugpy.listen(("0.0.0.0", 5678))
debugpy.wait_for_client()
```

### VSCode Launch Config

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: Attach to Container",
      "type": "python",
      "request": "attach",
      "connect": {
        "host": "localhost",
        "port": 5678
      },
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}/services/api-gateway",
          "remoteRoot": "/app"
        }
      ]
    }
  ]
}
```

### Логування

```python
# Налаштування logging
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Використання
logger.info("Processing request", extra={"request_id": req_id})
logger.error("Error occurred", exc_info=True)
```

### Docker логи

```bash
# Всі логи в real-time
docker-compose logs -f

# Конкретний сервіс
docker-compose logs -f backend --tail=100

# Пошук в логах
docker-compose logs backend 2>&1 | grep ERROR

# Зберегти в файл
docker-compose logs backend > backend.log
```

---

## Часті Проблеми

### ❌ Port already in use

```bash
# Знайти процес на порту
lsof -i :8090

# Звільнити порт
kill -9 <PID>

# Або змінити порт в docker-compose.yml
ports:
  - "8091:8000"  # Замість 8090
```

### ❌ Docker out of memory

```bash
# Збільшити ліміт пам'яті Docker Desktop
# Preferences → Resources → Memory → 8GB+

# Очистити невикористані ресурси
docker system prune -af
docker volume prune -f
```

### ❌ Database connection refused

```bash
# Перевірити запуск postgres
docker-compose ps postgres

# Перезапустити
docker-compose restart postgres

# Перевірити логі
docker-compose logs postgres
```

### ❌ npm/pnpm install fails

```bash
# Очистити кеш
npm cache clean --force

# Видалити node_modules
rm -rf node_modules package-lock.json

# Перевстановити
npm install
```

### ❌ Python import errors

```bash
# Активувати venv
source .venv/bin/activate

# Перевстановити залежності
pip install -r requirements.txt --force-reinstall
```

### ❌ Permission denied (Docker)

```bash
# macOS/Linux: додати користувача до групи docker
sudo usermod -aG docker $USER

# Перезайти в систему
```

---

## Корисні Команди

### Швидкі alias

Додайте в `~/.zshrc` або `~/.bashrc`:

```bash
alias pred='cd ~/Documents/Predator_21'
alias pred-up='make up'
alias pred-down='make down'
alias pred-logs='make logs'
alias pred-health='make health'
alias pred-test='make test'
```

### Docker shortcuts

```bash
# Швидка перебудова
alias rebuild='docker-compose up -d --build'

# Зупинити все
alias dstop='docker stop $(docker ps -q)'

# Очистити все
alias dclean='docker system prune -af && docker volume prune -f'
```

---

## Наступні кроки

1. **Запустити систему:** `make up`
2. **Відкрити UI:** http://localhost
3. **Перевірити API:** http://localhost:8090/docs
4. **Прочитати документацію:** [SPEC_v25.md](./SPEC_v25.md)
5. **Запустити хаос-тести:** `make chaos`

---

*© 2026 Predator Analytics*
