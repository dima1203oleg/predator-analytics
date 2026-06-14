import pytest
import os
import aiohttp
import asyncio
from playwright.async_api import Page, expect

API_BASE_URL = os.getenv("PREDATOR_API_URL", "http://localhost:8000/api/v1")
UI_BASE_URL = os.getenv("VITE_API_BASE_URL", "http://localhost:3030")
STRESS_TEST_DIR = os.getenv("EXCEL_STRESS_DIR", "/Users/dima1203/Desktop/Customs_Data")

pytestmark = pytest.mark.asyncio

@pytest.mark.e2e
async def test_stage8_ui_dom_update(page: Page):
    """
    Етап 8: Перевірка відображення у веб-інтерфейсі (DOM Audit 2)
    - таблиці показують нові записи
    - графіки перебудовані
    """
    await page.goto(f"{UI_BASE_URL}/dashboard")
    
    # Очікуємо на появу таблиці або віджета зі статистикою
    await expect(page.locator("text='Загальна сума'").first).to_be_visible(timeout=10000)
    
    # Перевіряємо, що в таблиці є дані (не пуста)
    table_rows = page.locator("table tbody tr")
    count = await table_rows.count()
    assert count > 0, "Таблиця даних пуста після імпорту!"

@pytest.mark.e2e
async def test_stage9_mass_import():
    """
    Етап 9: Масове тестування (96 файлів)
    """
    if not os.path.exists(STRESS_TEST_DIR):
        pytest.skip(f"Директорія з архівом файлів {STRESS_TEST_DIR} не знайдена.")
        
    excel_files = [f for f in os.listdir(STRESS_TEST_DIR) if f.endswith(".xlsx")]
    if len(excel_files) == 0:
        pytest.skip("Немає файлів для масового імпорту.")

    print(f"Починаємо стрес-тест імпорту {len(excel_files)} файлів...")

    async with aiohttp.ClientSession() as session:
        for filename in excel_files:
            filepath = os.path.join(STRESS_TEST_DIR, filename)
            
            with open(filepath, 'rb') as f:
                data = aiohttp.FormData()
                data.add_field('file', f, filename=filename)
                
                # Завантаження
                async with session.post(f"{API_BASE_URL}/ingestion/upload", data=data) as resp:
                    assert resp.status in (200, 202)
                    result = await resp.json()
                    job_id = result.get("job_id")
                    
            # Очікування ETL (спрощене для стрес-тесту)
            completed = False
            for _ in range(60): # 5 хвилин максимум на файл
                async with session.get(f"{API_BASE_URL}/ingestion/jobs/{job_id}") as resp:
                    status_data = await resp.json()
                    if status_data.get("status") == "COMPLETED":
                        completed = True
                        break
                    elif status_data.get("status") == "FAILED":
                        pytest.fail(f"Файл {filename} не завантажився: {status_data}")
                await asyncio.sleep(5)
                
            assert completed, f"Таймаут ETL для файлу {filename}"
            print(f"✅ Файл {filename} успішно оброблено.")
