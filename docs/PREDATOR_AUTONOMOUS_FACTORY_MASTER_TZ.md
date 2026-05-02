# УНІВЕРСАЛЬНЕ МАЙСТЕР-ТЗ (MASTER TECHNICAL SPECIFICATION)
**PREDATOR Analytics v61.0-ELITE: Autonomous Factory & Sovereign Command Center**

> [!IMPORTANT]
> **ПРИНЦИП DUAL-EXECUTION (Двоїсте Виконання)**: Це Технічне Завдання (ТЗ) спроектоване як канонічний контракт. 
> - **Для ШІ-Агента**: Це набір детермінованих шляхів, жорстких правил (HR) та алгоритмів.
> - **Для Інженера-Людини**: Це контекст, бізнес-логіка та архітектурне бачення.
> **Результат роботи будь-якої сутності за цим ТЗ має бути побітово ідентичним.**

---

## 1. ГЛОБАЛЬНА ПАРАДИГМА (THE CORE PARADIGM)

Система **PREDATOR Analytics** працює в парадигмі **Sovereign Headless Architecture**. 
Це означає абсолютну ізоляцію, відсутність залежностей від публічних SaaS та самовдосконалення через закритий OODA-цикл (Observe, Orient, Decide, Act).

### 1.1. Жорсткі Обмеження (Hard Rules - HR)
Ці правила є непорушними. Їх порушення призводить до відхилення PR або зупинки системи.
- **HR-01 / HR-02**: Python 3.12, Mypy Strict (жодних `Any` без коментаря).
- **HR-03 / HR-04**: 100% українська мова в коді, коментарях, документації та UI. Англійська в інтерфейсі — критичний баг.
- **HR-13**: Коміти виключно у форматі `feat|fix|chore|docs(scope): опис` (Autonomous Commit Protocol).
- **HR-21 / HR-22**: ZERO-LOCAL-DEPLOYMENT. Робоча машина (MacBook) — тільки IDE/Browser. Усі контейнери, бази (PostgreSQL, ClickHouse, Neo4j, Qdrant) та LLM запускаються виключно на iMac (192.168.0.199) або NVIDIA Server (194.177.1.240).

---

## 2. ТОПОЛОГІЯ РЕПОЗИТОРІЮ (DETERMINISTIC MAPPING)

Кожна сутність повинна орієнтуватися в кодовій базі за єдиною матрицею шляхів. Створення файлів поза цими межами заборонено.

```text
/Users/Shared/Predator_60/
├── apps/predator-analytics-ui/          # [FRONTEND] React 18, Vite, Tailwind CSS (Порт 3030)
│   ├── src/pages/admin/AdminHub.tsx     # Точка входу Sovereign Command Center
│   ├── src/components/layout/           # TopBar, VerticalTabNav, Sidebar
│   └── src/features/ai/                 # Вкладки фабрики (ChiefConductor, CouncilJudge)
├── services/                            # [BACKEND] Мікросервіси
│   ├── core-api/                        # FastAPI (Порт 8000), SQLAlchemy, AsyncPG
│   └── autonomous-agent/                # [AGENT] Python-скрипти OODA (LangGraph, LiteLLM)
├── libs/predator-common/                # Спільний Python-код (Models, Utils, Auth)
├── db/                                  # Схеми: postgres/init.sql, neo4j/schema.cypher
└── deploy/                              # docker-compose.yml, helm/, scripts/
```

---

## 3. UI/UX: SOVEREIGN COMMAND CENTER

Інтерфейс — це єдине вікно керування автономною системою. 

### 3.1. Візуальна мова (Military Cyberpunk Dark UI)
- **Фон**: `#050505` (Глибокий космос).
- **Акценти**: Неон. Cyan (`#00F5FF`) для активності, Emerald (`#00FF9D`) для успіху/завершення, Rose/Red (`#FF0033`) для загроз/Kill-Switch.
- **Матеріали**: Скло (Glassmorphism), розмиття фону (`backdrop-blur-md`), напівпрозорі рамки (`border-white/10`).
- **Анімації**: `framer-motion`. Плавна поява (`opacity: 0 -> 1`), зсув (`y: 20 -> 0`).

