import pytest
import os
import time

# Playwright requires to be run with the pytest-playwright plugin.
# Run with: pytest tests/e2e/test_ui_dom.py --headed

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3030")

@pytest.mark.asyncio
async def test_ui_import_page_load(page):
    """
    Перевірка відкриття сторінки імпорту, відсутності JS-помилок
    та наявності необхідних компонентів DOM (кнопки, драг-енд-дроп).
    """
    errors = []
    page.on("pageerror", lambda err: errors.append(err))
    
    await page.goto(f"{FRONTEND_URL}/import")
    
    # Чекаємо поки DOM відрендериться
    await page.wait_for_load_state("networkidle")
    
    assert len(errors) == 0, f"Виявлено JavaScript помилки: {errors}"
    
    # Перевірка наявності зони dropzone
    dropzone = page.locator("[data-testid='file-dropzone']")
    assert await dropzone.is_visible(), "Dropzone відсутній у DOM"
    
    # Перевірка наявності кнопки завантаження
    upload_btn = page.locator("button:has-text('Завантажити')")
    assert await upload_btn.is_visible(), "Кнопка завантаження відсутня"

@pytest.mark.asyncio
async def test_ui_file_upload_flow(page):
    """
    Симуляція завантаження файлу через UI та перевірка оновлення 
    індикаторів прогресу через WebSocket.
    """
    await page.goto(f"{FRONTEND_URL}/import")
    await page.wait_for_load_state("networkidle")
    
    # Встановлюємо файл в інпут
    test_file_path = os.getenv("REAL_EXCEL_FILE")
    if not test_file_path or not os.path.exists(test_file_path):
        test_file_path = "/tmp/ui_test_file.xlsx"
        if not os.path.exists(test_file_path):
            import pandas as pd
            df = pd.DataFrame({"A": [1, 2], "B": [3, 4]})
            df.to_excel(test_file_path, index=False)
            
    print(f"Uploading file: {test_file_path}")
        
    file_input = page.locator("input[type='file']")
    await file_input.set_input_files(test_file_path)
    
    # Натискаємо завантажити
    upload_btn = page.locator("button:has-text('Завантажити')")
    await upload_btn.click()
    
    # Очікуємо появи індикатора прогресу
    progress_bar = page.locator("[data-testid='progress-bar']")
    await progress_bar.wait_for(state="visible", timeout=5000)
    
    # Очікуємо повідомлення про успіх (отримане по WebSocket)
    success_msg = page.locator("text='Успішно завантажено'")
    await success_msg.wait_for(state="visible", timeout=30000)
    
    # Перевірка оновлення таблиці недавніх імпортів
    recent_table = page.locator("[data-testid='recent-imports-table']")
    assert await recent_table.is_visible()
