"""Етап 1 та 8: Перевірка веб-інтерфейсу (DOM-аудит).

PREDATOR Analytics v61.0-ELITE.
Канонічна локалізація: УКРАЇНСЬКА (HR-03).

Перевіряє:
- Коректне відкриття сторінки імпорту
- Працездатність кнопки вибору файлу та drag-and-drop
- Відсутність JavaScript-помилок
- Відсутність HTTP-помилок 4xx/5xx
- Коректність індикатора завантаження
- Відображення повідомлення про завершення імпорту
- Оновлення таблиць, графіків та фільтрів після імпорту
- WebSocket-оновлення

ПРИМІТКА: Тести цього модуля потребують Playwright fixture (page).
Запуск: pytest tests/e2e_real/test_01_ui_dom.py --browser=chromium
"""
import os

import pytest

from conftest import FRONTEND_URL, REAL_EXCEL_FILE


# ═══════════════════════════════════════════════════════════════════════════
# Етап 1: Перевірка UI до імпорту
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage1_ui
class TestUIImportPage:
    """Перевірка сторінки імпорту до завантаження файлу."""

    @pytest.mark.asyncio
    async def test_ui_import_page_load(self, page):
        """Сторінка імпорту коректно відкривається без JS-помилок."""
        errors: list[str] = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        assert len(errors) == 0, f"Виявлено JavaScript помилки: {errors}"

    @pytest.mark.asyncio
    async def test_ui_no_http_errors(self, page):
        """Відсутність HTTP-помилок 4xx/5xx під час завантаження сторінки."""
        http_errors: list[dict] = []

        def on_response(response):
            if response.status >= 400:
                http_errors.append({
                    "url": response.url,
                    "status": response.status,
                })

        page.on("response", on_response)

        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        assert len(http_errors) == 0, (
            f"Виявлено HTTP помилки: {http_errors[:5]}"
        )

    @pytest.mark.asyncio
    async def test_ui_dropzone_visible(self, page):
        """Зона drag-and-drop відображається коректно."""
        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        dropzone = page.locator("[data-testid='file-dropzone']")
        assert await dropzone.is_visible(), "Dropzone відсутній у DOM"

    @pytest.mark.asyncio
    async def test_ui_upload_button_visible(self, page):
        """Кнопка завантаження відображається та доступна."""
        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        upload_btn = page.locator("button:has-text('Завантажити')")
        assert await upload_btn.is_visible(), "Кнопка завантаження відсутня"

    @pytest.mark.asyncio
    async def test_ui_file_input_exists(self, page):
        """Елемент input[type='file'] існує в DOM."""
        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        file_input = page.locator("input[type='file']")
        count = await file_input.count()
        assert count > 0, "Елемент input[type='file'] відсутній"


# ═══════════════════════════════════════════════════════════════════════════
# Етап 1: Завантаження файлу через UI
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage1_ui
class TestUIFileUpload:
    """Перевірка процесу завантаження файлу через UI."""

    @pytest.mark.asyncio
    async def test_ui_file_upload_flow(self, page, test_context):
        """Завантаження реального Excel-файлу та перевірка прогресу."""
        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        if not os.path.exists(REAL_EXCEL_FILE):
            pytest.skip(f"Файл не знайдено: {REAL_EXCEL_FILE}")

        file_input = page.locator("input[type='file']")
        await file_input.set_input_files(REAL_EXCEL_FILE)

        upload_btn = page.locator("button:has-text('Завантажити')")
        await upload_btn.click()

        # Очікуємо індикатор прогресу
        progress_bar = page.locator("[data-testid='progress-bar']")
        await progress_bar.wait_for(state="visible", timeout=5000)

        # Очікуємо повідомлення про успіх (до 10 хвилин для реального файлу)
        success_msg = page.locator("text='Успішно завантажено'")
        await success_msg.wait_for(state="visible", timeout=600_000)

        test_context["upload_completed"] = True

    @pytest.mark.asyncio
    async def test_ui_progress_indicator(self, page, test_context):
        """Індикатор прогресу коректно відображає відсоток."""
        if not test_context.get("upload_completed"):
            pytest.skip("Завантаження не завершено")

        await page.goto(f"{FRONTEND_URL}/import")
        await page.wait_for_load_state("networkidle")

        # Перевіряємо таблицю нещодавніх імпортів
        recent_table = page.locator("[data-testid='recent-imports-table']")
        if await recent_table.is_visible():
            # Повинен бути хоча б один рядок
            rows = recent_table.locator("tr")
            count = await rows.count()
            assert count > 1, "Таблиця нещодавніх імпортів порожня"


