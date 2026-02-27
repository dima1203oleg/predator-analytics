# Налаштування середовища розробки (Predator Analytics v45.0)

Цей документ пояснює, як підготувати локальне середовище та DevContainer для роботи з Predator v45 | Neural Analytics.0.

## Передумови

- Git
- Docker & Docker Compose (v2.x+)
- Node.js 20+ (для фронтенду)
- Python 3.12+ (для бекенду та оркестратора)
- VS Code з розширенням **Dev Containers**

## Швидкий старт у DevContainer

1. Відкрийте проект у VS Code.
2. Command Palette (F1) → **Dev Containers: Reopen in Container**.
3. Після завантаження встановіть залежності:

```bash
# В терміналі контейнеру
pip install -r apps/backend/requirements.txt
npm install --prefix apps/frontend
```

## Запуск сервісів (локально)

Ми використовуємо Docker Compose з профілями для гнучкого керування сервісами:

```bash
# Запуск базової інфраструктури та бекенду (профіль local)
docker compose --profile local up --build -d

# Запуск повної системи, включаючи моніторинг та оркестратор (профіль server)
docker compose --profile server up --build -d
```

## Локальна розробка Backend

```bash
cd apps/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Локальна розробка Frontend

```bash
cd apps/frontend
npm install
npm run dev
```

## Перевірка працездатності

- **Health Check**: `curl http://localhost:8090/health`
- **Frontend**: `http://localhost:8092`
- **Swagger UI**: `http://localhost:8090/docs`

---

## Рекомендовані розширення VS Code

- **Python** (Microsoft)
- **ESLint** (Dirk Baeumer)
- **Prettier** (Prettier)
- **Docker** (Microsoft)
- **Kubernetes** (Microsoft)
- **Tailwind CSS IntelliSense**

---

## Безпека

1. Ніколи не коммітьте файл `.env`.
2. Використовуйте `.env.example` як шаблон для власних секретів.
3. Перед коммітом переконайтеся, що `dynamic_keys.json` не містить реальних ключів.

## CI/CD та Релізи

Для випуску нової версії:
1. Створіть семантичний тег: `git tag -a v45.0.1 -m "Release v45.0.1"`.
2. Відправте тег у репозиторій: `git push origin v45.0.1`.
3. GitHub Actions автоматично збере образ та оновить Helm чарти.
