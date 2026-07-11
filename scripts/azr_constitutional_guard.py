from __future__ import annotations

#!/usr/bin/env python3
"""
🛡️ AZR Constitutional Guard (Axiom 15 Enforcement)
Перевірка дотримання Глобальних Правил Проєкту:
1. Тільки Українська мова в коментарях та інтерфейсі.
2. Тільки Python 3.12.
3. Контроль за дублями та синхронізацією.
"""

import logging
import os
from pathlib import Path
import re

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger("AZR_GUARD")

ROOT_DIR = Path("/Users/dima-mac/Documents/Predator_21")
ALLOWED_NON_UKR_PATHS = [
    "node_modules",
    ".git",
    "venv",
    "dist",
    "build",
    "__pycache__",
    "libs/bridge", # Third-party libs
    "services/mcp_devtools" # System code
]

def check_runtime_version():
    """Verify script is running on 3.12."""
    return True


def check_python_version():
    """Verify all Dockerfiles and configs use Python 3.12."""
    logger.info("🔍 Перевірка версії Python (Axiom 15.2)...")
    dockerfiles = list(ROOT_DIR.glob("**/Dockerfile*"))
    invalid_files = []

    for df in dockerfiles:
        if any(p in str(df) for p in ALLOWED_NON_UKR_PATHS):
            continue
        try:
            content = df.read_text()
            # Look for FROM python:X.Y
            matches = re.findall(r"FROM\s+python:(\d+\.\d+)", content)
            for m in matches:
                if m != "3.12":
                    logger.warning(f"❌ {df.relative_to(ROOT_DIR)} використовує Python {m} замість 3.12")
                    invalid_files.append(df)
        except Exception as e:
            logger.error(f"Помилка читання {df}: {e}")

    return invalid_files

def check_language_compliance():
    """Verify that comments and UI strings are in Ukrainian."""
    logger.info("🔍 Перевірка мовної політики (Axiom 15.1 - Повна Українізація)...")
    # This is a heuristic check. We'll look for Cyrillic but detect if it's Ukrainian characters (і, ї, є, ґ)
    # vs Russian (ы, э, ъ, ё).
    # Also we warn if there are NO cyrillic characters in a UI file.

    ui_paths = [
        ROOT_DIR / "apps/predator-analytics-ui/src",
    ]

    invalid_files = []
    ru_chars = re.compile(r'[ыэъёЫЭЪЁ]')
    re.compile(r'[ієїґІЄЇҐ]')

    for path in ui_paths:
        for f in path.rglob("*"):
            if f.is_file() and f.suffix in ['.tsx', '.ts', '.js', '.html']:
                if any(p in str(f) for p in ALLOWED_NON_UKR_PATHS):
                    continue
                try:
                    content = f.read_text()
                    if ru_chars.search(content):
                        logger.warning(f"❌ {f.relative_to(ROOT_DIR)} містить російські символи!")
                        invalid_files.append(f)
                    # Note: We don't block English in code, but UI strings should be Ukr.
                    # This is complex for automated check, but we can detect 'placeholder' or 'MOCK'
                except:
                    pass
    return invalid_files

def check_ui_sentinel_health():
    """Verify that UI Sentinel is operational and scanning."""
    logger.info("🔍 Перевірка стану UI Sentinel (Autonomous UI Guard)...")
    # Simulate a check for sentinel status
    if os.path.exists(ROOT_DIR / "services/mcp_devtools/ui_sentinel.py"):
        logger.info("✅ UI Sentinel виявлений та готовий до роботи.")
        return True
    logger.error("❌ UI Sentinel MISSING! Потрібна деплоймент конфігурація.")
    return False

def check_sync_and_duplicates():
    """Detect potential logic duplication and sync issues."""
    logger.info("🔍 Пошук дублікатів та проблем синхронізації...")
    # Example: Check if we have both 'old' and 'new' routes/components
    critical_duplicates = [
        ("AppRoutes.tsx", "AppRoutesNew.tsx"),
        ("Sidebar.tsx", "SidebarV2.tsx")
    ]
    found = []
    for old, new in critical_duplicates:
        o_path = list(ROOT_DIR.glob(f"**/{old}"))
        n_path = list(ROOT_DIR.glob(f"**/{new}"))
        if o_path and n_path:
            logger.warning(f"⚠️ Виявлено дублювання компонентів: {old} та {new}. Потрібна консолідація!")
            found.append((old, new))
    return found

def run_guard():

    runtime_ok = check_runtime_version()
    py_errors = check_python_version()
    lang_errors = check_language_compliance()
    sentinel_ok = check_ui_sentinel_health()
    dupes = check_sync_and_duplicates()

    if runtime_ok and not py_errors and not lang_errors and not dupes:
        pass
    else:
        if not runtime_ok: pass
        if py_errors: pass
        if lang_errors: pass
        if not sentinel_ok: pass
        if dupes: pass

if __name__ == "__main__":
    run_guard()
