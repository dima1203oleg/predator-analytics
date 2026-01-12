# 🔍 UI GUARDIAN - ЩО ПЕРЕВІРЯЄ ТА ЩО ТРЕБА ВИПРАВИТИ

## 📊 Які сторінки перевіряє UI Guardian:

### ✅ Критичні (3 сторінки):
1. **Dashboard** (`/`) - Головна сторінка з метриками
2. **Search Console** (`/search`) - Пошук документів
3. **Monitoring** (`/monitoring`) - Моніторинг системи

### ⚠️ Високий пріоритет (2 сторінки):
4. **Dataset Studio** (`/dataset-studio`) - Робота з даними
5. **LLM Council** (`/council`) - AI рада

### 📝 Середній пріоритет (4 сторінки):
6. **Analytics** (`/analytics`) - Аналітика
7. **Settings** (`/settings`) - Налаштування
8. **Security** (`/security`) - Безпека
9. **AI Agents** (`/agents`) - Моніторинг агентів

### 📋 Низький пріоритет (2 сторінки):
10. **Databases** (`/databases`) - Управління БД
11. **Infrastructure** (`/infrastructure`) - Інфраструктура

---

## 🔍 Що перевіряє на кожній сторінці:

UI Guardian **автоматично** перевіряє:

### 1. HTTP Status
- ✅ Сторінка відповідає (200 OK)
- ❌ Помилка (404, 500, etc.)

### 2. UI Елементи (10 категорій)
- **Buttons** - скільки кнопок, чи працюють
- **Links** - всі посилання
- **Forms** - поля введення, селекти
- **Charts** - візуалізації даних (canvas, svg)
- **Tables** - таблиці з даними
- **Cards** - картки/панелі
- **Modals** - модальні вікна
- **Navigation** - меню навігації
- **Icons** - іконки
- **Images** - зображення

### 3. Accessibility
- Кнопки без labels
- Зображення без alt text
- Form inputs без labels

### 4. JavaScript Errors
- Console errors
- Runtime помилки

### 5. Screenshots
- Робить повні screenshots для аналізу

---

## 🤖 Що робить UI Guardian автоматично:

```python
КОЖНОГО РАЗУ коли запускається:
  1. Відкриває Chromium (headless)
  2. Переходить на кожну з 11 сторінок
  3. Чекає завантаження (networkidle)
  4. Рахує всі елементи
  5. Перевіряє accessibility
  6. Робить screenshot
  7. Генерує suggestions для покращення

  ЯКЩО знаходить high priority issues:
    → Створює task для Code Improver
    → Code Improver генерує код
    → Council перевіряє
    → ТИ отримуєш approval в Telegram
```

---

## ⚠️ ПРОБЛЕМА: Docker не запущений!

```bash
$ docker ps
Cannot connect to the Docker daemon
```

**UI Guardian НЕ МОЖЕ працювати** без запущеного frontend!

### Чому не працює:

1. ❌ **Frontend не запущений** (Docker containers down)
2. ❌ UI Guardian не може підключитись до `http://frontend:80`
3. ❌ Сторінки недоступні
4. ❌ Тестування неможливе

---

## 🚀 ЩОБ ЗАПУСТИТИ UI GUARDIAN:

### Крок 1: Запусти Docker containers

```bash
cd /Users/dima-mac/Documents/Predator_21

# Запусти всі сервіси
docker compose up -d --build

# Перевір що запустились
docker ps
# Має бути: frontend, backend, postgres, redis, opensearch
```

### Крок 2: Перевір що frontend доступний

```bash
# З MacBook (якщо frontend на порту 3000)
curl http://localhost:3000

# Або відкрий в браузері
open http://localhost:3000
```

### Крок 3: Запусти UI Guardian вручну

```bash
# Тест окремо
cd /Users/dima-mac/Documents/Predator_21

python3 << 'EOF'
import asyncio
from backend.orchestrator.tasks.ui_guardian import UIGuardian

async def test():
    guardian = UIGuardian()
    guardian.base_url = "http://localhost:3000"  # Твій frontend
    result = await guardian.check_ui()
    print(result)

asyncio.run(test())
EOF
```

