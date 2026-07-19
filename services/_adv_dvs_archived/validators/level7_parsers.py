import os
"""
Рівень 7: Перевірка парсерів.
Telethon, Playwright, Scrapy, BeautifulSoup, PyMuPDF, OCR/Tesseract,
HTML/CSV/Excel/XML/JSON/DOCX Parser.
"""
import importlib
import asyncio
from pathlib import Path
from typing import Dict, Any

from .base import BaseValidator, CheckResult
TARGET_HOST = os.getenv("TARGET_HOST", "localhost")


class ParsersValidator(BaseValidator):
    def __init__(self):
        super().__init__(
            name="level7_parsers",
            description="Парсери: Telethon, Scrapy, BS4, PyMuPDF, OCR, файлові парсери",
        )

    async def _run_validation(self):
        # 1. Перевірка Python-бібліотек парсерів
        await self._check_parser_libraries()
        # 2. Перевірка модулів парсерів в проекті
        await self._check_parser_modules()
        # 3. Перевірка OCR/Tesseract
        await self._check_tesseract()

    async def _check_parser_libraries(self):
        """Перевірка доступності бібліотек парсерів."""
        libs = {
            "beautifulsoup4": "bs4",
            "lxml": "lxml",
            "openpyxl": "openpyxl",
            "pandas": "pandas",
            "httpx": "httpx",
        }

        # Бібліотеки які можуть бути не встановлені локально (але мають бути в Docker)
        optional_libs = {
            "telethon": "telethon",
            "scrapy": "scrapy",
            "pymupdf": "fitz",
            "pytesseract": "pytesseract",
            "playwright": "playwright",
            "python-docx": "docx",
        }

        for pkg_name, import_name in libs.items():
            try:
                mod = importlib.import_module(import_name)
                version = getattr(mod, "__version__", "unknown")
                self.add_check(CheckResult(
                    name=f"lib_{pkg_name}",
                    passed=True,
                    message=f"{pkg_name} v{version} доступний",
                    severity="info",
                    details={"version": version},
                ))
            except ImportError:
                self.add_check(CheckResult(
                    name=f"lib_{pkg_name}",
                    passed=False,
                    message=f"{pkg_name} не встановлений",
                    severity="warning",
                ))

        for pkg_name, import_name in optional_libs.items():
            try:
                mod = importlib.import_module(import_name)
                version = getattr(mod, "__version__", "unknown")
                self.add_check(CheckResult(
                    name=f"lib_{pkg_name}",
                    passed=True,
                    message=f"{pkg_name} v{version} доступний",
                    severity="info",
                    details={"version": version},
                ))
            except ImportError:
                self.add_check(CheckResult(
                    name=f"lib_{pkg_name}",
                    passed=False,
                    message=f"{pkg_name} не встановлений (потрібен у Docker-контейнері)",
                    severity="info",  # Не критично — працює в контейнері
                ))

    async def _check_parser_modules(self):
        """Перевірка модулів парсерів у кодовій базі."""
        project_root = Path(os.getenv("PREDATOR_ROOT", Path(__file__).resolve().parent.parent.parent.parent))
        parser_locations = [
            project_root / "services" / "ingestion-worker" / "parsers",
            project_root / "services" / "osint-service",
            project_root / "libs" / "predator-common",
        ]

        for loc in parser_locations:
            if loc.exists():
                py_files = list(loc.rglob("*.py"))
                self.add_check(CheckResult(
                    name=f"parser_module_{loc.name}",
                    passed=len(py_files) > 0,
                    message=f"Модуль {loc.name}: {len(py_files)} Python файлів",
                    severity="info",
                    details={"path": str(loc), "files": [f.name for f in py_files[:10]]},
                ))
            else:
                self.add_check(CheckResult(
                    name=f"parser_module_{loc.name}",
                    passed=False,
                    message=f"Модуль {loc.name} не знайдено",
                    severity="warning",
                    details={"path": str(loc)},
                ))

    async def _check_tesseract(self):
        """Перевірка OCR (Tesseract)."""
        try:
            proc = await asyncio.create_subprocess_exec(
                "tesseract", "--version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=5)
            output = (stdout or stderr).decode().strip().split("\n")[0]
            self.add_check(CheckResult(
                name="tesseract_ocr",
                passed=proc.returncode == 0,
                message=f"Tesseract: {output}" if proc.returncode == 0
                        else "Tesseract не встановлений",
                severity="info",
            ))
        except (FileNotFoundError, asyncio.TimeoutError):
            self.add_check(CheckResult(
                name="tesseract_ocr",
                passed=False,
                message="Tesseract OCR не знайдено в системі",
                severity="info",
            ))
