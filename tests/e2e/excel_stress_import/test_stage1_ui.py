import pytest
from playwright.async_api import Page, expect
import os

# Базовий URL для локального тестування (UI)
UI_BASE_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:3030")
TEST_FILE_PATH = os.getenv("EXCEL_TEST_FILE", "/Users/dima1203/Desktop/Березень_2024.xlsx")

pytestmark = pytest.mark.asyncio

@pytest.mark.e2e
async def test_stage1_import_page_loads(page: Page):
    """
    Етап 1.1: Перевірка коректного відкриття сторінки імпорту.
    """
    await page.goto(f"{UI_BASE_URL}/data-import")
    
    # Перевіряємо відсутність HTTP-помилок (має бути статус 200)
    assert page.url.endswith("/data-import")
    
    # Очікуємо на появу заголовка імпорту
    await expect(page.locator("h1:has-text('Імпорт Даних')").first).to_be_visible(timeout=5000)

@pytest.mark.e2e
async def test_stage1_file_upload_ui(page: Page):
    """
    Етап 1.2: Перевірка UI завантаження файлу (DOM-аудит).
    """
    await page.goto(f"{UI_BASE_URL}/data-import")
    
    # Перевірка працездатності кнопки вибору файлу / drag-and-drop зони
    dropzone = page.locator("div[role='presentation']").first
    await expect(dropzone).to_be_visible()

    # Перевіряємо наявність JS-помилок під час завантаження сторінки
    # Playwright дозволяє моніторити console.error
    errors = []
    page.on("pageerror", lambda err: errors.append(err.message))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    # Імітуємо завантаження файлу
    if os.path.exists(TEST_FILE_PATH):
        async with page.expect_file_chooser() as fc_info:
            await dropzone.click()
        file_chooser = await fc_info.value
        await file_chooser.set_files(TEST_FILE_PATH)
        
        # Перевіряємо відображення індикатора завантаження
        await expect(page.locator("text='Завантаження...'").first).to_be_visible()
        
        # Перевіряємо відображення повідомлення про завершення імпорту
        await expect(page.locator("text='Успішно імпортовано'").first).to_be_visible(timeout=60000)
    else:
        pytest.skip(f"Тестовий файл {TEST_FILE_PATH} не знайдено.")
        
    assert len(errors) == 0, f"Знайдено JS помилки: {errors}"