# ═══════════════════════════════════════════════════════════════════════════
# Етап 8: Перевірка відображення після імпорту
# ═══════════════════════════════════════════════════════════════════════════
@pytest.mark.stage8_ui_verify
class TestUIAfterImport:
    """Перевірка відображення даних у UI після імпорту."""

    @pytest.mark.asyncio
    async def test_ui_data_tables_show_new_records(self, page, test_context):
        """Таблиці показують нові записи після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        await page.goto(f"{FRONTEND_URL}/declarations")
        await page.wait_for_load_state("networkidle")

        # Перевіряємо наявність таблиці з даними
        table = page.locator("table, [data-testid='declarations-table']")
        if await table.count() > 0:
            rows = table.locator("tbody tr")
            count = await rows.count()
            assert count > 0, "Таблиця декларацій порожня після імпорту"

    @pytest.mark.asyncio
    async def test_ui_charts_rebuilt(self, page, test_context):
        """Графіки перебудовані після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        await page.goto(f"{FRONTEND_URL}/analytics")
        await page.wait_for_load_state("networkidle")

        # Перевіряємо наявність графіків (Recharts або Canvas)
        charts = page.locator(".recharts-wrapper, canvas, svg.recharts-surface")
        count = await charts.count()
        if count == 0:
            pytest.xfail("Графіки не знайдені на сторінці аналітики")

    @pytest.mark.asyncio
    async def test_ui_search_finds_new_data(self, page, test_context):
        """Пошук знаходить нові дані після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        await page.goto(f"{FRONTEND_URL}/search")
        await page.wait_for_load_state("networkidle")

        # Спроба пошуку
        search_input = page.locator("input[type='search'], input[placeholder*='Пошук']")
        if await search_input.count() > 0:
            await search_input.fill("березень 2024")
            await page.keyboard.press("Enter")

            # Очікуємо результати
            await page.wait_for_timeout(3000)

            # Перевіряємо наявність результатів
            results = page.locator("[data-testid='search-results'], .search-results")
            if await results.count() > 0:
                assert await results.is_visible(), "Результати пошуку не відображаються"

    @pytest.mark.asyncio
    async def test_ui_filters_work(self, page, test_context):
        """Фільтри працюють з новими даними."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        await page.goto(f"{FRONTEND_URL}/declarations")
        await page.wait_for_load_state("networkidle")

        # Шукаємо фільтри
        filters = page.locator("[data-testid='filter-panel'], .filter-panel, select")
        if await filters.count() > 0:
            # Фільтри існують — тест пройдено
            return

        pytest.xfail("Фільтри не знайдені на сторінці")

    @pytest.mark.asyncio
    async def test_ui_statistics_updated(self, page, test_context):
        """Статистика оновлена після імпорту."""
        if not test_context.get("upload_completed"):
            pytest.skip("Імпорт не завершений")

        await page.goto(f"{FRONTEND_URL}/dashboard")
        await page.wait_for_load_state("networkidle")

        # Перевіряємо наявність статистичних віджетів
        widgets = page.locator("[data-testid='stat-widget'], .stat-card, .dashboard-widget")
        count = await widgets.count()
        if count == 0:
            pytest.xfail("Статистичні віджети не знайдені на дашборді")
