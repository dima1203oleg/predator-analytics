#!/usr/bin/env python3
"""
🧹 Scripts Directory Cleanup для PREDATOR Analytics v56.1.4

Архівує застарілі скрипти та залишає тільки актуальні production скрипти.
"""

import os
import shutil
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path("/Users/Shared/Predator_60")
SCRIPTS_DIR = PROJECT_ROOT / "scripts"
ARCHIVE_DIR = SCRIPTS_DIR / "archive"

# Production scripts to KEEP (актуальні та необхідні)
KEEP_SCRIPTS = {
    # Deployment
    "deploy-production.sh",
    
    # Git automation
    "auto-commit-push.py",
    "make_deploy_scripts_executable.py",
    
    # Project cleanup
    "cleanup-project.py",
    
    # Health checks
    "health_check.sh",
    "check_system_health.sh",
    
    # Testing
    "run_tests.sh",
    "test_all_apis.sh",
    
    # Utilities
    "predatorctl.py",
    "ml_cli.py",
    
    # Documentation
    "README.md",
}

# Patterns to ARCHIVE (перемістити в archive/)
ARCHIVE_PATTERNS = [
    # Old deployment scripts
    "deploy*.sh",
    "deploy_*.sh",
    
    # Fix scripts (тимчасові)
    "fix*.py",
    "fix*.sh",
    
    # Test/diagnostic scripts
    "test_*.py",
    "test_*.sh",
    "check_*.py",
    "check_*.sh",
    "verify_*.py",
    "verify_*.sh",
    "debug*.py",
    "debug*.sh",
    "diagnose*.py",
    
    # Old version scripts
    "*v25*",
    "*v29*",
    "*v30*",
    "*v45*",
    
    # NGROK scripts (тимчасові)
    "*ngrok*",
    
    # Server connection scripts
    "server-*.sh",
    "sync-*.sh",
    "remote_*.sh",
    
    # Telegram bot scripts (якщо не використовується)
    "telegram_*.py",
    "telegram_*.sh",
    
    # Voice/Audio scripts (тимчасові)
    "voice_*.sh",
    "gen_voice*.sh",
    
    # Autonomous/AZR scripts (тимчасові експерименти)
    "*autonomous*",
    "*azr*",
    "*eternal*",
    "*self_healing*",
    
    # Update scripts
    "update*.py",
    "update*.sh",
    
    # Setup scripts (вже виконані)
    "setup_*.sh",
    "setup_*.py",
    "install_*.sh",
    
    # Chaos/testing
    "chaos_*.py",
    "stress_test*.py",
    "red_team*.py",
    
    # Backup/restore
    "backup.sh",
    "restore.sh",
    
    # Log files
    "*.log",
    "*.out",
    
    # Other temporary
    "brute-*.sh",
    "force*.sh",
    "emergency*.sh",
    "hotfix*.sh",
    "magic_*.sh",
    "simulate*.py",
    "seed_*.py",
    "inject*.py",
}

# Files to DELETE completely (не потрібні взагалі)
DELETE_FILES = [
    ".DS_Store",
    "bootstrap.sh",  # empty file
    "migrate_structure.sh",  # empty file
    "safe_boot.sh",  # empty file
    "sync_to_ai_studio.sh",  # empty file
    "sync_to_github.sh",  # empty file
    "predatorctl.py.bak",  # backup
]


def archive_script(filepath: Path, reason: str):
    """Move script to archive directory."""
    if not filepath.exists():
        return
    
    try:
        ARCHIVE_DIR.mkdir(exist_ok=True)
        dest = ARCHIVE_DIR / filepath.name
        
        # Add timestamp if file already exists in archive
        if dest.exists():
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            dest = ARCHIVE_DIR / f"{filepath.stem}_{timestamp}{filepath.suffix}"
        
        shutil.move(str(filepath), str(dest))
        print(f"✓ Archived: {filepath.name} → archive/ ({reason})")
    except Exception as e:
        print(f"✗ Failed to archive {filepath.name}: {e}")


def delete_file(filepath: Path, reason: str):
    """Delete file completely."""
    if not filepath.exists():
        return
    
    try:
        filepath.unlink()
        print(f"✓ Deleted: {filepath.name} ({reason})")
    except Exception as e:
        print(f"✗ Failed to delete {filepath.name}: {e}")


def cleanup_scripts():
    """Main cleanup function."""
    print("🧹 Starting scripts directory cleanup...\n")
    
    archived_count = 0
    deleted_count = 0
    kept_count = 0
    
    # First, delete unnecessary files
    print("🗑️ Deleting unnecessary files...")
    for filename in DELETE_FILES:
        filepath = SCRIPTS_DIR / filename
        if filepath.exists():
            delete_file(filepath, "unnecessary/empty/backup")
            deleted_count += 1
    
    # Then archive old scripts
    print("\n📦 Archiving outdated scripts...")
    for filepath in sorted(SCRIPTS_DIR.iterdir()):
        if not filepath.is_file():
            continue
        
        filename = filepath.name
        
        # Skip if in keep list
        if filename in KEEP_SCRIPTS:
            kept_count += 1
            continue
        
        # Skip if already in archive
        if "archive" in str(filepath):
            continue
        
        # Check if matches any archive pattern
        should_archive = False
        for pattern in ARCHIVE_PATTERNS:
            if pattern.startswith("*") and pattern.endswith("*"):
                # Contains pattern
                if pattern[1:-1] in filename:
                    should_archive = True
                    break
            elif pattern.startswith("*"):
                # Ends with pattern
                if filename.endswith(pattern[1:]):
                    should_archive = True
                    break
            elif pattern.endswith("*"):
                # Starts with pattern
                if filename.startswith(pattern[:-1]):
                    should_archive = True
                    break
            else:
                # Exact match
                if filename == pattern:
                    should_archive = True
                    break
        
        if should_archive:
            archive_script(filepath, "outdated/temporary")
            archived_count += 1
    
    print(f"\n✅ Scripts cleanup completed!")
    print(f"\n📊 Summary:")
    print(f"   Scripts kept: {kept_count}")
    print(f"   Scripts archived: {archived_count}")
    print(f"   Files deleted: {deleted_count}")
    print(f"\n💡 Archived scripts are in: scripts/archive/")
    print(f"   You can review and delete them later if needed.")


if __name__ == "__main__":
    cleanup_scripts()