### 3.2. Навігаційна Модель (Tri-State Layout)
Файл: `apps/predator-analytics-ui/src/pages/admin/AdminHub.tsx`
1. **TopBar**: Горизонтальне меню для глобальних категорій (`INFRASTRUCTURE`, `AUTONOMOUS_FACTORY`, `DILIGENCE`).
2. **VerticalTabNav**: Вертикальна бічна панель, яка рендериться *тільки* для дочірніх вкладок обраної категорії.
3. **Workspace**: Основна зона для рендеру вмісту (View).

---

## 4. АВТОНОМНА ФАБРИКА (OODA 2.0)

Модуль `AUTONOMOUS_FACTORY` містить 3 ключові компоненти. Вони повинні бути реалізовані як ізольовані React-компоненти.

### 4.1. ChiefConductorView (Оркестратор)
- **Шлях**: `src/features/ai/ChiefConductorView.tsx`
- **Завдання**: Візуалізація поточних графів LangGraph, статусів воркерів (Researcher, Graph Analyst) та навантаження на VRAM/GPU.
- **Елементи UI**: Радар OODA, список активних потоків, індикатори навантаження (прогрес-бари).

### 4.2. CouncilJudgeView (ЛЛМ-Рада)
- **Шлях**: `src/features/ai/CouncilJudgeView.tsx`
- **Завдання**: Відображення консенсусу кількох ШІ-моделей.
- **Алгоритм відображення**: Система показує 3 "голоси" (напр., LLaMA-3, Qwen-Coder, Gemini), їхній рівень впевненості (Confidence %) та фінальне рішення (Verdict).

### 4.3. TelegramCenterView (Управління Зв'язком)
- **Шлях**: `src/features/ai/TelegramCenterView.tsx`
- **Завдання**: Інтерфейс для моніторингу команд, надісланих системі через Telegram-бота, та налаштувань сповіщень.
- **Критична Фіча**: Кнопка `KILL-SWITCH` (червоний неон, пульсація) для екстреної зупинки автономного агента.

---

## 5. ПРОТОКОЛ РОЗРОБКИ ТА РОЗГОРТАННЯ (MACHINE & HUMAN WORKFLOW)

Незалежно від того, хто виконує завдання (Кодер-людина чи Antigravity-ШІ), послідовність дій завжди має бути наступною:

### Етап 1: Імплементація (Coding)
1. **TypeScript/React**: Усі компоненти створюються строго з типізацією (інтерфейси для Props). Відмова від `any`.
2. **TailwindCSS**: Використовуються utility-класи. Жодних кастомних CSS файлів (окрім глобального `index.css`).

### Етап 2: Автоматизоване Тестування (Verification)
Для ШІ: запуск CLI команд через інструмент `run_command`.
Для Людини: виконання команд у терміналі.
```bash
# Перевірка збірки UI
cd apps/predator-analytics-ui
npm run build
```

### Етап 3: Autonomous Commit Protocol (ACP)
Кожна завершена логічна одиниця фіксується в Git за строгим протоколом:
```bash
git add .
git commit -m "feat(ai): додати ChiefConductorView для оркестрації задач" --no-verify
git pull --rebase
git push --no-verify
```
*Примітка: `--no-verify` дозволено для прискорення OODA-циклу ШІ, якщо хуки заважають автоматизації.*

### Етап 4: Інфраструктурна Синхронізація
Скрипти бекенду (напр., `council_judge.py`) або оновлення `docker-compose.yml` деплояться на цільовий вузол (iMac/NVIDIA) через Zrok-тунелі.
Заборонено запускати `docker-compose up` на локальному MacBook!

---

## 6. ВЕРИФІКАЦІЙНИЙ КОНТРАКТ (ACCEPTANCE CRITERIA)

Як перевірити, що ТЗ виконано на 100% (для машинних тестів та людського QA):

1. **DOM-верифікація**: При навігації на `http://localhost:3030/admin/command?tab=factory-ooda` в DOM-дереві має з'являтися `<VerticalTabNav>` і `<ChiefConductorView>`.
2. **Браузерна консоль**: Відсутність помилок гідратації React або Type Errors.
3. **Мережа**: Backend-сервіс `autonomous-agent` працює у фоні і не блокує UI.
4. **Localization**: При повному текстовому скануванні UI компонента слово "Search" не знайдено, присутнє лише слово "Пошук". Англійських термінів (крім брендів і кодів) в інтерфейсі немає.

> **END OF SPECIFICATION.** 
> *Затверджено для виконання всіма Sovereign-агентами та інженерами PREDATOR Analytics.*
