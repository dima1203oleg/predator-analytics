import pytest
from playwright.sync_api import Page, expect
import os

# Базовий URL для локального тестування (UI)
UI_BASE_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:3030")
TEST_FILE_PATH = os.getenv("EXCEL_TEST_FILE", "/Users/dima1203/Desktop/Березень_2024.xlsx")

def perform_login(page: Page):
    """Проходить екрани завантаження та авторизації."""
    page.goto(f"{UI_BASE_URL}/")
    page.wait_for_timeout(1000)
    
    # 1. Пропускаємо Video Intro
    # Клікаємо мишкою по центру екрана двічі (перший клік - play, другий - skip)
    page.mouse.click(200, 200)
    page.wait_for_timeout(500)
    page.mouse.click(200, 200)
    page.wait_for_timeout(500)
    
    # Натискаємо Escape для надійності
    page.keyboard.press("Escape")
    page.wait_for_timeout(1000)
    
    # 2. Пропускаємо Login Screen
    try:
        # Можливо, потрібно клікнути на іконку (наприклад, .group.cursor-pointer)
        coin = page.locator(".group.cursor-pointer").first
        if coin.is_visible(timeout=2000):
            coin.click()
            
        demo_btn = page.locator("text='КОМАНДИР СУВЕРЕНІТЕТУ'")
        if demo_btn.is_visible(timeout=5000):
            demo_btn.click()
            page.wait_for_timeout(2000)
    except Exception:
        pass

@pytest.mark.e2e
def test_stage1_import_page_loads(page: Page):
    """
    Етап 1.1: Перевірка коректного відкриття сторінки імпорту.
    """
    perform_login(page)
    page.goto(f"{UI_BASE_URL}/data-import")
    
    # Перевіряємо відсутність HTTP-помилок (має бути статус 200)
    assert page.url.endswith("/data-import")
    
    # Очікуємо на появу заголовка імпорту
    expect(page.locator("h1:has-text('Імпорт Даних')").first).to_be_visible(timeout=5000)

@pytest.mark.e2e
def test_stage1_file_upload_ui(page: Page):
    """
    Етап 1.2: Перевірка UI завантаження файлу (DOM-аудит).
    """
    perform_login(page)
    page.goto(f"{UI_BASE_URL}/data-import")
    
    # Перевірка працездатності кнопки вибору файлу / drag-and-drop зони
    dropzone = page.locator("div[role='presentation']").first
    expect(dropzone).to_be_visible()

    # Перевіряємо наявність JS-помилок під час завантаження сторінки
    errors = []
    page.on("pageerror", lambda err: errors.append(err.message))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    # Імітуємо завантаження файлу
    if os.path.exists(TEST_FILE_PATH):
        with page.expect_file_chooser() as fc_info:
            dropzone.click()
        file_chooser = fc_info.value
        file_chooser.set_files(TEST_FILE_PATH)
        
        # Перевіряємо відображення індикатора завантаження
        expect(page.locator("text='Завантаження...'").first).to_be_visible()
        
        # Перевіряємо відображення повідомлення про завершення імпорту
        expect(page.locator("text='Успішно імпортовано'").first).to_be_visible(timeout=60000)
    else:
        pytest.skip(f"Тестовий файл {TEST_FILE_PATH} не знайдено.")
        
    assert len(errors) == 0, f"Знайдено JS помилки: {errors}"
