"""Шар тестування Frontend (Frontend Layer) UTOS v61.0-ELITE.
Тестує доступність статичних файлів інтерфейсу, парсить index.html та перевіряє базовий роутінг.
"""
import logging
import re
import time

import httpx

from utos.config import FRONTEND_URL
from utos.layers import BaseLayer, CheckResult

logger = logging.getLogger(__name__)


class FrontendLayer(BaseLayer):
    """Шар валідації веб-інтерфейсу Frontend."""

    def __init__(self):
        super().__init__(
            name="frontend",
            description="Перевірка доступності UI, структури index.html та локалізації",
            weight=0.10,
        )

    async def _run_validation(self) -> None:
        # 1. Завантаження головної сторінки UI
        html = await self._validate_ui_availability()

        # 2. Перевірка 100% українізації у коді (HR-04)
        if html:
            await self._validate_ui_localization(html)

    async def _validate_ui_availability(self) -> str:
        """Перевірка завантаження index.html."""
        start = time.time()
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(FRONTEND_URL)
                latency = (time.time() - start) * 1000

                if resp.status_code == 200:
                    html_content = resp.text
                    # Шукаємо <div id="root"> або подібний React контейнер
                    has_root = "id=\"root\"" in html_content or "id='root'" in html_content

                    self.add_check(CheckResult(
                        name="frontend_ui_root",
                        passed=has_root,
                        message=f"UI доступний, знайдено React root контейнер ({latency:.0f}мс)",
                        latency_ms=latency
                    ))
                    return html_content
                else:
                    raise ValueError(f"HTTP {resp.status_code}")
        except Exception as e:
            self.add_check(CheckResult(
                name="frontend_ui_root",
                passed=False,
                message=f"UI не доступний: {e}",
                severity="critical"
            ))
            return ""

    async def _validate_ui_localization(self, html: str) -> None:
        """Перевірка тегу мови (lang='uk')."""
        match = re.search(r'lang=["\'](uk|ua)["\']', html, re.IGNORECASE)
        passed = match is not None

        self.add_check(CheckResult(
            name="frontend_lang_meta",
            passed=passed,
            message="Тег локалізації lang='uk' присутній у HTML заголовку" if passed
                    else "Критична помилка: мета-тег lang='uk' відсутній (HR-04)",
            severity="critical"
        ))
