---
description: Verify the E2E Testing UI and Backend Integration
---

# E2E Testing Verification

Цей workflow перевіряє, що Testing Lab UI правильно інтегрований з E2E Backend API.

## Prerequisites

- Predator Analytics stack запущений на сервері
- Frontend доступний на `http://194.177.1.240:3000` (або локально на `http://localhost:3000`)
- Backend доступний на `http://194.177.1.240:8000` (або локально на `http://localhost:8000`)

## Steps

### 1. Access the Testing Lab

- Open Browser: `http://194.177.1.240:3000`
- Login (if required)
- Navigate to Sidebar -> **ENGINEERING** -> **Тест Лабораторія**

### 2. Verify Model Health

- Click the **Refresh Status** button in the top right
- **Expectation**: All models (Groq, DeepSeek, Gemini, Karpathy) should show a status (Healthy/Offline/Degraded)
- If offline, ensure `.env` keys are set

### 3. Run Full E2E Cycle

- Locate the **Full E2E Cycle** card
- Click the **Run** (Play) button
- **Expectation**:
  - Terminal output shows "Initializing Full E2E Test Run..."
  - Progress bar appears and fills up
  - Logs show "Backend processing complete."
  - Reports (PDF/Markdown) appear in the "Generated Reports" section

### 4. Verify Backend Status

Run the following curl command to check if the test run was recorded:

```bash
curl http://194.177.1.240:8000/api/v1/e2e/processing/status
```

**Expectation**: Should return `{"status": "complete", "run_id": "..."}`.

### 5. Download Reports

- Click on the PDF and Markdown icons in the UI
- **Expectation**: Files should download successfully

## Troubleshooting

| Проблема | Рішення |
|----------|---------|
| **Model Health fails** | Перевірте `docker logs predator_backend` на помилки API ключів |
| **E2E Cycle hangs** | Перевірте `docker logs predator_celery_worker` на помилки задач |
| **Reports не генеруються** | Переконайтесь що `reportlab` встановлено в backend контейнері |
