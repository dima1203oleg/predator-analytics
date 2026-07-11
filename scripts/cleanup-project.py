#!/usr/bin/env python3
"""🧹 Cleanup Script для PREDATOR Analytics v56.1.4

Видаляє зайві, дубльовані та застарілі файли з проекту.
Зберігає тільки необхідні production файли.
"""

from pathlib import Path
import shutil

PROJECT_ROOT = Path("/Users/Shared/Predator_60")

# Файли для видалення (застарілі/дубльовані документи)
DOCUMENTS_TO_DELETE = [
    # Дубльовані звіти
    "AUDIT_REPORT.md",
    "CLEANUP_AUDIT.md",
    "EXECUTIVE_SUMMARY.md",
    "FINAL_SUMMARY.md",
    "PRODUCTION_READY_REPORT.md",
    "SPRINT_8_COMPLETION_REPORT.md",
    "SYSTEM_STATUS_DASHBOARD.md",
    "TEST_REPORT.md",
    "SERVER_STATUS_REPORT.md",
    "PIN_SERVER_STATUS.md",

    # MCP-related (тимчасові аналізи)
    "MCP_ANALYSIS_AND_IMPLEMENTATION_PLAN.md",
    "MCP_ANALYSIS_SUMMARY.md",
    "MCP_ANTIGRAVITY_BRIEF.md",
    "MCP_IMPLEMENTATION_ROADMAP.md",

    # NGROK-related (тимчасові налаштування)
    "NGROK_DEPLOY_ACTION_PLAN.md",
    "NGROK_FILES_CREATED.md",
    "NGROK_SETUP_GUIDE.md",

    # Застарілі deployment плани
    "NVIDIA_DEPLOYMENT_PLAN.md",
    "REMOTE_SERVER_GUIDE.md",
    "ROUTING_AND_FALLBACK.md",
    "ULTRA_ROUTER_V5.0_SETUP.md",

    # Пусті файли
    "UI_UX_GUIDE.md",
    "UI_UX_QUICKGUIDE.md",
    "WORKFLOW_ENHANCED_v2.md",

    # Тимчасові статуси
    "SELF_HEALING_LOG.md",
    "EMERGENCY_MODE.md",

    # Великі технічні специфікації (можна перемістити в docs/)
    "V4.0_PREDATOR_TECHNICAL_SPECIFICATION.md",
    "WORKFLOW_ANALYSIS_ENHANCED.md",
]

# Скрипти для видалення (тимчасові fix скрипти)
SCRIPTS_TO_DELETE = [
    "fix_all2.py",
    "fix_kafka.py",
    "fix_mypy_init.py",
    "fix_ruff_final_10.py",
    "fix_ruff_final_19.py",
    "fix_ruff_script.py",
    "update_market_page.js",
    "update_sidebar.py",
    "update_sidebar_look.py",
]

# Backup файли
BACKUP_FILES_TO_DELETE = [
    "mock-api-server.mjs.bak",
]

# Тимчасові директорії
TEMP_DIRS_TO_DELETE = [
    ".antigravity_tmp",
    ".proxyai",
    ".ruff_cache",
    ".turbo",
    "temp_azr",
    "mlruns",
    "test_run",
    "coverage",
]

# Застарілі конфіги
DEPRECATED_CONFIGS = [
    "actionlint",  # 5MB binary - не потрібен
]


def delete_file(filepath: Path, reason: str):
    """Delete a file if it exists."""
    if filepath.exists():
        try:
            if filepath.is_file():
                filepath.unlink()
            elif filepath.is_dir():
                shutil.rmtree(filepath)
        except Exception:
            pass


def cleanup_project():
    """Main cleanup function."""
    # Delete documents
    for doc in DOCUMENTS_TO_DELETE:
        delete_file(PROJECT_ROOT / doc, "duplicate/outdated")

    # Delete temporary scripts
    for script in SCRIPTS_TO_DELETE:
        delete_file(PROJECT_ROOT / script, "temporary fix script")

    # Delete backup files
    for backup in BACKUP_FILES_TO_DELETE:
        delete_file(PROJECT_ROOT / backup, "backup file")

    # Delete temp directories
    for temp_dir in TEMP_DIRS_TO_DELETE:
        delete_file(PROJECT_ROOT / temp_dir, "temporary directory")

    # Delete deprecated configs
    for config in DEPRECATED_CONFIGS:
        delete_file(PROJECT_ROOT / config, "deprecated/large binary")



if __name__ == "__main__":
    cleanup_project()
