---
description: Verify the E2E Testing UI and Backend Integration
---

# E2E Testing Verification

This workflow verifies that the new "Testing Lab" UI is correctly integrated with the E2E Backend API.

## Prerequisites
- Predator Analytics stack must be running (`./start_local.sh`).
- Frontend accessible at `http://localhost:8082`.
- Backend accessible at `http://localhost:8000`.

## Steps

1. **Access the Testing Lab**
   - Open Browser: `http://localhost:8082`
   - Login (if required).
   - Navigate to Sidebar -> **ENGINEERING** -> **Тест Лабораторія**.

2. **Verify Model Health**
   - Click the **Refresh Status** button in the top right.
   - **Expectation**: All models (Groq, DeepSeek, Gemini, Karpathy) should show a status (Healthy/Offline/Degraded). If offline, ensure `.env` keys are set.

3. **Run Full E2E Cycle**
   - Locate the **Full E2E Cycle** card.
   - Click the **Run** (Play) button.
   - **Expectation**:
     - Terminal output shows "Initializing Full E2E Test Run...".
     - Progress bar appears and fills up.
     - Logs show "Backend processing complete."
     - Reports (PDF/Markdown) appear in the "Generated Reports" section.

4. **Verify Backend Status**
   - Run the following curl command to check if the test run was recorded:
   ```bash
   curl http://localhost:8000/api/v1/e2e/processing/status
   ```
   - **Expectation**: Should return `{"status": "complete", "run_id": "..."}`.

5. **Download Reports**
   - Click on the PDF and Markdown icons in the UI.
   - **Expectation**: Files should download successfully.

## Troubleshooting

- If **Model Health** fails: Check `predator-backend` logs for API Key errors.
- If **E2E Cycle** hangs: Check `predator-celery_worker` logs for background task errors.
- If **Reports** differ: Ensure `reportlab` is installed in the backend container.
