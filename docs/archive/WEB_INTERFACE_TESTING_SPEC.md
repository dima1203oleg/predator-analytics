
## 1. Мета
Забезпечити повну автоматизовану перевірку працездатності всіх компонентів системи (Backend, AI Brain, Data Ingestion, STT/TTS) через єдиний веб-інтерфейс.

## 2. Функціональні Вимоги до Інтерфейсу

### 2.1. Панель "System Health Check"
- **Кнопка запуску**: `[ ▶️ Run Full System Diagnostic ]`
- **Візуалізація**: Прогрес-бар виконання тестів у реальному часі.
- **Логування**: Вікно консолі (терміналу) у браузері, що показує кроки (`Checking Redis... OK`, `Pinging Groq... OK`).

### 2.2. Сценарії Перевірки (Test Suite)

#### 🧬 Блок 1: Інфраструктура (Infrastructure)
1.  **Ping Server**: Перевірка доступності Backend API.
2.  **Database**: Підключення до Redis (Hot Storage) та PostgreSQL (Cold Storage).
3.  **Vector DB**: Перевірка статусу Qdrant (або FAISS) для RAG.

#### 🧠 Блок 2: AI Brain (LLM Council)
Система має послідовно відправити тестовий запит ("Say 'System Operational'") до кожної налаштованої моделі:
*   [x] **Groq** (Llama 3.3) — *Primary*
*   [x] **Gemini** (Pro/Flash) — *Fallback*
*   [x] **Mistral** — *Specific Tasks*
*   [x] **DeepSeek** — *Code Analysis*
*   [x] **Ollama** (Local) — *Offline Backup*

*Якщо модель недоступна (помилка 401/404), тест позначається як ⚠️ SKIPPED або ❌ FAILED, але не зупиняє загальний процес.*

#### 🗣️ Блок 3: Voice Interface (STT/TTS)
1.  **TTS (Text-to-Speech)**: Генерація аудіо-файлу з текстом "Audio check passed". Відтворення у браузері.
2.  **STT (Speech-to-Text)**: (Опціонально) Завантаження еталонного аудіо-файлу та звірка розпізнаного тексту.

#### 📂 Блок 4: Data Ingestion & Search
1.  **Test File**: Автоматичне завантаження (або використання існуючого) файлу `dummy_data.xlsx`.
2.  **Indexing**: Перевірка, чи з'явились дані у пошуковому індексі.
3.  **Search Query**: Виконання тестового пошуку по завантаженим даним.

### 2.3. Звітність (Reporting)
- Після завершення (або зупинки) тестів генерується звіт.
- **Формат**: Markdown (відображення в чаті) та PDF (опція завантаження).
- **Зміст**:
    - Загальний статус (Healthy / Degraded)
    - Час реакції кожного сервісу (Latency).
    - Список непрацюючих компонентів з кодами помилок.

## 3. Технічна Реалізація

### 3.1. Backend (Python/FastAPI)
- Ендпоінт `POST /api/v1/system/diagnose`.
- Асинхронний запуск тестів (background task).
- Streaming Response (SSE або WebSocket) для оновлення UI у реальному часі.

### 3.2. Frontend (React/Next.js)
- Компонент `DiagnosticsPanel`.
- Індикатори статусу (Green/Red/Yellow dots).
- Інтеграція з Markdown рендерером для звіту.

## 4. План Дій (Roadmap)
1.  Створити скрипт `backend/orchestrator/diagnostics.py` (Backend логіка).
2.  Додати API роут у `main.py`.
3.  Створити сторінку `checks` у веб-інтерфейсі.
4.  Інтегрувати це у головне меню Telegram бота як Web App (або посилання).
