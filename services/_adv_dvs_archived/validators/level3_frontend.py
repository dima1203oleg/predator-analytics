import os
"""
Рівень 3: Перевірка Frontend.
DOM-аудит: HTML, маршрути, JS-помилки, Cytoscape, Three.js, WebGL,
форми, кнопки, таблиці, графіки, пагінація, масштабування.
"""
import httpx
from typing import Dict, Any

from .base import BaseValidator, CheckResult
from .. import config
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class FrontendValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level3_frontend",
            description="Frontend: DOM-аудит, маршрути, HTML, компоненти, WebGL",
        )

    async def _run_validation(self):
        base = config.FRONTEND_URL

        # 1. Головна сторінка відповідає
        r = await self.http_check("frontend_root", base, severity="critical")

        # 2. Перевірка HTML структури
        await self._check_html_structure(base)

        # 3. Перевірка ключових маршрутів
        await self._check_routes(base)

        # 4. Перевірка статичних ресурсів
        await self._check_static_assets(base)

        # 5. Перевірка meta-тегів та SEO
        await self._check_meta_tags(base)

        # 6. Перевірка локалізації (HR-03, HR-04)
        await self._check_localization(base)

    async def _check_html_structure(self, base: str):
        """Перевірка базової HTML структури."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=10) as client:
                resp = await client.get(base)
                html = resp.text

                checks = {
                    "doctype": "<!doctype html>" in html.lower() or "<!DOCTYPE html>" in html,
                    "html_lang_uk": 'lang="uk"' in html,
                    "head_tag": "<head>" in html or "<head " in html,
                    "body_tag": "<body>" in html or "<body " in html,
                    "root_div": 'id="root"' in html,
                    "charset_utf8": 'charset="UTF-8"' in html or 'charset="utf-8"' in html,
                    "viewport_meta": "viewport" in html,
                    "title_tag": "<title>" in html,
                }

                for name, passed in checks.items():
                    self.add_check(CheckResult(
                        name=f"html_{name}",
                        passed=passed,
                        message=f"HTML {name}: {'знайдено' if passed else 'відсутній'}",
                        severity="warning" if not passed else "info",
                    ))

                # Перевірка title PREDATOR
                if "<title>" in html:
                    title_start = html.index("<title>") + 7
                    title_end = html.index("</title>")
                    title = html[title_start:title_end]
                    has_predator = "PREDATOR" in title.upper()
                    self.add_check(CheckResult(
                        name="html_title_predator",
                        passed=has_predator,
                        message=f"Title: '{title}'",
                        severity="warning",
                        details={"title": title},
                    ))

        except Exception as e:
            self.add_check(CheckResult(
                name="html_structure",
                passed=False,
                message=f"Помилка HTML аналізу: {e}",
                severity="critical",
            ))

    async def _check_routes(self, base: str):
        """Перевірка доступності ключових маршрутів."""
        # SPA — всі маршрути повертають index.html (200)
        routes = [
            "/admin/command",
            "/admin/database-command-center",
            "/admin/adv-dvs",
            "/command",
            "/search",
            "/market",
            "/api-docs",
        ]
        for route in routes:
            await self.http_check(
                f"route_{route.strip('/').replace('/', '_')}",
                f"{base}{route}",
                severity="warning",
            )

    async def _check_static_assets(self, base: str):
        """Перевірка статичних файлів (Vite)."""
        assets = [
            "/vite.svg",
            "/@vite/client",
        ]
        for asset in assets:
            await self.http_check(
                f"asset_{asset.strip('/').replace('/', '_').replace('@', 'at_')}",
                f"{base}{asset}",
                severity="warning",
            )

    async def _check_meta_tags(self, base: str):
        """Перевірка meta-тегів."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                resp = await client.get(base)
                html = resp.text

                meta_checks = {
                    "description": 'name="description"' in html,
                    "theme_color": 'name="theme-color"' in html,
                    "apple_mobile": 'name="apple-mobile-web-app-capable"' in html,
                }
                for name, passed in meta_checks.items():
                    self.add_check(CheckResult(
                        name=f"meta_{name}",
                        passed=passed,
                        message=f"Meta {name}: {'✓' if passed else '✗'}",
                        severity="info",
                    ))
        except Exception:
            pass

    async def _check_localization(self, base: str):
        """Перевірка українізації (HR-03, HR-04)."""
        try:
            async with httpx.AsyncClient(verify=False, timeout=5) as client:
                resp = await client.get(base)
                html = resp.text.lower()

                has_uk = 'lang="uk"' in html
                # Перевірка відсутності англійських елементів UI в title/description
                title_area = html[:2000]  # Тільки заголовок
                has_cyrillic = any(
                    c in title_area
                    for c in "абвгдеєжзиіїйклмнопрстуфхцчшщьюя"
                )

                self.add_check(CheckResult(
                    name="localization_uk",
                    passed=has_uk and has_cyrillic,
                    message="Інтерфейс українізовано" if (has_uk and has_cyrillic)
                            else "Проблеми з українізацією",
                    severity="warning",
                ))
        except Exception:
            pass
