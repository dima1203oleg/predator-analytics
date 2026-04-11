#!/usr/bin/env python3
"""
🧹 Cleanup Script для PREDATOR Analytics v56.1.4

Видаляє зайві, дубльовані та застарілі файли з проекту.
Зберігає тільки необхідні production файли.
"""

import os
import shutil
from pathlib import Path

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
                print(f"✓ Deleted file: {filepath.relative_to(PROJECT_ROOT)} ({reason})")
            elif filepath.is_dir():
                shutil.rmtree(filepath)
                print(f"✓ Deleted directory: {filepath.relative_to(PROJECT_ROOT)} ({reason})")
        except Exception as e:
            print(f"✗ Failed to delete {filepath}: {e}")


def cleanup_project():
    """Main cleanup function."""
    print("🧹 Starting project cleanup...\n")
    
    # Delete documents
    print("📄 Cleaning up duplicate/outdated documents...")
    for doc in DOCUMENTS_TO_DELETE:
        delete_file(PROJECT_ROOT / doc, "duplicate/outdated")
    
    # Delete temporary scripts
    print("\n🔧 Cleaning up temporary fix scripts...")
    for script in SCRIPTS_TO_DELETE:
        delete_file(PROJECT_ROOT / script, "temporary fix script")
    
    # Delete backup files
    print("\n💾 Cleaning up backup files...")
    for backup in BACKUP_FILES_TO_DELETE:
        delete_file(PROJECT_ROOT / backup, "backup file")
    
    # Delete temp directories
    print("\n🗑️ Cleaning up temporary directories...")
    for temp_dir in TEMP_DIRS_TO_DELETE:
        delete_file(PROJECT_ROOT / temp_dir, "temporary directory")
    
    # Delete deprecated configs
    print("\n⚙️ Cleaning up deprecated configurations...")
    for config in DEPRECATED_CONFIGS:
        delete_file(PROJECT_ROOT / config, "deprecated/large binary")
    
    print("\n✅ Cleanup completed!")
    print("\n📊 Summary:")
    print(f"   Documents deleted: {len(DOCUMENTS_TO_DELETE)}")
    print(f"   Scripts deleted: {len(SCRIPTS_TO_DELETE)}")
    print(f"   Backups deleted: {len(BACKUP_FILES_TO_DELETE)}")
    print(f"   Temp dirs deleted: {len(TEMP_DIRS_TO_DELETE)}")
    print(f"   Deprecated configs: {len(DEPRECATED_CONFIGS)}")
    print(f"\n💡 Estimated space saved: ~50-100 MB")


if __name__ == "__main__":
    cleanup_project()
