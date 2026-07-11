from __future__ import annotations

#!/usr/bin/env python3
"""Швидка перевірка файлів Autonomous Intelligence v2.0
Перевіряє наявність всіх створених файлів.
"""
import os
from pathlib import Path


def check_file(path, description):
    """Перевірити наявність файлу."""
    if os.path.exists(path):
        os.path.getsize(path)
        return True
    return False

def main():

    project_root = Path(__file__).parent.parent

    files_to_check = [
        # Код
        (
            project_root / "services/api_gateway/app/services/autonomous_intelligence_v2.py",
            "Autonomous Intelligence v2.0 - Основний код"
        ),
        (
            project_root / "services/api_gateway/app/api/v45_routes.py",
            "API Routes - Endpoints для AI v2.0"
        ),
        (
            project_root / "services/api_gateway/app/main.py",
            "Main Application - Інтеграція AI v2.0"
        ),

        # Workflows
        (
            project_root / ".agent/workflows/ultra_autonomous.md",
            "Ultra Autonomous Workflow"
        ),

        # Документація
        (
            project_root / "AUTONOMY_ANALYSIS_v45.md",
            "Детальний аналіз автономії"
        ),
        (
            project_root / "AUTONOMY_UPGRADE_SUMMARY.md",
            "Короткий summary"
        ),
        (
            project_root / "AUTONOMY_FINAL_REPORT.md",
            "Фінальний звіт"
        ),
        (
            project_root / "AUTONOMOUS_INTELLIGENCE_README.md",
            "README для швидкого старту"
        ),
        (
            project_root / "AUTONOMY_COMPLETE.md",
            "Інструкції запуску"
        ),

        # Тести та скрипти
        (
            project_root / "tests/test_autonomous_intelligence_v2.py",
            "Тести для AI v2.0"
        ),
        (
            project_root / "scripts/check_autonomous_system.py",
            "Скрипт перевірки системи"
        ),
        (
            project_root / "scripts/demo_autonomous_intelligence.py",
            "Демонстраційний скрипт"
        ),
    ]


    found = 0
    total_size = 0

    for file_path, description in files_to_check:
        if check_file(file_path, description):
            found += 1
            total_size += os.path.getsize(file_path)


    if found == len(files_to_check):
        pass
    else:
        pass


if __name__ == "__main__":
    main()
