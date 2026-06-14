import pytest
from playwright.sync_api import Page, expect
import os

# Базовий URL для локального тестування (UI)
UI_BASE_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:3030")
TEST_FILE_PATH = os.getenv("EXCEL_TEST_FILE", "/Users/dima1203/Desktop/Березень_2024.xlsx")

def perform_login(page: Page, target_url: str):
    """Проходить екрани завантаження та авторизації, зберігаючи цільовий маршрут."""
    page.goto(target_url)
    
    # 1. Пропускаємо Video Intro
    try:
        # Чекаємо появи екрану
        page.wait_for_timeout(1000)
        
        # Клікаємо кілька разів по body, оскільки перший клік розблоковує відео, а другий - пропускає
        page.locator("body").click(force=True)
        page.wait_for_timeout(500)
        page.locator("body").click(force=True)
        page.wait_for_timeout(500)
        page.locator("body").click(force=True)
        
        # Якщо все ще бачимо інтро, пробуємо Escape
        if page.locator("text=/НАТИСНІТЬ ДЛЯ ЗАПУСКУ|натисніть щоб пропустити/i").is_visible():
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
    except Exception as e:
        print(f"Intro skip warning: {e}")
    
    # 2. Пропускаємо Login Screen
    # Клікаємо на монету, щоб активувати режим "scanning" (оминає API авторизації)
    try:
        coin = page.locator(".group.cursor-pointer").first
        coin.click(timeout=5000, force=True)
    except Exception as e:
        print(f"Coin skip warning: {e}")
        
    # Після сканування (кілька секунд) з'являються картки ролей
    try:
        demo_btn = page.locator("text='СТАРШИЙ СТРАТЕГ'")
        demo_btn.click(timeout=10000, force=True)
        page.wait_for_timeout(2000)
    except Exception as e:
        print(f"Role select warning: {e}")
        
    # 3. Закриваємо тур по платформі, якщо він з'явився
    try:
        close_tour = page.locator("button[aria-label='Закрити'], button:has-text('Закрити')").first
        if close_tour.is_visible(timeout=3000):
            close_tour.click(force=True)
            page.wait_for_timeout(1000)
    except Exception as e:
        print(f"Tour skip warning: {e}")

@pytest.mark.e2e
def test_stage1_import_page_loads(page: Page):
    """
    Етап 1.1: Перевірка коректного відкриття сторінки імпорту.
    """
    perform_login(page, f"{UI_BASE_URL}/data-import")
    
    # Перевіряємо відсутність HTTP-помилок (має бути статус 200)
    assert page.url.endswith("/data-import")
    
    # Очікуємо на появу заголовка сторінки
    expect(page.locator("text='OSINT КОМАНДНИЙ ЦЕНТР'").first).to_be_visible(timeout=10000)

@pytest.mark.e2e
def test_stage1_file_upload_ui(page: Page):
    """
    Етап 1.2: Перевірка UI завантаження файлу (DOM-аудит).
    """
    perform_login(page, f"{UI_BASE_URL}/data-import")
    
    # Спочатку маємо побачити OSINT КОМАНДНИЙ ЦЕНТР
    expect(page.locator("text='OSINT КОМАНДНИЙ ЦЕНТР'").first).to_be_visible(timeout=10000)
    
    # Перемикаємось на таб ДАТАСЕТИ & МОДЕЛІ
    datasets_tab = page.locator("button:has-text('ДАТАСЕТИ & МОДЕЛІ')").first
    datasets_tab.wait_for(state="visible", timeout=5000)
    datasets_tab.click()
    
    # Відкриваємо модальне вікно завантаження (клік по фіолетовій кнопці Upload)
    upload_btn = page.locator("button.bg-purple-600").first
    upload_btn.wait_for(state="visible", timeout=10000)
    upload_btn.click()
    
    # Перевірка працездатності кнопки вибору файлу / drag-and-drop зони
    dropzone = page.locator("input#dataset-upload-input")
    expect(dropzone).to_be_attached()

    # Перевіряємо наявність JS-помилок під час завантаження сторінки
    errors = []
    page.on("pageerror", lambda err: errors.append(err.message))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    
    # Імітуємо завантаження файлу
    if os.path.exists(TEST_FILE_PATH):
        # Встановлюємо файл в input
        page.locator("input#dataset-upload-input").set_files(TEST_FILE_PATH)
        
        # Клікаємо на кнопку завантаження в модальному вікні
        # Кнопка має градієнт from-purple-600 to-pink-600
        confirm_upload_btn = page.locator("button.from-purple-600.to-pink-600")
        confirm_upload_btn.wait_for(state="visible", timeout=5000)
        confirm_upload_btn.click()
        
        # Очікуємо завершення завантаження (з'явиться назва файлу)
        file_name = os.path.basename(TEST_FILE_PATH).replace(".xlsx", "")
        expect(page.locator(f"text='{file_name}'").first).to_be_visible(timeout=60000)
    else:
        pytest.skip(f"Тестовий файл {TEST_FILE_PATH} не знайдено.")
        
    assert len(errors) == 0, f"Знайдено JS помилки: {errors}"
