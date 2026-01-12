# 04. Nexus Core UI & Interfaces Specification

## 1. Огляд
Користувацький рівень складається з трьох основних інтерфейсів, об'єднаних в екосистему **Nexus Core**.

## 2. Компоненти UI
### 2.1. Nexus Core (React/Next.js)
Головна адміністративна панель та робоче місце аналітика.
*   **Функції**:
    *   **Dashboard**: Віджети стану системи, метрики ingest/search.
    *   **Pipeline Tree**: Візуалізація ETL процесів.
    *   **Live Monitoring**: Моніторинг роботи агентів в реальному часі (Agent steps log).
    *   **Knowledge Graph**: Візуалізація зв'язків між сутностями.
    *   **Settings**: Керування ключами API, моделями, користувачами.
    *   **Self-Learning Loop Control**: Статистика донавчання.
*   **Media**: STT (Whisper) для голосових команд, TTS для озвучення звітів.

### 2.2. OpenSearch Dashboards
Вбудований (iFrame або лінк) інтерфейс для глибокої аналітики логів та даних.
*   Використовується для побудови складних візуалізацій на основі індексів OpenSearch.
*   Dev Tools для прямих запитів в базу.

### 2.3. OpenWebUI
Чат-інтерфейс для прямої взаємодії з LLM та RAG.
*   Адаптований інтерфейс (по типу ChatGPT) для діалогів з системою.
*   Підтримка вибору моделі, перегляду джерел (citations).

## 3. UX/UI Вимоги (Aesthetics)
*   **Style**: Modern, Premium, Dark Mode default. Glassmorphism, neon accents (Cyberpunk/Sci-Fi vibe matching "Predator" theme).
*   **Responsiveness**: Desktop-first (складні таблиці/графи), але адаптивність мобільним.
*   **Feedback**: Миттєва реакція на дії, спінери/скелетони при завантаженні, тостери для помилок.
*   **Micro-interactions**: Hover effects, smooth transitions.

## 4. Testing Plans
*   **E2E (Cypress/Playwright)**:
    *   Login flow.
    *   File upload -> check status -> check search result.
    *   Chat interaction flow.
*   **Visual Regression**: Snapshot testing компонентів.

## 5. Implementation Blueprints

### Directory Structure
```
frontend/
  src/
    components/
      dashboard/
      pipeline/
      graph/
    pages/
      studio/
      monitoring/
    styles/
      theme.css
```

### Integration
*   Backend API доступний через `/api/v1` (nginx proxy).
*   WebSocket підключення для live-оновлень статусів (Nexus Core Live).