### Крок 4: Орщелюбо запусти повну систему

```bash
# запустить orchetrtr він сам запустить UI Guardian
./scripts/start_predator.sh
# Вибери: 2) Повна система
```

---

## 📊 ЩО ВИПРАВЛЯЄ СИСТЕМА:

### Останні виправлення (автоматичні):

**UI покращення (rotation list):**
1. ✅ Dashboard charts - додавання більше графіків
2. ✅ Dark mode toggle - ThemeSwitcher component
3. ✅ AI Agents monitoring dashboard - AgentsView
4. ✅ Loading skeletons - для таблиць
5. ✅ Toast notifications - система повідомлень
6. ✅ Search filters panel - розширені фільтри

**Backend оптимізації:**
1. ✅ Connection pooling для PostgreSQL
2. ✅ Redis caching decorator
3. ✅ Batch embedding generation
4. ✅ Prometheus metrics для LLM API

### Як це працює:

```
INFINITE LOOP (кожні 2 секунди):
  1. Бере задачу з rotation list (iteration % 9)
  2. Генерує код через LLM (Gemini/Groq)
  3. Council перевіряє (Chairman, Critic, Analyst)
  4. ТИ отримуєш approval в Telegram
  5. Якщо схвалюєш → код застосовується
  6. Git commit + push
  7. Переходить до наступної задачі
```

---

## 🎯 ЯКЩО СТОРІНКИ НЕ ПРАЦЮЮТЬ:

### Перевір frontend в браузері:

```bash
# Відкрий кожну сторінку:
http://localhost:3000/               # Dashboard
http://localhost:3000/search         # Search Console
http://localhost:3000/monitoring     # Monitoring
http://localhost:3000/dataset-studio # Dataset Studio
http://localhost:3000/council        # LLM Council
# і т.д.
```

### Які помилки можуть бути:

1. **404 Not Found** → Маршрут не існує в frontend
2. **500 Server Error** → Backend API не відповідає
3. **Blank Page** → JavaScript crash
4. **Infinite Loading** → API endpoint не працює

### UI Guardian створить tasks для виправлення:

```
ЯКЩО знайде проблему:
  → Генерує suggestion
  → Створює task для Code Improver
  → Code Improver генерує виправлення
  → ТИ отримуєш в Telegram для approval
```

---

## 📝 ЛОГИ UI GUARDIAN:

Подивись в логах orchetrator:

```bash
# Якщо запущений в Docker
docker logs predator_orchestrator | grep "UI Guardian"

# Або файл логів
tail -f /app/orchestrator/system.log | grep "UI Guardian"

# Локально
tail -f backend/orchestrator/system.log | grep "UI Guardian"
```

Що шукати:
```
✅ UI Guardian: Starting comprehensive check...
✅ UI Guardian: All checks passed (11 pages, 234 elements)
⚠️ UI Guardian: 3 pages have issues
🎨 UI Guardian: Proposing 5 improvements to Council...
```

---

## 🔧 ШВИДКЕ ВИПРАВЛЕННЯ:

### 1. Запусти Docker:
```bash
docker compose up -d
```

### 2. Перевір frontend:
```bash
curl http://localhost:3000
```

### 3. Запусти orchestrator:
```bash
./scripts/start_predator.sh
# Вибери: 2) Повна система
```

### 4. Дивись Telegram:
Orchestrator буде надсилати approval requests для кожного виправлення!

---

## 💡 SUMMARY:

**UI Guardian перевіряє:** 11 сторінок
**Що шукає:** HTTP errors, missing elements, accessibility issues
**Що робить:** Створює tasks для Code Improver
**Як виправляє:** Генерує код → Council → Твоє approval → Git commit

**Проблема зараз:** Docker не запущений → frontend недоступний → UI Guardian не може працювати

**Рішення:** Запусти Docker + Orchestrator → система сама знайде та виправить проблеми!

---

**Запусти систему і дивись як вона сама виправляєUI! 🚀**
