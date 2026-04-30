#!/usr/bin/env python3
"""🧹 COMPLETE PROJECT CLEANUP для PREDATOR Analytics v56.1.4

Комплексне очищення всього проекту від зайвих файлів.
Об'єднує всі cleanup скрипти в один.
"""

from pathlib import Path
import subprocess
import sys

PROJECT_ROOT = Path("/Users/Shared/Predator_60")
SCRIPTS_DIR = PROJECT_ROOT / "scripts"

def run_cleanup_script(script_name: str, description: str):
    """Run a cleanup script."""
    script_path = SCRIPTS_DIR / script_name

    if not script_path.exists():
        return False


    try:
        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=PROJECT_ROOT,
            capture_output=False,
            text=True
        )

        return result.returncode == 0

    except Exception:
        return False


def main():
    """Run all cleanup scripts."""
    response = input("\n❓ Continue with cleanup? (yes/no): ").strip().lower()

    if response != 'yes':
        return


    results = []

    # Step 1: Clean root directory
    results.append(run_cleanup_script(
        "cleanup-project.py",
        "Step 1/4: Cleaning root directory"
    ))

    # Step 2: Clean scripts directory
    results.append(run_cleanup_script(
        "cleanup-scripts-directory.py",
        "Step 2/4: Archiving old scripts"
    ))

    # Step 3: Clean docs directory
    results.append(run_cleanup_script(
        "cleanup-docs-directory.py",
        "Step 3/4: Archiving old documentation"
    ))

    # Step 4: Analyze telegram bots
    results.append(run_cleanup_script(
        "analyze-telegram-bots.py",
        "Step 4/4: Analyzing duplicate apps"
    ))

    # Summary

    success_count = sum(1 for r in results if r)
    total_count = len(results)


    if success_count == total_count:
        pass
    else:
        pass



if __name__ == "__main__":
    main()
