import os
import pytest
from conftest import FRONTEND_URL, REAL_EXCEL_FILE

@pytest.mark.asyncio
async def test_ui_import_page_load(page):
    """
    DOM-тестування: Перевірка відкриття сторінки імпорту, відсутності JS-помилок.
    """
    errors = []
    page.on("pageerror", lambda err: errors.append(err))

    await page.goto(f"{FRONTEND_URL}/import")
    await page.wait_for_load_state("networkidle")

    assert len(errors) == 0, f"Виявлено JavaScript помилки: {errors}"
    
    # Перевірка наявності зони dropzone
    dropzone = page.locator("[data-testid='file-dropzone']")
    assert await dropzone.is_visible(), "Dropzone відсутній у DOM"

    # Перевірка наявності кнопки завантаження
    upload_btn = page.locator("button:has-text('Завантажити')")
    assert await upload_btn.is_visible(), "Кнопка завантаження відсутня"


@pytest.mark.asyncio
async def test_ui_file_upload_flow(page, test_context):
    """
    DOM-тестування: завантаження реального файлу та перевірка оновлення
    індикаторів прогресу через WebSocket.
    """
    await page.goto(f"{FRONTEND_URL}/import")
    await page.wait_for_load_state("networkidle")

    assert os.path.exists(REAL_EXCEL_FILE), f"Файл не знайдено: {REAL_EXCEL_FILE}"

    file_input = page.locator("input[type='file']")
    await file_input.set_input_files(REAL_EXCEL_FILE)

    upload_btn = page.locator("button:has-text('Завантажити')")
    await upload_btn.click()

    # Очікуємо появи індикатора прогресу
    progress_bar = page.locator("[data-testid='progress-bar']")
    await progress_bar.wait_for(state="visible", timeout=5000)

    # Очікуємо повідомлення про успіх (отримане по WebSocket)
    success_msg = page.locator("text='Успішно завантажено'")
    await success_msg.wait_for(state="visible", timeout=600000) # Даємо 10 хвилин для реального файлу

    # Зберігаємо контекст, що файл завантажився для подальших тестів
    test_context['upload_completed'] = True
    
    # Перевірка оновлення таблиці недавніх імпортів
    recent_table = page.locator("[data-testid='recent-imports-table']")
    assert await recent_table.is_visible()
